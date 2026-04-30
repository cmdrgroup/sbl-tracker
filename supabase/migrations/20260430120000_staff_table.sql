-- Staff roster table — replaces hardcoded STAFF_MEMBERS list
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

alter table public.staff enable row level security;

drop policy if exists "Staff readable by authenticated" on public.staff;
create policy "Staff readable by authenticated"
  on public.staff for select
  to authenticated
  using (true);

drop policy if exists "Staff writable by authenticated" on public.staff;
create policy "Staff writable by authenticated"
  on public.staff for all
  to authenticated
  using (true)
  with check (true);

insert into public.staff (name) values
  ('Brett Poole'),('Curtis Tofa'),('Ryan Christensen'),('Katie McInnes'),
  ('Drew Priddice'),('Rob Romancz'),('Matt Auchettl'),('Aaron Poole'),
  ('Barry van der Merwe'),('Fiona McNamara'),('Monique Noble'),
  ('Mick Walker'),('Nathan Jackson'),('Chris Bush')
on conflict (name) do nothing;
