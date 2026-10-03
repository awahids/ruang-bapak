-- Grant table access explicitly instead of relying on the project's default
-- privileges (some projects do not grant anon/authenticated access to new
-- tables). RLS policies still decide which rows each role can touch.
revoke all on public.profiles, public.posts, public.comments, public.post_likes from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, location, avatar_color) on public.profiles to authenticated;

grant select, insert, delete on public.posts to authenticated;

grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;

grant select, insert, delete on public.post_likes to authenticated;

grant select on public.posts_feed to anon, authenticated;

grant all on public.profiles, public.posts, public.comments, public.post_likes, public.posts_feed to service_role;
