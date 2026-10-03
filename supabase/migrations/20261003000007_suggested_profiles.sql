-- Ruang Bapak: "Saran Kawan" — people to follow, for the right-hand panel.

-- Ranks other members by named posts in the last 30 days, then by followers.
-- Leaves out yourself, people you already follow, and anyone on either side of
-- a block. Runs with the caller's rights; anonymous posts never count, so the
-- ranking cannot reveal who wrote them.
create function public.suggested_profiles(max_results int default 5)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_color text,
  verified boolean,
  bio text,
  follower_count int,
  recent_post_count int
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_color,
    p.verified,
    p.bio,
    (select count(*) from public.follows f where f.followee_id = p.id)::int as follower_count,
    (
      select count(*) from public.posts_feed pf
      where pf.author_username = p.username
        and pf.created_at > now() - interval '30 days'
    )::int as recent_post_count
  from public.profiles p
  where p.id is distinct from auth.uid()
    and not exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.followee_id = p.id)
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
  order by recent_post_count desc, follower_count desc, p.created_at desc
  limit least(greatest(coalesce(max_results, 5), 1), 20);
$$;

revoke execute on function public.suggested_profiles(int) from public;
grant execute on function public.suggested_profiles(int) to anon, authenticated;

-- Guests also get suggestions, so they need to be able to read blocks; the
-- table's RLS policy only covers signed-in users, so guests still see no rows.
grant select on public.blocks to anon;
