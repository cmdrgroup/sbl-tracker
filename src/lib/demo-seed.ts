// Seeds a fully-populated demo client for screenshares.
// Uses the current user's auth session — relies on existing RLS policies.
// The client is tagged with a "[DEMO]" name prefix so the UI can badge it.

import { supabase } from "./supabase";

export const DEMO_PREFIX = "[DEMO] ";

export function isDemoClient(name: string): boolean {
  return name.startsWith(DEMO_PREFIX);
}

export function stripDemoPrefix(name: string): string {
  return name.startsWith(DEMO_PREFIX) ? name.slice(DEMO_PREFIX.length) : name;
}

type SeedResult = { client_id: string; client_name: string };

export async function seedDemoClient(companyName = "Apex Demo Co"): Promise<SeedResult> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userData.user?.id;
  if (!userId) throw new Error("You must be signed in to create a demo client.");

  const clientId = crypto.randomUUID();
  const fullName = `${DEMO_PREFIX}${companyName}`;
  const slug =
    companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-demo-" +
    Math.random().toString(36).slice(2, 8);

  // 1. Client
  const { error: clientErr } = await supabase.from("clients").insert({
    id: clientId,
    name: fullName,
    slug,
    industry: "Commercial Construction",
    color: "oklch(0.72 0.18 195)",
    health_score: 78,
    timezone: "Australia/Brisbane",
    week_start: "Monday",
    coaching_cadence: "Tuesdays · 7:00am",
  });
  if (clientErr) throw new Error(`Couldn't create demo client: ${clientErr.message}`);

  // 2. Link caller as owner
  const { error: linkErr } = await supabase
    .from("client_users")
    .insert({ client_id: clientId, user_id: userId, role: "owner" });
  if (linkErr) {
    throw new Error(
      `Demo client was created but couldn't be linked to your account: ${linkErr.message}`,
    );
  }

  // 3. Workstreams
  const wsRows = [
    {
      name: "Operations",
      owner_name: "Jordan Mills",
      color: "oklch(0.72 0.105 80)",
      sort_order: 1,
    },
    { name: "Finance", owner_name: "Priya Anand", color: "oklch(0.65 0.18 145)", sort_order: 2 },
    { name: "Compliance", owner_name: "Rob Romancz", color: "oklch(0.72 0.18 195)", sort_order: 3 },
    { name: "HSEQ", owner_name: "Sienna Park", color: "oklch(0.65 0.24 25)", sort_order: 4 },
    { name: "Quality", owner_name: "Aaron Poole", color: "oklch(0.78 0.16 75)", sort_order: 5 },
    {
      name: "Construction",
      owner_name: "Rachel Kim",
      color: "oklch(0.62 0.22 280)",
      sort_order: 6,
    },
    {
      name: "People & Culture",
      owner_name: "James Whitfield",
      color: "oklch(0.68 0.13 320)",
      sort_order: 7,
    },
  ].map((w) => ({ ...w, client_id: clientId }));

  const { data: workstreams, error: wsErr } = await supabase
    .from("workstreams")
    .insert(wsRows)
    .select();
  if (wsErr) throw new Error(`Couldn't seed departments: ${wsErr.message}`);

  const ws = (name: string) =>
    workstreams!.find((w: { name: string; id: string }) => w.name === name)!.id;

  // 4. Playbooks
  const pbRows = [
    {
      ws: "Operations",
      code: "OPS-014",
      title: "Site mobilisation checklist",
      type: "sop",
      status: "approved",
      owner: "Jordan Mills",
      dur: 12,
      notes: "Pre-start checklist for new sites.",
    },
    {
      ws: "Operations",
      code: "OPS-019",
      title: "End-of-day handover protocol",
      type: "sop",
      status: "approved",
      owner: "Jordan Mills",
      dur: 7,
      notes: null,
    },
    {
      ws: "Finance",
      code: "FIN-007",
      title: "Weekly cashflow forecast",
      type: "sop",
      status: "under_review",
      owner: "Priya Anand",
      dur: 18,
      notes: "13-week rolling model.",
    },
    {
      ws: "Finance",
      code: "FIN-011",
      title: "Invoice approval matrix",
      type: "policy",
      status: "submitted",
      owner: "Priya Anand",
      dur: 11,
      notes: null,
    },
    {
      ws: "Compliance",
      code: "COMP-003",
      title: "Subcontractor onboarding pack",
      type: "sop",
      status: "submitted",
      owner: "Rob Romancz",
      dur: 22,
      notes: "Includes insurance & licence checks.",
    },
    {
      ws: "HSEQ",
      code: "HSEQ-022",
      title: "Incident escalation pathway",
      type: "framework",
      status: "refined",
      owner: "Sienna Park",
      dur: 9,
      notes: null,
    },
    {
      ws: "Quality",
      code: "QUAL-008",
      title: "Defect register triage",
      type: "sop",
      status: "not_started",
      owner: "Aaron Poole",
      dur: null,
      notes: null,
    },
    {
      ws: "Construction",
      code: "CON-031",
      title: "Concrete pour QA gate",
      type: "sop",
      status: "under_review",
      owner: "Rachel Kim",
      dur: 14,
      notes: null,
    },
    {
      ws: "Construction",
      code: "CON-027",
      title: "Plant pre-start inspection",
      type: "sop",
      status: "approved",
      owner: "Rachel Kim",
      dur: 8,
      notes: null,
    },
    {
      ws: "People & Culture",
      code: "P&C-004",
      title: "New starter induction (Day 1)",
      type: "sop",
      status: "approved",
      owner: "James Whitfield",
      dur: 31,
      notes: "Covers culture, safety, systems.",
    },
  ].map((p, i) => ({
    client_id: clientId,
    workstream_id: ws(p.ws),
    code: p.code,
    title: p.title,
    type: p.type,
    status: p.status,
    owner_name: p.owner,
    loom_url: p.dur ? `https://www.loom.com/share/demo-${i + 1}` : null,
    loom_duration_min: p.dur,
    notes: p.notes,
  }));

  const { error: pbErr } = await supabase.from("playbooks").insert(pbRows);
  if (pbErr) console.warn("Some playbooks failed:", pbErr.message);

  // 5. Coaching logs
  const today = new Date();
  const dayOffset = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  const logsPayload = [
    {
      client_id: clientId,
      week_number: 14,
      session_date: dayOffset(6),
      mood: "strong",
      summary: "Operations playbook crossed 70%. Momentum is real after 3 quarters of grind.",
      brett_sitrep: "Owner is finally delegating site walks. Frees 6 hrs/wk.",
      curtis_sitrep: "Recommend locking the Q2 hiring freeze; cashflow needs the breathing room.",
      decisions: [
        "Hold on Sydney expansion until July",
        "Promote Jordan to Ops Lead",
        "Approve $40k tooling spend",
      ],
    },
    {
      client_id: clientId,
      week_number: 13,
      session_date: dayOffset(13),
      mood: "steady",
      summary: "Cashflow tighter than forecast. Rebuilding the 13-week model with Priya.",
      brett_sitrep: "Two slow-pay clients flagged. Chasing personally.",
      curtis_sitrep: "Move marketing retainer 30 days. Tuesday cashflow stand-up at 7am.",
      decisions: ["Defer marketing retainer 30 days", "Weekly cashflow Tuesdays 7am"],
    },
    {
      client_id: clientId,
      week_number: 12,
      session_date: dayOffset(20),
      mood: "under_pressure",
      summary: "Two key project delays surfaced. Need to rebuild trust with the Henderson account.",
      brett_sitrep: "Henderson PM wants a face-to-face Friday. I will go.",
      curtis_sitrep: "Pause new BD until backlog clears. Focus = retention.",
      decisions: ["Site visit Henderson Friday", "Pause new BD until backlog clears"],
    },
  ];

  const insertedLogs: { id: string; week_number: number }[] = [];
  for (const l of logsPayload) {
    const { decisions, ...row } = l;
    const { data: log, error } = await supabase.from("coaching_logs").insert(row).select().single();
    if (error || !log) {
      console.warn("Coaching log failed:", error?.message);
      continue;
    }
    insertedLogs.push({ id: log.id, week_number: l.week_number ?? 0 });
    if (decisions.length) {
      await supabase
        .from("coaching_decisions")
        .insert(decisions.map((d) => ({ coaching_log_id: log.id, decision: d })));
    }
  }

  const logByWeek = (w: number) => insertedLogs.find((l) => l.week_number === w)?.id ?? null;

  // 6. Action items
  await supabase.from("action_items").insert([
    {
      client_id: clientId,
      coaching_log_id: logByWeek(13),
      title: "Rebuild 13-week cashflow model",
      owner_name: "Priya Anand",
      due_date: dayOffset(-2),
      status: "open",
    },
    {
      client_id: clientId,
      coaching_log_id: logByWeek(12),
      title: "Henderson site visit — context recap",
      owner_name: "Curtis",
      due_date: dayOffset(0),
      status: "open",
    },
    {
      client_id: clientId,
      coaching_log_id: logByWeek(14),
      title: "Lock Jordan promotion paperwork",
      owner_name: "James Whitfield",
      due_date: dayOffset(-4),
      status: "open",
    },
    {
      client_id: clientId,
      coaching_log_id: logByWeek(14),
      title: "Send Q2 hiring freeze comms",
      owner_name: "Brett",
      due_date: dayOffset(1),
      status: "overdue",
    },
    {
      client_id: clientId,
      coaching_log_id: null,
      title: "Approve plant inspection SOP",
      owner_name: "Curtis",
      due_date: dayOffset(5),
      status: "done",
    },
  ]);

  // 7. Activity feed
  await supabase.from("activity_feed").insert([
    {
      client_id: clientId,
      type: "playbook",
      actor_name: "Jordan Mills",
      message: "approved OPS-014 — Site mobilisation checklist",
    },
    {
      client_id: clientId,
      type: "alert",
      actor_name: "System",
      message: "Cashflow forecast 18% below trailing 4-week avg",
    },
    {
      client_id: clientId,
      type: "decision",
      actor_name: "Curtis",
      message: "logged decision: hold Sydney expansion until July",
    },
    {
      client_id: clientId,
      type: "playbook",
      actor_name: "Sienna Park",
      message: "submitted HSEQ-022 for review",
    },
    {
      client_id: clientId,
      type: "log",
      actor_name: "Curtis",
      message: "completed Captain's Table — Week 14",
    },
    {
      client_id: clientId,
      type: "playbook",
      actor_name: "Rob Romancz",
      message: "submitted COMP-003 — Subcontractor onboarding",
    },
    {
      client_id: clientId,
      type: "action",
      actor_name: "Priya Anand",
      message: "opened action: Rebuild 13-week cashflow model",
    },
  ]);

  return { client_id: clientId, client_name: fullName };
}
