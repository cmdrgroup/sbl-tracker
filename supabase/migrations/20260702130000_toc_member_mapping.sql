-- Fable 5 Phase 6.1 — TOC↔Overlay identity mapping + RLS advisory fixes.
--
-- * clients.toc_member_id — maps each Overlay client to its TOC member
--   (the reverse of TOC's members.overlay_client_id). Enables the
--   toc-delivery-bridge edge fn to report delivery events upstream.
-- * Revoke public EXECUTE on SECURITY DEFINER helpers flagged in
--   SUPABASE-NOTES.md (issue #2).

alter table public.clients
  add column if not exists toc_member_id uuid;

comment on column public.clients.toc_member_id is
  'TOC members.id for this client — coaching stays TOC-owned; Overlay pushes delivery events upstream.';

-- Advisory fixes: helpers should not be callable by anon
revoke execute on function public.get_my_client_ids() from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
