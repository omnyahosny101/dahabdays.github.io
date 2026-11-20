-- Dahab Days — features batch 2: staff roles, equipment, cash close, promos, logbook, blog, CRM notes,
-- live seats, guest self-service, promo checks, private consent PDFs.

do $$
declare t text;
begin
  foreach t in array array['staff','inventory','cashcloses','promos','logbook','posts','customers'] loop
    execute format('create table if not exists public.%I (id text primary key, data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz)', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Blog is public
create policy "public read posts" on public.posts for select using ((data->>'published')::boolean is true);

-- Signed-in guests (magic link) see their own bookings and logbook
create policy "guest reads own bookings" on public.bookings for select to authenticated
  using (lower(data->'customer'->>'email') = lower(auth.jwt()->>'email'));
create policy "guest reads own logbook" on public.logbook for select to authenticated using (lower(data->>'email') = lower(auth.jwt()->>'email'));
create policy "guest writes own logbook" on public.logbook for insert to authenticated with check (lower(data->>'email') = lower(auth.jwt()->>'email') and coalesce((data->>'verified')::boolean, false) = false);
-- Guest photo packages are hidden from the public site; each guest sees only their own
drop policy if exists "public read media" on public.media;
create policy "public read media" on public.media for select using (data->>'role' <> 'guest');
create policy "guest reads own photos" on public.media for select to authenticated using (
  data->>'role' = 'guest' and (lower(data->>'guestEmail') = lower(auth.jwt()->>'email')
    or exists (select 1 from public.bookings b where upper(b.data->>'ref') = upper(media.data->>'bookingRef') and lower(b.data->'customer'->>'email') = lower(auth.jwt()->>'email'))));

-- Live seats: counts only, never names
create or replace function public.seats_taken(p_service text, p_date text)
returns table(slot text, taken bigint) language sql stable security definer set search_path = public as $$
  select data->>'time', sum((data->>'people')::int) from public.bookings
  where data->>'serviceId' = p_service and data->>'date' = p_date and data->>'status' <> 'cancelled'
  group by 1 $$;
grant execute on function public.seats_taken(text, text) to anon, authenticated;

-- Guest self-service by reference + email
create or replace function public.guest_booking(p_ref text, p_email text)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select data from public.bookings where upper(data->>'ref') = upper(p_ref) and lower(data->'customer'->>'email') = lower(p_email) $$;
grant execute on function public.guest_booking(text, text) to anon, authenticated;

create or replace function public.guest_update_booking(p_ref text, p_email text, p_id text, p_date text, p_time text, p_cancel boolean)
returns void language plpgsql security definer set search_path = public as $$
declare b jsonb; hrs int;
begin
  select data into b from public.bookings where id = p_id and upper(data->>'ref') = upper(p_ref) and lower(data->'customer'->>'email') = lower(p_email);
  if b is null then raise exception 'Booking not found'; end if;
  select coalesce((data->>'freeCancelHours')::int, 48) into hrs from public.settings where id = 'main';
  hrs := coalesce(hrs, 48);
  if (b->>'date')::date < (now() at time zone 'Africa/Cairo')::date + make_interval(hours => hrs) then raise exception 'Too close to the start — please message us on WhatsApp'; end if;
  if p_cancel then b := b || jsonb_build_object('status', 'cancelled', 'cancelledBy', 'guest');
  else
    if p_date is null or p_date::date < (now() at time zone 'Africa/Cairo')::date + make_interval(hours => hrs) then raise exception 'Pick a later date'; end if;
    b := b || jsonb_build_object('date', p_date, 'time', coalesce(p_time, b->>'time'));
  end if;
  update public.bookings set data = b, updated_at = now() where id = p_id;
end $$;
grant execute on function public.guest_update_booking(text, text, text, text, text, boolean) to anon, authenticated;

-- Promo codes: guests can check one code, never list them
create or replace function public.check_promo(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', id, 'code', data->>'code', 'kind', data->>'kind', 'value', (data->>'value')::numeric, 'active', true, 'used', 0)
  from public.promos where upper(data->>'code') = upper(p_code) and (data->>'active')::boolean
    and (data->>'expires' is null or (data->>'expires')::date >= current_date)
    and (data->>'maxUses' is null or (data->>'used')::int < (data->>'maxUses')::int)
  limit 1 $$;
grant execute on function public.check_promo(text) to anon, authenticated;

-- Private bucket for signed consent PDFs (guests can upload, only staff and functions can read)
insert into storage.buckets (id, name, public) values ('consents', 'consents', false) on conflict (id) do nothing;
create policy "consent pdf upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'consents');
create policy "consent pdf staff read" on storage.objects for select to authenticated using (bucket_id = 'consents' and public.is_admin());

-- Daily reminders (needs pg_cron + pg_net): every day 16:00 Cairo, WhatsApp tomorrow's guests
-- select cron.schedule('dahab-reminders', '0 14 * * *', $$ select net.http_post(url := '<SUPABASE_URL>/functions/v1/reminders', headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb) $$);
