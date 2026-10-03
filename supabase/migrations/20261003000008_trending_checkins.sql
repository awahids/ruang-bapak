-- Ruang Bapak: live numbers for the right-hand panel.
-- Both read posts_feed with the caller's rights, so hidden posts and posts
-- from people the viewer blocked never count. Neither exposes authors.

-- "Topik Hangat": the most used tags in the last few days. Check-ins are left
-- out because their single default tag would always win.
create function public.trending_tags(window_days int default 7, max_results int default 6)
returns table (tag text, category text, post_count int)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    pf.tag,
    mode() within group (order by pf.category) as category,
    count(*)::int as post_count
  from public.posts_feed pf
  where pf.category <> 'checkin'
    and pf.created_at > now() - make_interval(days => least(greatest(coalesce(window_days, 7), 1), 90))
  group by pf.tag
  order by post_count desc, max(pf.created_at) desc
  limit least(greatest(coalesce(max_results, 6), 1), 20);
$$;

-- "Aman Pak? Hari Ini": check-ins since midnight Western Indonesia Time (WIB).
create function public.checkins_today()
returns int
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::int
  from public.posts_feed pf
  where pf.category = 'checkin'
    and pf.created_at >= (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta');
$$;

revoke execute on function public.trending_tags(int, int), public.checkins_today() from public;
grant execute on function public.trending_tags(int, int), public.checkins_today() to anon, authenticated;
