-- Overlay → TOC bridge: a read-only aggregate RPC the TOC's sync function calls to
-- pull a client's DELIVERY status (counts only — no titles, notes, or personal data).
-- SECURITY DEFINER so it can aggregate across a client's rows without exposing the
-- underlying tables; returns non-sensitive aggregates + client name/health only.
create or replace function public.client_delivery_rollup(p_client_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'client_id',            c.id,
    'client_name',          c.name,
    'slug',                 c.slug,
    'health_score',         c.health_score,
    'playbooks_total',      coalesce(pb.total, 0),
    'playbooks_approved',   coalesce(pb.approved, 0),
    'playbooks_in_review',  coalesce(pb.in_review, 0),
    'playbooks_submitted',  coalesce(pb.submitted, 0),
    'playbooks_not_started',coalesce(pb.not_started, 0),
    'pct_approved',         case when coalesce(pb.total, 0) > 0
                                 then round(100.0 * pb.approved / pb.total) else 0 end,
    'workstreams',          coalesce(ws.cnt, 0),
    'open_actions',         coalesce(ai.open_cnt, 0),
    'overdue_actions',      coalesce(ai.overdue_cnt, 0),
    'last_activity_at',     pb.last_activity
  )
  from public.clients c
  left join lateral (
    select count(*) total,
           count(*) filter (where status = 'approved') approved,
           count(*) filter (where status in ('under_review','refined')) in_review,
           count(*) filter (where status = 'submitted') submitted,
           count(*) filter (where status = 'not_started') not_started,
           max(updated_at) last_activity
    from public.playbooks where client_id = c.id
  ) pb on true
  left join lateral (
    select count(*) cnt from public.workstreams where client_id = c.id
  ) ws on true
  left join lateral (
    select count(*) filter (where status <> 'done') open_cnt,
           count(*) filter (where status = 'overdue') overdue_cnt
    from public.action_items where client_id = c.id
  ) ai on true
  where c.id = p_client_id;
$$;

comment on function public.client_delivery_rollup(uuid) is
  'Overlay→TOC bridge: non-sensitive delivery aggregates for a client (no personal data). Called by the TOC sync-overlay-status edge function.';

revoke all on function public.client_delivery_rollup(uuid) from public;
grant execute on function public.client_delivery_rollup(uuid) to anon, authenticated, service_role;
