-- handle_new_user() only runs as the auth.users trigger; keep it off the RPC API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
