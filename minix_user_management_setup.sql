-- Run once in Supabase SQL Editor.
-- Allows only authenticated Admin/Manager profiles to manage minix_users.

alter table public.minix_users enable row level security;

-- WhatsApp reminder contact fields.
alter table public.minix_users
  add column if not exists mobile_number text,
  add column if not exists whatsapp_enabled boolean not null default true;

drop policy if exists "Minix admins can view users" on public.minix_users;
drop policy if exists "Minix admins can insert users" on public.minix_users;
drop policy if exists "Minix admins can update users" on public.minix_users;

create policy "Minix admins can view users"
on public.minix_users for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where lower(p.username) = lower(auth.jwt() ->> 'email')
      and lower(p.role) in ('admin','manager')
      and p.is_active = true
  )
);

create policy "Minix admins can insert users"
on public.minix_users for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where lower(p.username) = lower(auth.jwt() ->> 'email')
      and lower(p.role) in ('admin','manager')
      and p.is_active = true
  )
);

create policy "Minix admins can update users"
on public.minix_users for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where lower(p.username) = lower(auth.jwt() ->> 'email')
      and lower(p.role) in ('admin','manager')
      and p.is_active = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where lower(p.username) = lower(auth.jwt() ->> 'email')
      and lower(p.role) in ('admin','manager')
      and p.is_active = true
  )
);
