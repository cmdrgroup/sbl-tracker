-- Client-safe "Commander's Note": a short narrative a commander (CMDR) writes for
-- the client, shown read-only to the client on the Decisions & Commitments page.
-- The single deliberate channel of narrative from CMDR into the client-facing app
-- (coaching itself stays in the TOC and never reaches the client).
alter table public.clients add column if not exists client_note text;
alter table public.clients add column if not exists client_note_updated_at timestamptz;
comment on column public.clients.client_note is
  'Client-safe note authored by a commander (CMDR), shown read-only to the client on the Decisions & Commitments page.';
