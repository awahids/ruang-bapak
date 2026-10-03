-- Ruang Bapak: reporting content, blocking users, and moderation.

-- ---------------------------------------------------------------------------
-- Moderators and hidden content.
-- ---------------------------------------------------------------------------
-- Not in the profiles UPDATE column grant, so users cannot promote themselves:
--   update public.profiles set is_moderator = true where username = '...';
alter table public.profiles add column is_moderator boolean not null default false;
alter table public.posts add column hidden_at timestamptz;
alter table public.comments add column hidden_at timestamptz;

create function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_moderator from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Blocks. Blocking someone hides their named posts and comments from you,
-- stops their notifications, and closes direct messages in both directions.
-- ---------------------------------------------------------------------------
create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_id_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

-- Both sides can see the block, so the blocked user's inbox can explain why sending fails.
create policy "Users see blocks involving them"
  on public.blocks for select
  to authenticated
  using ((select auth.uid()) in (blocker_id, blocked_id));

create policy "Users block as themselves"
  on public.blocks for insert
  to authenticated
  with check ((select auth.uid()) = blocker_id);

create policy "Users unblock their own blocks"
  on public.blocks for delete
  to authenticated
  using ((select auth.uid()) = blocker_id);

create function public.is_blocked_by_me(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.blocks where blocker_id = auth.uid() and blocked_id = target);
$$;

create function public.has_block_between(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = first_user and blocked_id = second_user)
       or (blocker_id = second_user and blocked_id = first_user)
  );
$$;

-- ---------------------------------------------------------------------------
-- Visibility rules updated for hidden content and blocks.
-- ---------------------------------------------------------------------------
alter policy "Comments are readable by everyone" on public.comments
  rename to "Visible comments are readable by everyone";

alter policy "Visible comments are readable by everyone" on public.comments
  using (hidden_at is null and not public.is_blocked_by_me(author_id));

-- Anonymous posts stay visible even from blocked users: filtering them would
-- reveal who wrote them.
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
  exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me
from public.posts p
join public.profiles pr on pr.id = p.author_id
where p.hidden_at is null
  and (p.is_anonymous or not exists (
    select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.author_id
  ));

alter policy "Members send messages as themselves" on public.messages
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.user_a, c.user_b)
        and not public.has_block_between(c.user_a, c.user_b)
    )
  );

create or replace function public.start_conversation(other_user uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  first_user uuid;
  second_user uuid;
  conversation bigint;
begin
  if me is null then
    raise exception 'Silakan masuk dulu.' using errcode = '28000';
  end if;
  if other_user is null or other_user = me then
    raise exception 'Tidak bisa mengirim pesan ke diri sendiri.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = other_user) then
    raise exception 'Pengguna tidak ditemukan.' using errcode = '22023';
  end if;
  if public.has_block_between(me, other_user) then
    raise exception 'Tidak bisa mengirim pesan ke pengguna ini.' using errcode = '42501';
  end if;

  first_user := least(me, other_user);
  second_user := greatest(me, other_user);

  insert into public.conversations (user_a, user_b)
  values (first_user, second_user)
  on conflict (user_a, user_b) do nothing
  returning id into conversation;

  if conversation is null then
    select id into conversation
    from public.conversations
    where user_a = first_user and user_b = second_user;
  end if;

  return conversation;
end;
$$;

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
  exists (select 1 from public.blocks b where b.blocker_id = other.id and b.blocked_id = auth.uid()) as blocked_me
from public.conversations c
join public.profiles other on other.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
left join lateral (
  select m.body, m.sender_id
  from public.messages m
  where m.conversation_id = c.id
  order by m.created_at desc, m.id desc
  limit 1
) last_message on true;

-- No notifications from people the recipient has blocked.
create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post record;
begin
  select author_id, body into post from public.posts where id = new.post_id;

  if post.author_id is not null
    and post.author_id <> new.user_id
    and not exists (select 1 from public.blocks where blocker_id = post.author_id and blocked_id = new.user_id)
  then
    insert into public.notifications (recipient_id, actor_id, type, post_id, preview)
    values (post.author_id, new.user_id, 'like', new.post_id, left(post.body, 140))
    on conflict (recipient_id, actor_id, post_id) where type = 'like' do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_author uuid;
  parent_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;

  if new.parent_id is not null then
    select author_id into parent_author from public.comments where id = new.parent_id;
  end if;

  if parent_author is not null
    and parent_author <> new.author_id
    and not exists (select 1 from public.blocks where blocker_id = parent_author and blocked_id = new.author_id)
  then
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id, preview)
    values (parent_author, new.author_id, 'reply', new.post_id, new.id, left(new.body, 140));
  end if;

  -- The post author hears about every comment, unless the reply notice above already reached them.
  if post_author is not null
    and post_author <> new.author_id
    and post_author is distinct from parent_author
    and not exists (select 1 from public.blocks where blocker_id = post_author and blocked_id = new.author_id)
  then
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id, preview)
    values (post_author, new.author_id, 'comment', new.post_id, new.id, left(new.body, 140));
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reports on posts and comments, handled by moderators.
-- ---------------------------------------------------------------------------
create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  post_id bigint references public.posts (id) on delete cascade,
  comment_id bigint references public.comments (id) on delete cascade,
  reason text not null check (reason in ('spam', 'kasar', 'pelecehan', 'tidak_pantas', 'lainnya')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'hidden', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(post_id, comment_id) = 1)
);

create unique index reports_once_per_post_idx on public.reports (reporter_id, post_id) where post_id is not null;
create unique index reports_once_per_comment_idx on public.reports (reporter_id, comment_id) where comment_id is not null;
create index reports_status_created_at_idx on public.reports (status, created_at desc);
create index reports_post_id_idx on public.reports (post_id);
create index reports_comment_id_idx on public.reports (comment_id);
create index reports_resolved_by_idx on public.reports (resolved_by);

alter table public.reports enable row level security;

create policy "Users file reports as themselves"
  on public.reports for insert
  to authenticated
  with check ((select auth.uid()) = reporter_id);

create policy "Reporters and moderators read reports"
  on public.reports for select
  to authenticated
  using ((select auth.uid()) = reporter_id or public.is_moderator());

-- The moderation queue. Anonymous posts keep their author hidden, even here.
create function public.moderation_queue()
returns table (
  report_id bigint,
  reason text,
  details text,
  status text,
  created_at timestamptz,
  reporter_username text,
  post_id bigint,
  comment_id bigint,
  body text,
  author_username text,
  is_anonymous boolean,
  hidden boolean,
  report_count int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'Khusus moderator.' using errcode = '42501';
  end if;

  return query
  select
    r.id,
    r.reason,
    r.details,
    r.status,
    r.created_at,
    reporter.username,
    coalesce(r.post_id, c.post_id),
    r.comment_id,
    coalesce(c.body, p.body),
    case when r.post_id is not null and p.is_anonymous then null else author.username end,
    coalesce(r.post_id is not null and p.is_anonymous, false),
    coalesce(c.hidden_at, p.hidden_at) is not null,
    (
      select count(*)::int from public.reports other
      where other.post_id is not distinct from r.post_id and other.comment_id is not distinct from r.comment_id
    )
  from public.reports r
  join public.profiles reporter on reporter.id = r.reporter_id
  left join public.posts p on p.id = r.post_id
  left join public.comments c on c.id = r.comment_id
  left join public.profiles author on author.id = coalesce(c.author_id, p.author_id)
  order by (r.status = 'open') desc, r.created_at desc
  limit 200;
end;
$$;

-- action: 'hide' hides the reported content, 'restore' shows it again,
-- 'dismiss' closes the report without changing the content.
create function public.moderate_report(report bigint, action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
begin
  if not public.is_moderator() then
    raise exception 'Khusus moderator.' using errcode = '42501';
  end if;

  select post_id, comment_id into target from public.reports where id = report;
  if not found then
    raise exception 'Laporan tidak ditemukan.' using errcode = '22023';
  end if;

  if action = 'hide' then
    update public.posts set hidden_at = now() where id = target.post_id and hidden_at is null;
    update public.comments set hidden_at = now() where id = target.comment_id and hidden_at is null;
  elsif action = 'restore' then
    update public.posts set hidden_at = null where id = target.post_id;
    update public.comments set hidden_at = null where id = target.comment_id;
  elsif action <> 'dismiss' then
    raise exception 'Aksi tidak dikenal.' using errcode = '22023';
  end if;

  -- Every report on the same content is settled together.
  update public.reports
  set
    status = case when action = 'hide' then 'hidden' else 'dismissed' end,
    resolved_by = auth.uid(),
    resolved_at = now()
  where post_id is not distinct from target.post_id
    and comment_id is not distinct from target.comment_id
    and (status = 'open' or action = 'restore');
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges.
-- ---------------------------------------------------------------------------
revoke all on public.blocks, public.reports from anon, authenticated;

grant select, insert, delete on public.blocks to authenticated;
grant select on public.reports to authenticated;
grant insert (post_id, comment_id, reason, details) on public.reports to authenticated;

grant all on public.blocks, public.reports to service_role;

revoke execute on function public.is_moderator(), public.has_block_between(uuid, uuid), public.moderation_queue(), public.moderate_report(bigint, text) from public, anon;
grant execute on function public.is_moderator(), public.has_block_between(uuid, uuid), public.moderation_queue(), public.moderate_report(bigint, text) to authenticated;

-- Used by the public comments policy, so guests need it too.
revoke execute on function public.is_blocked_by_me(uuid) from public;
grant execute on function public.is_blocked_by_me(uuid) to anon, authenticated;
