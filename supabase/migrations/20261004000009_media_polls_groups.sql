-- Ruang Bapak: profile photos, post images, polls, bookmarks, Paguyuban groups
-- and Absen Pak attendance.
--
-- Written without DROP statements so it can be applied through tools that
-- hold destructive statements for confirmation.

-- ---------------------------------------------------------------------------
-- Profile photos. Google sign-ups bring their own picture; members can also
-- upload one to the rb-avatars bucket.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column avatar_url text check (avatar_url is null or (avatar_url ~ '^https?://' and char_length(avatar_url) <= 1000));

grant update (avatar_url) on public.profiles to authenticated;

update public.profiles p
set avatar_url = coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where u.id = p.id
  and p.avatar_url is null
  and coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture') ~ '^https?://'
  and char_length(coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')) <= 1000;

create or replace function public.handle_new_user()
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
  photo text;
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

  photo := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
  if photo !~ '^https?://' or char_length(photo) > 1000 then
    photo := null;
  end if;

  insert into public.profiles (id, username, display_name, bio, avatar_color, avatar_url)
  values (
    new.id,
    candidate,
    left(new_name, 60),
    left(coalesce(trim(new.raw_user_meta_data ->> 'joke'), ''), 280),
    palette[1 + floor(random() * array_length(palette, 1))::int],
    photo
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: public buckets (images are shown by URL), uploads only into the
-- member's own folder: <user id>/<file>.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('rb-avatars', 'rb-avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('rb-post-images', 'rb-post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Ruang Bapak members upload their own images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('rb-avatars', 'rb-post-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Ruang Bapak members read their own images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('rb-avatars', 'rb-post-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Ruang Bapak members replace their own images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('rb-avatars', 'rb-post-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Ruang Bapak members delete their own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('rb-avatars', 'rb-post-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- Paguyuban groups. Anyone signed in can start one and join or leave freely.
-- ---------------------------------------------------------------------------
create table public.groups (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name text not null check (char_length(trim(name)) between 3 and 60),
  description text not null default '' check (char_length(description) <= 280),
  icon text not null default 'users' check (icon in ('users', 'wrench', 'baby', 'trending-up', 'coffee', 'book', 'heart', 'bike')),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id bigint not null references public.groups (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_id_idx on public.group_members (user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "Groups are readable by everyone"
  on public.groups for select
  to anon, authenticated
  using (true);

create policy "Members start groups as themselves"
  on public.groups for insert
  to authenticated
  with check ((select auth.uid()) = created_by);

create policy "Group members are readable by everyone"
  on public.group_members for select
  to anon, authenticated
  using (true);

create policy "Members join as themselves"
  on public.group_members for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Members leave as themselves"
  on public.group_members for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- A readable slug from the name ("Hobi Bengkel" -> "hobi-bengkel"), made unique.
create function public.set_group_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
begin
  base := trim(both '-' from regexp_replace(lower(new.name), '[^a-z0-9]+', '-', 'g'));
  if base = '' then
    base := 'grup';
  end if;
  base := trim(both '-' from left(base, 50));

  candidate := base;
  while exists (select 1 from public.groups where slug = candidate) loop
    candidate := base || '-' || floor(random() * 10000)::int::text;
  end loop;

  new.slug := candidate;
  new.name := trim(new.name);
  return new;
end;
$$;

create trigger set_group_slug
  before insert on public.groups
  for each row execute function public.set_group_slug();

-- Whoever starts a group is its first member.
create function public.join_created_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.group_members (group_id, user_id) values (new.id, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger join_created_group
  after insert on public.groups
  for each row execute function public.join_created_group();

revoke execute on function public.set_group_slug(), public.join_created_group() from public, anon, authenticated;

create view public.groups_overview
with (security_invoker = true)
as
select
  g.id,
  g.slug,
  g.name,
  g.description,
  g.icon,
  g.created_by,
  g.created_at,
  (select count(*) from public.group_members m where m.group_id = g.id)::int as member_count,
  exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()) as is_member
from public.groups g;

insert into public.groups (slug, name, description, icon, created_by) values
  ('hobi-bengkel', 'Hobi Bengkel', 'Bagi bapak yang suka oprek mesin sendiri.', 'wrench', null),
  ('parenting-balita', 'Parenting Balita', 'Tips sabar ngadepin anak GTM.', 'baby', null),
  ('investor-bapak', 'Investor Bapak', 'Paham saham biar cicilan aman.', 'trending-up', null);

-- ---------------------------------------------------------------------------
-- Posts: an optional image, an optional poll (2-4 options) and an optional
-- group. Group posts are written by members only.
-- ---------------------------------------------------------------------------
create function public.valid_poll_options(options text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select options is null or (
    cardinality(options) between 2 and 4
    and array_ndims(options) = 1
    and not exists (select 1 from unnest(options) o where o is null or char_length(trim(o)) not between 1 and 80)
  );
$$;

alter table public.posts
  add column image_path text check (image_path is null or (image_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$' and char_length(image_path) <= 200)),
  add column poll_options text[] check (public.valid_poll_options(poll_options)),
  add column group_id bigint references public.groups (id) on delete set null;

-- Image paths start with the uploader's user id, so anonymous posts carry no
-- image: it would reveal who wrote them.
alter table public.posts
  add constraint posts_anonymous_without_image check (not is_anonymous or image_path is null);

create index posts_group_id_created_at_idx on public.posts (group_id, created_at desc) where group_id is not null;

alter policy "Authors create posts" on public.posts
  with check (
    (select auth.uid()) = author_id
    and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text)
    and (group_id is null or exists (
      select 1 from public.group_members m where m.group_id = posts.group_id and m.user_id = (select auth.uid())
    ))
  );

-- ---------------------------------------------------------------------------
-- Poll votes: one per member per poll, changeable. Counts are public through
-- posts_feed; who voted for what is not.
-- ---------------------------------------------------------------------------
create table public.poll_votes (
  post_id bigint not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  option smallint not null check (option between 0 and 3),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index poll_votes_user_id_idx on public.poll_votes (user_id);

alter table public.poll_votes enable row level security;

-- Number of options on a poll, readable regardless of who wrote the post.
create function public.poll_option_count(post bigint)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select cardinality(p.poll_options) from public.posts p where p.id = post and p.hidden_at is null;
$$;

revoke execute on function public.poll_option_count(bigint) from public, anon;
grant execute on function public.poll_option_count(bigint) to authenticated;

create policy "Members read their own votes"
  on public.poll_votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members vote as themselves"
  on public.poll_votes for insert
  to authenticated
  with check ((select auth.uid()) = user_id and option < coalesce(public.poll_option_count(post_id), 0));

create policy "Members change their own vote"
  on public.poll_votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and option < coalesce(public.poll_option_count(post_id), 0));

create policy "Members withdraw their own vote"
  on public.poll_votes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Bookmarks ("Simpan"), private to each member.
-- ---------------------------------------------------------------------------
create table public.bookmarks (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  post_id bigint not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index bookmarks_post_id_idx on public.bookmarks (post_id);

alter table public.bookmarks enable row level security;

create policy "Members read their own bookmarks"
  on public.bookmarks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members bookmark as themselves"
  on public.bookmarks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Members remove their own bookmarks"
  on public.bookmarks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Absen Pak: one attendance entry per member per day (WIB), private.
-- ---------------------------------------------------------------------------
create table public.attendance (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  day date not null default ((now() at time zone 'Asia/Jakarta')::date),
  status text not null check (status in ('hadir', 'izin', 'sakit', 'lembur')),
  note text not null default '' check (char_length(note) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.attendance enable row level security;

create policy "Members read their own attendance"
  on public.attendance for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members record their own attendance"
  on public.attendance for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Members update their own attendance"
  on public.attendance for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Feed and inbox views: new columns are appended so existing ones keep their
-- position (required by CREATE OR REPLACE VIEW).
-- ---------------------------------------------------------------------------
create or replace view public.posts_feed
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
  (
    select count(*) from public.comments c
    where c.post_id = p.id
      and c.hidden_at is null
      and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = c.author_id)
  )::int as comment_count,
  exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me,
  case when p.is_anonymous then null else pr.avatar_url end as author_avatar_url,
  p.image_path,
  p.poll_options,
  case when p.poll_options is null then null else (
    select array_agg((select count(*) from public.poll_votes v where v.post_id = p.id and v.option = i)::int order by i)
    from generate_series(0, cardinality(p.poll_options) - 1) i
  ) end as poll_counts,
  (select v.option::int from public.poll_votes v where v.post_id = p.id and v.user_id = auth.uid()) as my_vote,
  exists (select 1 from public.bookmarks bm where bm.post_id = p.id and bm.user_id = auth.uid()) as bookmarked_by_me,
  p.group_id,
  g.slug as group_slug,
  g.name as group_name
from public.posts p
join public.profiles pr on pr.id = p.author_id
left join public.groups g on g.id = p.group_id
where p.hidden_at is null
  and (p.is_anonymous or not exists (
    select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.author_id
  ));

create or replace view public.inbox_threads
with (security_invoker = true)
as
select
  c.id,
  other.id as other_id,
  other.username as other_username,
  other.display_name as other_display_name,
  other.avatar_color as other_avatar_color,
  other.verified as other_verified,
  last_message.body as last_body,
  coalesce(last_message.sender_id = auth.uid(), false) as last_from_me,
  coalesce(c.last_message_at, c.created_at) as last_at,
  (
    select count(*)
    from public.messages m
    where m.conversation_id = c.id
      and m.sender_id <> auth.uid()
      and m.created_at > case when c.user_a = auth.uid() then c.user_a_read_at else c.user_b_read_at end
  )::int as unread_count,
  exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = other.id) as blocked_by_me,
  exists (select 1 from public.blocks b where b.blocker_id = other.id and b.blocked_id = auth.uid()) as blocked_me,
  other.avatar_url as other_avatar_url
from public.conversations c
join public.profiles other on other.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
left join lateral (
  select m.body, m.sender_id
  from public.messages m
  where m.conversation_id = c.id
  order by m.created_at desc, m.id desc
  limit 1
) last_message on true;

-- ---------------------------------------------------------------------------
-- Privileges (this project grants nothing on new tables by default).
-- ---------------------------------------------------------------------------
grant select on public.groups, public.group_members, public.groups_overview to anon, authenticated;
grant insert on public.groups to authenticated;
grant insert, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.poll_votes to authenticated;
grant select, insert, delete on public.bookmarks to authenticated;
grant select, insert, update on public.attendance to authenticated;
grant all on public.groups, public.group_members, public.groups_overview, public.poll_votes, public.bookmarks, public.attendance to service_role;
