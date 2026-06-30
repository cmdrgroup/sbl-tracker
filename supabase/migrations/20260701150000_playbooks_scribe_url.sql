-- Add optional Scribe (scribe.com) SOP link to playbooks, alongside loom_url.
-- Clients increasingly author SOPs in Scribe; this lets a Scribe share link be
-- attached to a playbook in the delivery pipeline. Nullable + idempotent.
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS scribe_url TEXT;
COMMENT ON COLUMN public.playbooks.scribe_url IS 'Optional Scribe (scribe.com) SOP link, alongside loom_url.';
