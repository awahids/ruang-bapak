-- Ruang Bapak: core social schema (profiles, posts, comments, likes).
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth user, created automatically on sign up.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 280),
  location text not null default '' check (char_length(location) <= 60),
  avatar_color text not null default 'hsl(28 33% 41%)',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- `verified` is granted by moderators only, so users may update just these columns.
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, location, avatar_color) on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  palette text[] := array[
    'hsl(95 22% 38%)', 'hsl(28 33% 41%)', 'hsl(210 22% 45%)',
    'hsl(26 40% 42%)', 'hsl(205 14% 41%)', 'hsl(340 22% 42%)'
  ];
  new_name text;
  base text;
  candidate text;
begin
  new_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Bapak Baru'
  );

  base := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then
    base := 'bapak' || base;
  end if;
  base := left(base, 24);

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := base || floor(random() * 10000)::int::text;
  end loop;

  insert into public.profiles (id, username, display_name, bio, avatar_color)
  values (
    new.id,
    candidate,
    left(new_name, 60),
    left(coalesce(trim(new.raw_user_meta_data ->> 'joke'), ''), 280),
    palette[1 + floor(random() * array_length(palette, 1))::int]
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Posts. Rows are only directly readable by their author; everyone else reads
-- through `posts_feed`, which hides the author of anonymous posts.
-- ---------------------------------------------------------------------------
create table public.posts (
  id bigint generated always as identity primary key,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category text not null check (category in ('status', 'curhat', 'diskusi', 'checkin', 'komunitas', 'profil')),
  tag text not null check (char_length(tag) between 1 and 40),
  tag_tone text not null default 'sage' check (tag_tone in ('sage', 'clay', 'plum', 'blue')),
  body text not null check (char_length(body) between 1 and 2000),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_category_created_at_idx on public.posts (category, created_at desc);
create index posts_author_id_idx on public.posts (author_id);

alter table public.posts enable row level security;

create policy "Authors read their own posts"
  on public.posts for select
  to authenticated
  using ((select auth.uid()) = author_id);

create policy "Authors create posts"
  on public.posts for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Authors delete their own posts"
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- ---------------------------------------------------------------------------
-- Comments (nested through parent_id; a reply must belong to the same post).
-- ---------------------------------------------------------------------------
create table public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  parent_id bigint,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique (id, post_id),
  foreign key (parent_id, post_id) references public.comments (id, post_id) on delete cascade
);

create index comments_post_id_idx on public.comments (post_id, created_at);
create index comments_author_id_idx on public.comments (author_id);

alter table public.comments enable row level security;

create policy "Comments are readable by everyone"
  on public.comments for select
  to anon, authenticated
  using (true);

create policy "Users create comments as themselves"
  on public.comments for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Users delete their own comments"
  on public.comments for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- ---------------------------------------------------------------------------
-- Likes ("Aman" reactions) on posts.
-- ---------------------------------------------------------------------------
create table public.post_likes (
  post_id bigint not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_user_id_idx on public.post_likes (user_id);

alter table public.post_likes enable row level security;

create policy "Users read their own likes"
  on public.post_likes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users like as themselves"
  on public.post_likes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users remove their own likes"
  on public.post_likes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Public feed view. It runs with the owner's rights (security_invoker = false)
-- on purpose: it is the only public window onto `posts`, and it masks the
-- author of anonymous posts for everyone except the author themself.
-- ---------------------------------------------------------------------------
create view public.posts_feed
with (security_invoker = false)
as
select
  p.id,
  p.category,
  p.tag,
  p.tag_tone,
  p.body,
  p.is_anonymous,
  p.created_at,
  case when p.is_anonymous and p.author_id is distinct from auth.uid() then null else p.author_id end as author_id,
  coalesce(p.author_id = auth.uid(), false) as is_mine,
  case when p.is_anonymous then null else pr.username end as author_username,
  case when p.is_anonymous then null else pr.display_name end as author_display_name,
  case when p.is_anonymous then null else pr.avatar_color end as author_avatar_color,
  case when p.is_anonymous then false else pr.verified end as author_verified,
  (select count(*) from public.post_likes l where l.post_id = p.id)::int as like_count,
  (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count,
  exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me
from public.posts p
join public.profiles pr on pr.id = p.author_id;

revoke all on public.posts_feed from anon, authenticated;
grant select on public.posts_feed to anon, authenticated;
