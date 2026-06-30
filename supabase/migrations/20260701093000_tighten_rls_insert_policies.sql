-- Tighten RLS: remove redundant permissive INSERT policies
--
-- Context: every table already has a correctly-scoped policy (commanders/owners,
-- scoped to the caller's clients via get_my_client_ids() / client_users). Lovable
-- additionally added "Authenticated can insert <table>" policies with
-- WITH CHECK (true). Because permissive RLS policies are OR'd together, those
-- true-checks override the scoped ones, letting any authenticated user insert rows
-- for ANY client (multi-tenant write isolation gap; Supabase linter 0024).
--
-- This migration drops only the redundant permissive policies. The scoped policies
-- that remain:
--   action_items        -> "Commanders and owners can manage action items" (ALL, scoped)
--   activity_feed        -> "System and commanders can insert activity" (INSERT, scoped)
--   client_users         -> "Commanders can manage client_users" (ALL, user_id = auth.uid())
--   clients              -> "Commanders can create clients" (INSERT, role = commander)
--   coaching_decisions   -> "Commanders can manage coaching decisions" (ALL, scoped via parent log)
--   coaching_logs        -> "Commanders can manage coaching logs" (ALL, scoped)
--   playbooks            -> "Commanders and owners can manage playbooks" (ALL, scoped)
--   workstreams          -> "Commanders and owners can manage workstreams" (ALL, scoped)
--
-- Safe for legitimate use: real authenticated commanders/owners on the published app
-- insert rows for their own client_id, which the scoped policies permit. Idempotent.

DROP POLICY IF EXISTS "Authenticated can insert action_items"      ON public.action_items;
DROP POLICY IF EXISTS "Authenticated can insert activity_feed"     ON public.activity_feed;
DROP POLICY IF EXISTS "Authenticated can insert client_users"      ON public.client_users;
DROP POLICY IF EXISTS "Authenticated can insert clients"           ON public.clients;
DROP POLICY IF EXISTS "Authenticated can insert coaching_decisions" ON public.coaching_decisions;
DROP POLICY IF EXISTS "Authenticated can insert coaching_logs"     ON public.coaching_logs;
DROP POLICY IF EXISTS "Authenticated can insert playbooks"         ON public.playbooks;
DROP POLICY IF EXISTS "Authenticated can insert workstreams"       ON public.workstreams;

-- Pin search_path on trigger functions (Supabase linter 0011).
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at() SET search_path = '';

-- Note: "Leaked password protection" (linter) is a dashboard Auth setting, not SQL:
--   Supabase -> Authentication -> Policies/Providers -> enable HaveIBeenPwned check.
