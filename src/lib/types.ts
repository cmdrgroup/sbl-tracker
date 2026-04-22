// ─── Database types matching Supabase schema ───

export type Client = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  color: string;
  health_score: number;
  timezone: string;
  week_start: string;
  coaching_cadence: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: "commander" | "client_owner" | "team_member";
  avatar_url: string | null;
  created_at: string;
};

export type ClientUser = {
  id: string;
  client_id: string;
  user_id: string;
  role: "commander" | "owner" | "member";
  created_at: string;
};

export type Workstream = {
  id: string;
  client_id: string;
  name: string;
  owner_name: string | null;
  color: string;
  sort_order: number;
  created_at: string;
};

export type Playbook = {
  id: string;
  client_id: string;
  workstream_id: string | null;
  code: string | null;
  title: string;
  type: "sop" | "framework" | "script" | "policy" | "campaign" | "playbook" | "other";
  status: "not_started" | "submitted" | "under_review" | "refined" | "approved";
  owner_name: string | null;
  loom_url: string | null;
  loom_duration_min: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  workstream?: Workstream;
};

export type CoachingLog = {
  id: string;
  client_id: string;
  week_number: number | null;
  session_date: string;
  mood: "strong" | "steady" | "flat" | "under_pressure" | null;
  summary: string | null;
  created_at: string;
  // Joined fields
  decisions?: CoachingDecision[];
};

export type CoachingDecision = {
  id: string;
  coaching_log_id: string;
  decision: string;
  created_at: string;
};

export type ActionItem = {
  id: string;
  client_id: string;
  coaching_log_id: string | null;
  title: string;
  owner_name: string | null;
  due_date: string | null;
  status: "open" | "done" | "overdue";
  created_at: string;
  completed_at: string | null;
};

export type ActivityFeedItem = {
  id: string;
  client_id: string;
  type: "playbook" | "decision" | "log" | "alert" | "action";
  actor_name: string | null;
  message: string;
  created_at: string;
};

export type AiBrief = {
  id: string;
  client_id: string;
  brief_type: "weekly" | "daily" | "coaching_prep" | "ad_hoc";
  content: string;
  signals_used: number;
  generated_by: string;
  created_at: string;
};

export type ClientIntegration = {
  id: string;
  client_id: string;
  provider: "loom" | "slack" | "google_drive" | "xero" | "notion" | "clickup";
  api_key: string | null;
  webhook_secret: string | null;
  workspace_id: string | null;
  config: Record<string, unknown>;
  connected: boolean;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
};
