-- Ruang Bapak: following other users, follow notifications, and realtime.

-- ---------------------------------------------------------------------------
-- Follows. The follow graph is public, like follower counts on most networks.
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_id_idx on public.follows (followee_id);

alter table public.follows enable row level security;

create policy "Follows are readable by everyone"
  on public.follows for select
  to anon, authenticated
  using (true);

-- You cannot follow someone when either of you has blocked the other.
create policy "Users follow as themselves"
  on public.follows for insert
  to authenticated
  with check (
    (select auth.uid()) = follower_id
    and not public.has_block_between(follower_id, followee_id)
  );

create policy "Users unfollow as themselves"
  on public.follows for delete
  to authenticated
  using ((select auth.uid()) = follower_id);

-- ---------------------------------------------------------------------------
-- "X mulai mengikuti Bapak" notifications. They are the only type without a post.
-- ---------------------------------------------------------------------------
alter table public.notifications alter column post_id drop not null;
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('like', 'comment', 'reply', 'follow') and (type = 'follow') = (post_id is null));

-- Following, unfollowing and following again only notifies once.
create unique index notifications_follow_once_idx on public.notifications (recipient_id, actor_id) where type = 'follow';

create function public.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.blocks where blocker_id = new.followee_id and blocked_id = new.follower_id) then
    insert into public.notifications (recipient_id, actor_id, type)
    values (new.followee_id, new.follower_id, 'follow')
    on conflict (recipient_id, actor_id) where type = 'follow' do nothing;
  end if;

  return new;
end;
$$;

create trigger on_follow_created
  after insert on public.follows
  for each row execute function public.notify_follow();

-- ---------------------------------------------------------------------------
-- Privileges.
-- ---------------------------------------------------------------------------
revoke all on public.follows from anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;

revoke execute on function public.notify_follow() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: new messages and notifications are pushed to the app. Supabase
-- Realtime applies the tables' RLS, so each user only receives their own rows.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages, public.notifications;
  end if;
end;
$$;
