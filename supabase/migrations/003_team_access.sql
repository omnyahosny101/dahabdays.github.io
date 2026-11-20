-- Dahab Days · Team access: sign in by phone (SMS code) or Google, custom roles with permissions
-- Run after 001 and 002. Then in Supabase › Authentication › Providers:
--   • Phone: enable, choose an SMS provider (Twilio / MessageBird / Vonage / Textlocal) and paste its keys
--   • Google: enable, paste the OAuth client ID + secret from Google Cloud (redirect: https://<project>.supabase.co/auth/v1/callback)
--   • URL configuration: add your site URL (e.g. https://dahabdays.github.io) to Redirect URLs

-- Roles table (same document shape as the others)
create table if not exists public.roles (id text primary key, data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz);
alter table public.roles enable row level security;

insert into public.roles (id, data) values
  ('manager', '{"id":"manager","name":"Manager","perms":["overview","bookings","schedule","roster","customers","consents","finance","cash","inventory","promos","blog","services","media","refunds","export","seeMoney"]}'),
  ('front-desk', '{"id":"front-desk","name":"Front desk","perms":["overview","bookings","schedule","roster","customers","consents","cash","seeMoney"]}'),
  ('instructor', '{"id":"instructor","name":"Instructor / guide","perms":["schedule","roster","consents","inventory"]}')
on conflict (id) do nothing;

-- "+20 100 051 5039", "01000515039" and "201000515039" all compare equal
create or replace function public.norm_phone(p text) returns text language sql immutable as $$
  select case when d like '00%' then substr(d, 3) when d like '0%' then '20' || substr(d, 2) else d end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x
$$;

-- The signed-in person's team record (matched by Gmail or phone), if their access is on
create or replace function public.my_staff() returns jsonb language sql stable security definer set search_path = public as $$
  select s.data from public.staff s
  where coalesce((s.data->>'active')::boolean, true)
    and ((coalesce(auth.jwt()->>'email', '') <> '' and lower(s.data->>'email') = lower(auth.jwt()->>'email'))
      or (coalesce(auth.jwt()->>'phone', '') <> '' and public.norm_phone(s.data->>'phone') = public.norm_phone(auth.jwt()->>'phone')))
  limit 1
$$;

-- Owner = listed in public.admins, or a team member whose role is "owner", or the owner phone/Gmail in settings
create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
    or coalesce(public.my_staff()->>'role', '') = 'owner'
    or exists (select 1 from public.settings st where st.id = 'main' and (
         (coalesce(auth.jwt()->>'email', '') <> '' and exists (select 1 from regexp_split_to_table(coalesce(st.data->>'ownerEmail', ''), '[,;]') e where lower(trim(e)) = lower(auth.jwt()->>'email')))
      or (coalesce(auth.jwt()->>'phone', '') <> '' and exists (select 1 from regexp_split_to_table(coalesce(st.data->>'ownerPhone', ''), '[,;]') p where public.norm_phone(p) = public.norm_phone(auth.jwt()->>'phone')))))
$$;

-- Anyone with dashboard access (replaces the 001 version, so every existing "admin all" policy now includes the team)
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select public.is_owner() or public.my_staff() is not null
$$;

create or replace function public.has_perm(p text) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_owner() or exists (
    select 1 from public.roles r where r.id = public.my_staff()->>'role' and r.data->'perms' ? p)
$$;
create or replace function public.has_any(ps text[]) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from unnest(ps) p where public.has_perm(p))
$$;

-- What the app asks after sign-in
create or replace function public.my_access() returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_owner() then jsonb_build_object('owner', true, 'role', 'owner', 'staffId', 'owner', 'name', coalesce((select data->>'ownerName' from public.settings where id = 'main'), 'Owner'))
              when public.my_staff() is not null then jsonb_build_object('owner', false, 'role', public.my_staff()->>'role', 'staffId', public.my_staff()->>'id', 'name', public.my_staff()->>'name')
              else null end
$$;
grant execute on function public.my_access() to authenticated;

-- Per-permission policies: everyone on the team can read; writing needs the matching page, deleting also needs "delete"
do $$
declare r record;
begin
  for r in select * from (values
    ('bookings', array['bookings','schedule','roster','cash']), ('consents', array['consents']), ('expenses', array['finance','cash']),
    ('media', array['media']), ('settings', array['settings']), ('staff', array['team']), ('roles', array['team']),
    ('inventory', array['inventory','roster']), ('cashcloses', array['cash']), ('promos', array['promos']), ('logbook', array['roster','bookings']),
    ('posts', array['blog']), ('customers', array['customers']), ('services', array['services'])) as t(tbl, perms)
  loop
    execute format('drop policy if exists "admin all" on public.%I', r.tbl);
    execute format('drop policy if exists "team read" on public.%I', r.tbl);
    execute format('drop policy if exists "team insert" on public.%I', r.tbl);
    execute format('drop policy if exists "team update" on public.%I', r.tbl);
    execute format('drop policy if exists "team delete" on public.%I', r.tbl);
    execute format('create policy "team read" on public.%I for select to authenticated using (public.is_admin())', r.tbl);
    execute format('create policy "team insert" on public.%I for insert to authenticated with check (public.has_any(%L))', r.tbl, r.perms);
    execute format('create policy "team update" on public.%I for update to authenticated using (public.has_any(%L)) with check (public.has_any(%L))', r.tbl, r.perms, r.perms);
    execute format('create policy "team delete" on public.%I for delete to authenticated using (public.has_perm(''delete'') and public.has_any(%L))', r.tbl, r.perms);
  end loop;
end $$;

-- Only an owner can hand out the owner role or roles that manage the team
create or replace function public.guard_team() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_owner() then return new; end if;
  if tg_table_name = 'staff' and new.data->>'role' = 'owner' then raise exception 'Only an owner can make someone an owner'; end if;
  if tg_table_name = 'roles' and (new.id = 'owner' or new.data->'perms' ? 'team') then raise exception 'Only an owner can create roles that manage the team'; end if;
  return new;
end $$;
drop trigger if exists guard_staff on public.staff;
create trigger guard_staff before insert or update on public.staff for each row execute function public.guard_team();
drop trigger if exists guard_roles on public.roles;
create trigger guard_roles before insert or update on public.roles for each row execute function public.guard_team();

-- Note: "Settings" lets someone change the owner phone/Gmail, so keep the Settings page for owners only.
