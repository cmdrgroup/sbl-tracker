-- Add Brett & Curtis sit-rep columns to coaching_logs (Captain's Table sessions)
alter table public.coaching_logs
  add column if not exists brett_sitrep text,
  add column if not exists curtis_sitrep text;
