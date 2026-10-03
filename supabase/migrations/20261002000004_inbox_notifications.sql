-- Ruang Bapak: direct messages (Inbox) and activity notifications.

-- ---------------------------------------------------------------------------
-- Conversations: one per pair of users, stored with user_a < user_b so a pair
-- can only exist once. Created through start_conversation().
-- ---------------------------------------------------------------------------
create table public.conversations (
  id bigint generated always as identity primary key,
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  user_a_read_at timestamptz not null default now(),
  user_b_read_at timestamptz not null default now(),
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index conversations_user_b_idx on public.conversations (user_b);

alter table public.conversations enable row level security;

create policy "Members read their conversations"
  on public.conversations for select
  to authenticated
  using ((select auth.uid()) in (user_a, user_b));

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_created_at_idx on public.messages (conversation_id, created_at);
create index messages_sender_id_idx on public.messages (sender_id);

alter table public.messages enable row level security;

create policy "Members read messages"
  on public.messages for select
  to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
  ));

create policy "Members send messages as themselves"
  on public.messages for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
    )
  );

create function public.start_conversation(other_user uuid)
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

create function public.mark_conversation_read(conversation bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.conversations
  set
    user_a_read_at = case when user_a = auth.uid() then now() else user_a_read_at end,
    user_b_read_at = case when user_b = auth.uid() then now() else user_b_read_at end
  where id = conversation and auth.uid() in (user_a, user_b);
$$;

-- Keeps the thread ordering fresh and marks the sender's own message as read.
create function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    user_a_read_at = case when user_a = new.sender_id then new.created_at else user_a_read_at end,
    user_b_read_at = case when user_b = new.sender_id then new.created_at else user_b_read_at end
  where id = new.conversation_id;

  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- Thread list for the signed-in user. security_invoker keeps the RLS of the
-- underlying tables in force, so each user only sees their own threads.
create view public.inbox_threads
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
  )::int as unread_count
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
-- Notifications, written only by the triggers below.
-- ---------------------------------------------------------------------------
create table public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'reply')),
  post_id bigint not null references public.posts (id) on delete cascade,
  comment_id bigint references public.comments (id) on delete cascade,
  preview text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_created_at_idx on public.notifications (recipient_id, created_at desc);
create index notifications_actor_id_idx on public.notifications (actor_id);
create index notifications_post_id_idx on public.notifications (post_id);
create index notifications_comment_id_idx on public.notifications (comment_id);
-- Liking, unliking and liking again only notifies once.
create unique index notifications_like_once_idx on public.notifications (recipient_id, actor_id, post_id) where type = 'like';

alter table public.notifications enable row level security;

create policy "Users read their notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = recipient_id);

create policy "Users mark their notifications"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

create policy "Users delete their notifications"
  on public.notifications for delete
  to authenticated
  using ((select auth.uid()) = recipient_id);

create function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post record;
begin
  select author_id, body into post from public.posts where id = new.post_id;

  if post.author_id is not null and post.author_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id, preview)
    values (post.author_id, new.user_id, 'like', new.post_id, left(post.body, 140))
    on conflict (recipient_id, actor_id, post_id) where type = 'like' do nothing;
  end if;

  return new;
end;
$$;

create trigger on_post_like_created
  after insert on public.post_likes
  for each row execute function public.notify_post_like();

create function public.notify_comment()
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

  if parent_author is not null and parent_author <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id, preview)
    values (parent_author, new.author_id, 'reply', new.post_id, new.id, left(new.body, 140));
  end if;

  -- The post author hears about every comment, unless the reply notice above already reached them.
  if post_author is not null and post_author <> new.author_id and post_author is distinct from parent_author then
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id, preview)
    values (post_author, new.author_id, 'comment', new.post_id, new.id, left(new.body, 140));
  end if;

  return new;
end;
$$;

create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.notify_comment();

-- ---------------------------------------------------------------------------
-- Privileges. Granted explicitly; RLS decides which rows each role can touch.
-- ---------------------------------------------------------------------------
revoke all on public.conversations, public.messages, public.notifications, public.inbox_threads from anon, authenticated;

grant select on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select on public.inbox_threads to authenticated;

grant all on public.conversations, public.messages, public.notifications, public.inbox_threads to service_role;

revoke execute on function public.start_conversation(uuid), public.mark_conversation_read(bigint) from public, anon;
grant execute on function public.start_conversation(uuid), public.mark_conversation_read(bigint) to authenticated;

revoke execute on function public.handle_new_message(), public.notify_post_like(), public.notify_comment() from public, anon, authenticated;
