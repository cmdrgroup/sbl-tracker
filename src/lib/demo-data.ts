// Demo data for Command Overlay — fractional COS multi-client platform

export type Client = {
  id: string;
  name: string;
  industry: string;
  initials: string;
  color: string;
  health: number; // 0-100
  playbookProgress: number;
  openSops: number;
  weeklyMomentum: "up" | "flat" | "down";
};

export const clients: Client[] = [
  { id: "sbl", name: "SBL Solutions", industry: "Construction Services", initials: "SB", color: "oklch(0.62 0.22 280)", health: 87, playbookProgress: 72, openSops: 4, weeklyMomentum: "up" },
  { id: "harbor", name: "Harbor & Co", industry: "Maritime Logistics", initials: "HC", color: "oklch(0.72 0.18 195)", health: 64, playbookProgress: 41, openSops: 9, weeklyMomentum: "flat" },
  { id: "northwind", name: "Northwind Trades", industry: "Electrical Contracting", initials: "NW", color: "oklch(0.72 0.18 155)", health: 92, playbookProgress: 88, openSops: 2, weeklyMomentum: "up" },
  { id: "axis", name: "Axis Property Group", industry: "Real Estate", initials: "AX", color: "oklch(0.78 0.16 75)", health: 58, playbookProgress: 33, openSops: 12, weeklyMomentum: "down" },
  { id: "meridian", name: "Meridian Health", industry: "Allied Health", initials: "MH", color: "oklch(0.65 0.24 25)", health: 76, playbookProgress: 61, openSops: 6, weeklyMomentum: "up" },
];

export type Department = {
  name: string;
  total: number;
  approved: number;
  inReview: number;
  notStarted: number;
  owner: string;
};

export const departments: Department[] = [
  { name: "Operations", total: 18, approved: 14, inReview: 3, notStarted: 1, owner: "Marcus Chen" },
  { name: "Finance", total: 12, approved: 9, inReview: 2, notStarted: 1, owner: "Priya Anand" },
  { name: "Compliance", total: 9, approved: 5, inReview: 3, notStarted: 1, owner: "Liam O'Connor" },
  { name: "HSEQ", total: 14, approved: 10, inReview: 2, notStarted: 2, owner: "Sienna Park" },
  { name: "Quality", total: 11, approved: 8, inReview: 1, notStarted: 2, owner: "David Müller" },
  { name: "Construction", total: 22, approved: 15, inReview: 4, notStarted: 3, owner: "Rachel Kim" },
  { name: "People & Culture", total: 8, approved: 6, inReview: 1, notStarted: 1, owner: "James Whitfield" },
];

export type Sop = {
  id: string;
  code: string;
  title: string;
  department: string;
  owner: string;
  status: "not_started" | "submitted" | "under_review" | "refined" | "approved";
  updatedAt: string;
  loomMinutes?: number;
};

export const sops: Sop[] = [
  { id: "1", code: "OPS-014", title: "Site mobilisation checklist", department: "Operations", owner: "Marcus Chen", status: "approved", updatedAt: "2h ago", loomMinutes: 12 },
  { id: "2", code: "FIN-007", title: "Weekly cashflow forecast", department: "Finance", owner: "Priya Anand", status: "under_review", updatedAt: "1d ago", loomMinutes: 18 },
  { id: "3", code: "HSEQ-022", title: "Incident escalation pathway", department: "HSEQ", owner: "Sienna Park", status: "refined", updatedAt: "3h ago", loomMinutes: 9 },
  { id: "4", code: "COMP-003", title: "Subcontractor onboarding pack", department: "Compliance", owner: "Liam O'Connor", status: "submitted", updatedAt: "5h ago", loomMinutes: 22 },
  { id: "5", code: "CON-031", title: "Concrete pour QA gate", department: "Construction", owner: "Rachel Kim", status: "under_review", updatedAt: "Yesterday", loomMinutes: 14 },
  { id: "6", code: "OPS-019", title: "End-of-day handover protocol", department: "Operations", owner: "Marcus Chen", status: "approved", updatedAt: "2d ago", loomMinutes: 7 },
  { id: "7", code: "QUAL-008", title: "Defect register triage", department: "Quality", owner: "David Müller", status: "not_started", updatedAt: "—" },
  { id: "8", code: "P&C-004", title: "New starter induction (Day 1)", department: "People & Culture", owner: "James Whitfield", status: "approved", updatedAt: "4d ago", loomMinutes: 31 },
  { id: "9", code: "FIN-011", title: "Invoice approval matrix", department: "Finance", owner: "Priya Anand", status: "submitted", updatedAt: "6h ago", loomMinutes: 11 },
  { id: "10", code: "CON-027", title: "Plant pre-start inspection", department: "Construction", owner: "Rachel Kim", status: "approved", updatedAt: "1d ago", loomMinutes: 8 },
];

export type CoachingLog = {
  id: string;
  date: string;
  week: number;
  client: string;
  mood: "strong" | "steady" | "flat" | "pressure";
  summary: string;
  decisions: string[];
};

export const coachingLogs: CoachingLog[] = [
  {
    id: "c1", date: "Apr 21", week: 14, client: "SBL Solutions", mood: "strong",
    summary: "Brett locked in the Q2 hiring freeze. Operations playbook crossed 70% — momentum is real.",
    decisions: ["Hold on Sydney expansion until July", "Promote Marcus to Ops Lead", "Approve $40k tooling spend"],
  },
  {
    id: "c2", date: "Apr 14", week: 13, client: "SBL Solutions", mood: "steady",
    summary: "Cashflow tighter than forecast. Curtis to rebuild the 13-week model with Priya.",
    decisions: ["Defer marketing retainer 30 days", "Weekly cashflow Tuesdays 7am"],
  },
  {
    id: "c3", date: "Apr 7", week: 12, client: "SBL Solutions", mood: "pressure",
    summary: "Two key project delays surfaced. Need to rebuild trust with the Henderson account.",
    decisions: ["Curtis attends Henderson site visit Friday", "Pause new BD until backlog clears"],
  },
];

export type Activity = {
  id: string;
  type: "sop" | "decision" | "log" | "alert";
  actor: string;
  text: string;
  time: string;
};

export const activity: Activity[] = [
  { id: "a1", type: "sop", actor: "Marcus Chen", text: "approved OPS-014 — Site mobilisation checklist", time: "2m" },
  { id: "a2", type: "alert", actor: "System", text: "Cashflow forecast 18% below trailing 4-week avg", time: "21m" },
  { id: "a3", type: "decision", actor: "Curtis", text: "logged decision: hold Sydney expansion until July", time: "1h" },
  { id: "a4", type: "sop", actor: "Sienna Park", text: "submitted HSEQ-022 for review", time: "3h" },
  { id: "a5", type: "log", actor: "Curtis", text: "completed Captain's Table — Week 14 with SBL", time: "5h" },
  { id: "a6", type: "sop", actor: "Liam O'Connor", text: "submitted COMP-003 — Subcontractor onboarding", time: "5h" },
  { id: "a7", type: "alert", actor: "System", text: "Axis Property — 3 SOPs overdue >14 days", time: "8h" },
];

export type ActionItem = {
  id: string;
  text: string;
  owner: string;
  due: string;
  status: "open" | "done" | "overdue";
};

export const actionItems: ActionItem[] = [
  { id: "ai1", text: "Rebuild 13-week cashflow model", owner: "Priya Anand", due: "Fri", status: "open" },
  { id: "ai2", text: "Henderson site visit — context recap", owner: "Curtis", due: "Today", status: "open" },
  { id: "ai3", text: "Lock Marcus promotion paperwork", owner: "James Whitfield", due: "Mon", status: "open" },
  { id: "ai4", text: "Send Q2 hiring freeze comms", owner: "Brett", due: "Wed", status: "overdue" },
  { id: "ai5", text: "Approve plant inspection SOP", owner: "Curtis", due: "—", status: "done" },
];

// Sparkline data: 14 weeks
export const playbookTrend = [22, 28, 31, 34, 38, 41, 47, 52, 55, 58, 62, 65, 69, 72];
export const cashflowTrend = [100, 102, 98, 95, 91, 94, 97, 92, 88, 85, 89, 86, 82, 84];
export const sopVelocity = [3, 5, 4, 6, 8, 7, 9, 11, 8, 10, 12, 14, 11, 13];
