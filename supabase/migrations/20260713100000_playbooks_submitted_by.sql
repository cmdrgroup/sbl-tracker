-- Per-person submission attribution on playbooks.
--
-- owner_name is the DEPARTMENT owner (free text), not the individual who hit
-- Submit — so "which SOP did Hayden submit / show Hayden's pending" was
-- unanswerable. submitted_by/submitted_at stamp the authenticated submitter
-- on both submit flows (attach recording to existing SOP, create new SOP).
-- Backfill is deliberately NOT attempted: historical submissions have no
-- reliable signal for who clicked.

ALTER TABLE public.playbooks
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_playbooks_submitted_by
  ON public.playbooks (submitted_by)
  WHERE submitted_by IS NOT NULL;
