# Fix: "Could not find the 'brett_sitrep' column of 'coaching_logs'"

## Root cause

The app code (coaching log form, types, demo seed) reads and writes two columns on `coaching_logs`:

- `brett_sitrep`
- `curtis_sitrep`

Neither column exists on the live Supabase table, so PostgREST rejects every update with a schema-cache error and the edit save fails.

## Fix

Run a single idempotent migration that adds both columns as nullable text:

```sql
ALTER TABLE public.coaching_logs
  ADD COLUMN IF NOT EXISTS brett_sitrep TEXT,
  ADD COLUMN IF NOT EXISTS curtis_sitrep TEXT;
```

That's it — no code changes needed. The frontend already handles `null` for both fields, so existing rows will simply read as empty until you fill them in via the edit form.

## Verification

After the migration runs:

1. Open Coaching Logs → Edit any session.
2. Add text in the "Brett sit-rep" and "Curtis sit-rep" fields.
3. Save. The save should succeed and the sit-reps should render on the card.

## Out of scope

- The hydration warning ("Loading client...") visible in runtime errors is unrelated to this DB issue and is a separate SSR/client text mismatch in the app shell loading state. I can address it next if you'd like, but it does not block saving coaching sessions.
