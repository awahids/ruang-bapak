-- Give accounts created before `on_auth_user_created` existed a profile too,
-- e.g. when Ruang Bapak is installed into a project that already has users.
-- Mirrors public.handle_new_user(); a no-op on a fresh project.
do $$
declare
  palette text[] := array[
    'hsl(95 22% 38%)', 'hsl(28 33% 41%)', 'hsl(210 22% 45%)',
    'hsl(26 40% 42%)', 'hsl(205 14% 41%)', 'hsl(340 22% 42%)'
  ];
  u record;
  new_name text;
  base text;
  candidate text;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    where not exists (select 1 from public.profiles p where p.id = au.id)
  loop
    new_name := coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'Bapak Baru'
    );

    base := lower(regexp_replace(split_part(coalesce(u.email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
    if char_length(base) < 3 then
      base := 'bapak' || base;
    end if;
    base := left(base, 24);

    candidate := base;
    while exists (select 1 from public.profiles where username = candidate) loop
      candidate := base || floor(random() * 10000)::int::text;
    end loop;

    insert into public.profiles (id, username, display_name, avatar_color)
    values (u.id, candidate, left(new_name, 60), palette[1 + floor(random() * array_length(palette, 1))::int]);
  end loop;
end;
$$;
