-- Dahab Days — database schema (run in Supabase SQL editor, or `supabase db push`)
-- Each table is a document store: the app reads/writes the JSON in `data`.

create table if not exists public.admins (user_id uuid primary key references auth.users on delete cascade);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

do $$
declare t text;
begin
  foreach t in array array['services','bookings','consents','expenses','media','settings'] loop
    execute format('create table if not exists public.%I (
      id text primary key,
      data jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz
    )', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Public website content: anyone can read
create policy "public read services" on public.services for select using (true);
create policy "public read media"    on public.media    for select using (true);
create policy "public read settings" on public.settings for select using (true);

-- Guests can create (never read/update) bookings and consent forms.
-- A guest can't mark their own booking as paid — only the Paymob webhook (service role) can.
create policy "guest insert bookings" on public.bookings for insert to anon, authenticated
  with check ((data->'payment'->>'status') = 'unpaid' and (data->>'status') in ('pending','confirmed'));
create policy "guest insert consents" on public.consents for insert to anon, authenticated
  with check (data ? 'signature' and length(data->>'signature') > 100);

-- Handy reporting views for SQL / Lovable
create or replace view public.v_bookings as
select id, (data->>'date')::date as activity_date, data->>'serviceId' as service_id, data->>'serviceName' as service_name,
       data->>'category' as category, (data->>'people')::int as people, (data->>'total')::numeric as total,
       data->'payment'->>'status' as payment_status, data->'payment'->>'method' as payment_method,
       coalesce((data->'payment'->>'fee')::numeric, 0) as gateway_fee, data->>'status' as status, created_at
from public.bookings;

create or replace view public.v_monthly_service_revenue as
select date_trunc('month', activity_date)::date as month, service_name, category,
       count(*) as bookings, sum(people) as guests, sum(total) as revenue, sum(gateway_fee) as fees
from public.v_bookings
where payment_status = 'paid' and status <> 'cancelled'
group by 1, 2, 3 order by 1 desc, revenue desc;
alter view public.v_bookings set (security_invoker = on);
alter view public.v_monthly_service_revenue set (security_invoker = on);

-- Media bucket (public read, admin write)
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media admin write" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- After creating the owner's login in Authentication › Users, make them admin:
-- insert into public.admins (user_id) select id from auth.users where email = 'owner@dahabdays.com';
