import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { Plug, Bell, Shield, Users, Command, CheckCircle2, X, ExternalLink, Loader2, Plus, Trash2, Pencil, Check } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useRequiredClient } from "@/lib/client-context";
import { useAuth } from "@/lib/auth-context";
import { useIntegrations, useUpsertIntegration, useWorkstreams, useUpdateClient, useUpdateWorkstream, useStaff, useAddStaff, useRenameStaff, useDeleteStaff } from "@/lib/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = ["workspace", "team", "integrations", "notifications", "security"] as const;
type TabKey = (typeof TABS)[number];

const settingsSearchSchema = z.object({
  tab: fallback(z.enum(TABS), "workspace").default("workspace"),
});

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  validateSearch: zodValidator(settingsSearchSchema),
  head: () => ({ meta: [{ title: "Settings — Command Overlay" }] }),
});

type ProviderKey = "loom" | "slack" | "google_drive" | "xero" | "notion" | "clickup";

const PROVIDERS: {
  key: ProviderKey;
  name: string;
  desc: string;
  color: string;
  configurable: boolean;
}[] = [
  { key: "loom", name: "Loom", desc: "Auto-import SOP recordings into your playbook", color: "oklch(0.55 0.20 28)", configurable: true },
  { key: "slack", name: "Slack", desc: "Push AI briefs and alerts to channels", color: "oklch(0.78 0.14 80)", configurable: false },
  { key: "google_drive", name: "Google Drive", desc: "Sync SOP documents", color: "oklch(0.68 0.13 145)", configurable: false },
  { key: "xero", name: "Xero", desc: "Pull cashflow signals for AI insights", color: "oklch(0.70 0.10 220)", configurable: false },
  { key: "notion", name: "Notion", desc: "Mirror playbook chapters", color: "oklch(0.65 0.012 75)", configurable: false },
  { key: "clickup", name: "ClickUp", desc: "Sync action items", color: "oklch(0.62 0.115 70)", configurable: false },
];

function SettingsPage() {
  const { client } = useRequiredClient();
  const { profile } = useAuth();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: integrations = [], isLoading: loadingInt } = useIntegrations(client.id);
  const { data: workstreams = [] } = useWorkstreams(client.id);
  const { data: allClients = [] } = useClients();
  const upsertIntegration = useUpsertIntegration();
  const updateClient = useUpdateClient();

  const [workspaceForm, setWorkspaceForm] = useState({
    name: client.name,
    timezone: client.timezone ?? "Australia/Brisbane",
    week_start: client.week_start ?? "Monday",
    coaching_cadence: client.coaching_cadence ?? "Tuesdays · 7:00am",
    industry: client.industry ?? "",
    slug: client.slug,
  });

  // Re-sync the form whenever the active client changes (e.g. user switches
  // workspaces from the sidebar) or when the underlying client record is
  // refreshed after a save. Without this the form keeps showing the previous
  // workspace's name/slug.
  useEffect(() => {
    setWorkspaceForm({
      name: client.name,
      timezone: client.timezone ?? "Australia/Brisbane",
      week_start: client.week_start ?? "Monday",
      coaching_cadence: client.coaching_cadence ?? "Tuesdays · 7:00am",
      industry: client.industry ?? "",
      slug: client.slug,
    });
  }, [client.id, client.name, client.timezone, client.week_start, client.coaching_cadence, client.industry, client.slug]);

  const dirty =
    workspaceForm.name !== client.name ||
    workspaceForm.timezone !== (client.timezone ?? "Australia/Brisbane") ||
    workspaceForm.week_start !== (client.week_start ?? "Monday") ||
    workspaceForm.coaching_cadence !== (client.coaching_cadence ?? "Tuesdays · 7:00am") ||
    workspaceForm.industry !== (client.industry ?? "") ||
    workspaceForm.slug !== client.slug;

  const handleSaveWorkspace = async () => {
    try {
      await updateClient.mutateAsync({ id: client.id, patch: workspaceForm });
      toast.success("Workspace saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save workspace");
    }
  };

  const setField = (key: keyof typeof workspaceForm) => (v: string) =>
    setWorkspaceForm((f) => ({ ...f, [key]: v }));

  // Loom setup form state
  const [showLoomSetup, setShowLoomSetup] = useState(false);
  const [loomApiKey, setLoomApiKey] = useState("");
  const [loomWorkspaceId, setLoomWorkspaceId] = useState("");

  const loomIntegration = integrations.find((i) => i.provider === "loom");

  const handleLoomConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertIntegration.mutateAsync({
      client_id: client.id,
      provider: "loom",
      api_key: loomApiKey || null,
      workspace_id: loomWorkspaceId || null,
      webhook_secret: null,
      config: {},
      connected: true,
      connected_at: new Date().toISOString(),
    });
    setShowLoomSetup(false);
    setLoomApiKey("");
    setLoomWorkspaceId("");
  };

  const handleLoomDisconnect = async () => {
    await upsertIntegration.mutateAsync({
      client_id: client.id,
      provider: "loom",
      api_key: null,
      workspace_id: null,
      webhook_secret: null,
      config: {},
      connected: false,
      connected_at: null,
    });
  };

  const isConnected = (provider: ProviderKey) =>
    integrations.some((i) => i.provider === provider && i.connected);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1100px]">
      <PageHeader
        eyebrow={`${client.name} · Workspace`}
        title="Settings"
        subtitle="Configure your Command Overlay workspace, integrations, and team."
      />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-6">
        <nav className="flex md:block gap-1 md:space-y-0.5 overflow-x-auto scrollbar-thin -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
          {([
            { key: "workspace" as const, label: "Workspace", icon: Command },
            { key: "team" as const, label: "Team", icon: Users },
            { key: "integrations" as const, label: "Integrations", icon: Plug },
            { key: "notifications" as const, label: "Notifications", icon: Bell },
            { key: "security" as const, label: "Security", icon: Shield },
          ]).map((s) => {
            const Icon = s.icon;
            const active = tab === s.key;
            return (
              <button
                key={s.key}
                onClick={() => navigate({ search: { tab: s.key } })}
                className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-left whitespace-nowrap ${
                  active ? "bg-primary/15 text-foreground border border-primary/30" : "text-muted-foreground hover:bg-secondary/40 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {tab === "workspace" && (
          <Panel title="Workspace" subtitle="The basics">
            <div className="space-y-4">
              <Field label="Workspace name" value={workspaceForm.name} onChange={setField("name")} />
              <TimezoneField label="Default timezone" value={workspaceForm.timezone} onChange={setField("timezone")} />
              <Field label="Week starts on" value={workspaceForm.week_start} onChange={setField("week_start")} />
              <Field label="Coaching cadence" value={workspaceForm.coaching_cadence} onChange={setField("coaching_cadence")} />
              <Field label="Industry" value={workspaceForm.industry} onChange={setField("industry")} />
              <Field label="Client slug" value={workspaceForm.slug} onChange={setField("slug")} />
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                {dirty && (
                  <button
                    onClick={() => setWorkspaceForm({
                      name: client.name,
                      timezone: client.timezone ?? "Australia/Brisbane",
                      week_start: client.week_start ?? "Monday",
                      coaching_cadence: client.coaching_cadence ?? "Tuesdays · 7:00am",
                      industry: client.industry ?? "",
                      slug: client.slug,
                    })}
                    className="px-3 py-1.5 rounded-md bg-secondary/60 border border-border text-[12px]"
                  >
                    Discard
                  </button>
                )}
                <button
                  onClick={handleSaveWorkspace}
                  disabled={!dirty || updateClient.isPending}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50"
                >
                  {updateClient.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </Panel>
          )}

          {tab === "team" && (
            <Panel title="Team & department leads" subtitle="Assign a staff member to lead each department">
              <TeamTab workstreams={workstreams} />
            </Panel>
          )}

          {tab === "notifications" && (
            <Panel title="Notifications" subtitle="Where alerts get sent">
              <p className="text-[12px] text-muted-foreground">
                Notification routing is coming soon. Planned: weekly Captain's Table digest, SOP submission alerts to Slack, overdue action-item nudges by email.
              </p>
            </Panel>
          )}

          {tab === "security" && (
            <Panel title="Security" subtitle="Access control & audit">
              <p className="text-[12px] text-muted-foreground">
                RLS policies are active on all tables. Sign-in is via magic link. Audit log and 2FA are on the roadmap.
              </p>
            </Panel>
          )}

          {tab === "integrations" && (
          <Panel title="Integrations" subtitle="Connect the systems your clients already use">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROVIDERS.map((p) => {
                const connected = isConnected(p.key);
                return (
                  <div key={p.key} className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    connected ? "border-success/30" : "border-border hover:border-primary/40",
                  )}>
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: p.color, color: "oklch(0.13 0.003 60)" }}
                    >
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.desc}</div>
                    </div>
                    {connected ? (
                      <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30 shrink-0">
                        Connected
                      </span>
                    ) : p.configurable ? (
                      <button
                        onClick={() => p.key === "loom" && setShowLoomSetup(true)}
                        className="text-[11px] font-medium text-primary hover:underline shrink-0"
                      >
                        Connect
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">Coming soon</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
          )}

          {/* ─── Loom Setup Panel ─── */}
          {tab === "integrations" && (showLoomSetup || loomIntegration?.connected) && (
            <Panel
              title="Loom Integration"
              subtitle={loomIntegration?.connected ? `Connected ${loomIntegration.connected_at ? new Date(loomIntegration.connected_at).toLocaleDateString("en-AU") : ""}` : "Setup"}
            >
              {loomIntegration?.connected ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">Loom is connected</div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        New Loom recordings will automatically create playbook entries in "Submitted" status.
                        {loomIntegration.workspace_id && <span className="block mt-0.5 font-mono">Workspace: {loomIntegration.workspace_id}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface/40 border border-border">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Webhook URL</div>
                    <div className="text-[12px] font-mono bg-surface border border-border rounded px-3 py-2 break-all select-all">
                      https://bsvreslnbuqkjgnufpis.supabase.co/functions/v1/loom-webhook
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-2">
                      Add this URL in your Loom Developer Portal under Webhooks. Subscribe to "video.created" and "video.transcoded" events.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="https://www.loom.com/developer-portal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-md bg-secondary/60 border border-border text-[12px] flex items-center gap-1.5 hover:bg-secondary"
                    >
                      <ExternalLink className="h-3 w-3" /> Open Loom Developer Portal
                    </a>
                    <button
                      onClick={handleLoomDisconnect}
                      disabled={upsertIntegration.isPending}
                      className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive border border-destructive/30 text-[12px] hover:bg-destructive/20"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLoomConnect} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px]">Connect your Loom workspace to auto-import SOP recordings.</div>
                    <button type="button" onClick={() => setShowLoomSetup(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-info/5 border border-info/20 text-[12px] text-muted-foreground">
                    <strong className="text-foreground">How it works:</strong> When someone records a Loom in your workspace, Command Overlay automatically creates a playbook entry with the video URL, duration, and recorder's name. The entry starts in "Submitted" status for review.
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Loom API Key (optional)</label>
                    <input
                      value={loomApiKey}
                      onChange={(e) => setLoomApiKey(e.target.value)}
                      placeholder="loom_api_..."
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40 font-mono"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Get this from <a href="https://www.loom.com/developer-portal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Loom Developer Portal</a>. Optional if using webhook-only mode.
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Loom Workspace ID (optional)</label>
                    <input
                      value={loomWorkspaceId}
                      onChange={(e) => setLoomWorkspaceId(e.target.value)}
                      placeholder="ws_..."
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40 font-mono"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Used to match incoming webhooks to this client. Find it in your Loom workspace settings.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={upsertIntegration.isPending}
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50"
                    >
                      {upsertIntegration.isPending ? "Connecting..." : "Connect Loom"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLoomSetup(false)}
                      className="px-4 py-2 rounded-md bg-secondary/60 border border-border text-[12px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </Panel>
          )}

          {tab === "workspace" && (
            <Panel title="Demo subaccount" subtitle="Spin up a fully-populated fictional client for sales screenshares">
              <div className="space-y-4">
                {existingDemos.length > 0 && (
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-accent mb-1.5">Existing demos · {existingDemos.length}</div>
                    <div className="space-y-1">
                      {existingDemos.map((d) => (
                        <div key={d.id} className="text-[12px] flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-accent" />
                          <span className="font-medium">{stripDemoPrefix(d.name)}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">· health {d.health_score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Company name</label>
                  <input
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="Apex Demo Co"
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40"
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Builds a full demo: 7 departments, 10 SOPs across all stages, 3 Captain's Table logs with decisions, action items, and an activity feed. Tagged "[DEMO]" so you'll always know it isn't a real client.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    onClick={handleSeedDemo}
                    disabled={seeding}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 flex items-center gap-2 self-start"
                  >
                    {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {seeding ? "Building demo..." : "Create demo client"}
                  </button>
                  {seedMessage && (
                    <div className={cn(
                      "text-[12px] flex-1",
                      seedMessage.kind === "success" ? "text-success" : "text-destructive"
                    )}>
                      {seedMessage.text}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          )}

          {tab === "workspace" && (
          <Panel title="Danger zone" subtitle="Irreversible actions">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-destructive/30">
              <div>
                <div className="text-[13px] font-medium">Archive workspace</div>
                <div className="text-[11px] text-muted-foreground">Read-only after archive. Re-activation requires support.</div>
              </div>
              <button className="px-3 py-1.5 rounded-md bg-destructive/15 text-destructive border border-destructive/30 text-[12px] font-medium shrink-0 self-start sm:self-auto">
                Archive
              </button>
            </div>
          </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange?: (v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1.5 sm:gap-3">
      <label className="text-[12px] text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-primary/40"
      />
    </div>
  );
}

// All IANA timezones supported by the browser (graceful fallback to a curated list).
const TIMEZONES: string[] = (() => {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (typeof fn === "function") return fn("timeZone");
  } catch { /* noop */ }
  return [
    "UTC",
    "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth", "Australia/Adelaide", "Australia/Hobart", "Australia/Darwin",
    "Pacific/Auckland",
    "Asia/Singapore", "Asia/Hong_Kong", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Amsterdam", "Europe/Stockholm",
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo",
    "Africa/Johannesburg",
  ];
})();

function formatTimezoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return offset ? `${tz.replace(/_/g, " ")} (${offset})` : tz.replace(/_/g, " ");
  } catch {
    return tz.replace(/_/g, " ");
  }
}

function TimezoneField({ label, value, onChange }: { label: string; value: string; onChange?: (v: string) => void }) {
  // Detect the user's browser timezone so we can default + highlight it.
  const browserTz = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
  })();

  // If the saved value isn't a recognised IANA zone, still show it so we
  // never silently overwrite legacy data.
  const options = TIMEZONES.includes(value) || !value ? TIMEZONES : [value, ...TIMEZONES];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1.5 sm:gap-3">
      <label className="text-[12px] text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <select
          value={value || browserTz}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          disabled={!onChange}
          className="flex-1 bg-surface border border-border rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-primary/40"
        >
          {options.map((tz) => (
            <option key={tz} value={tz}>
              {formatTimezoneLabel(tz)}{tz === browserTz ? " · your browser" : ""}
            </option>
          ))}
        </select>
        {onChange && value !== browserTz && (
          <button
            type="button"
            onClick={() => onChange(browserTz)}
            className="text-[11px] px-2 py-1 rounded-md border border-border bg-secondary/40 text-muted-foreground hover:text-foreground shrink-0"
            title={`Use browser timezone (${browserTz})`}
          >
            Use browser
          </button>
        )}
      </div>
    </div>
  );
}

function TeamTab({ workstreams }: { workstreams: ReturnType<typeof useWorkstreams>["data"] }) {
  const updateWorkstream = useUpdateWorkstream();
  const { data: staff = [], isLoading: loadingStaff } = useStaff();
  const addStaff = useAddStaff();
  const renameStaff = useRenameStaff();
  const deleteStaff = useDeleteStaff();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const list = workstreams ?? [];
  const staffNames = staff.map((s) => s.name);

  const handleChange = async (id: string, owner_name: string) => {
    setPendingId(id);
    try {
      await updateWorkstream.mutateAsync({ id, patch: { owner_name: owner_name || null } });
      toast.success("Department lead updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setPendingId(null);
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await addStaff.mutateAsync(name);
      if (newDept) {
        try {
          await updateWorkstream.mutateAsync({ id: newDept, patch: { owner_name: name } });
          const deptName = list.find((w) => w.id === newDept)?.name ?? "department";
          toast.success(`Added ${name} as lead of ${deptName}`);
        } catch (deptErr) {
          toast.success(`Added ${name}`);
          toast.error(deptErr instanceof Error ? deptErr.message : "Couldn't assign department");
        }
      } else {
        toast.success(`Added ${name}`);
      }
      setNewName("");
      setNewDept("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add staff");
    }
  };

  const handleRename = async (id: string, previousName: string) => {
    const name = editValue.trim();
    if (!name || name === previousName) {
      setEditingId(null);
      return;
    }
    try {
      await renameStaff.mutateAsync({ id, name, previousName });
      toast.success("Staff renamed");
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the staff roster? They'll be unassigned from any departments they currently lead.`)) return;
    try {
      await deleteStaff.mutateAsync({ id, name });
      toast.success(`Removed ${name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  return (
    <div className="space-y-5">
      {/* Department leads */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Department leads</div>
        {list.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No departments found for this client yet.</p>
        ) : (
          list.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{w.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Lead: {w.owner_name ?? "—"}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pendingId === w.id && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                <select
                  value={w.owner_name ?? ""}
                  onChange={(e) => handleChange(w.id, e.target.value)}
                  disabled={pendingId === w.id || loadingStaff}
                  className="bg-surface border border-border rounded-md px-2 py-1.5 text-[12px] outline-none focus:border-primary/40 min-w-[180px] disabled:opacity-50"
                >
                  <option value="">— Unassigned —</option>
                  {staffNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  {w.owner_name && !staffNames.includes(w.owner_name) && (
                    <option value={w.owner_name}>{w.owner_name} (legacy)</option>
                  )}
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Staff roster */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Staff roster {staff.length > 0 && <span className="text-muted-foreground/60">({staff.length})</span>}
          </div>
          <div className="text-[10px] text-muted-foreground">Synced to database</div>
        </div>

        {/* Add */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Add staff member…"
            className="flex-1 min-w-[180px] bg-surface border border-border rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-primary/40"
          />
          <select
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            disabled={list.length === 0}
            title="Optionally assign as lead of a department"
            className="bg-surface border border-border rounded-md px-2 py-1.5 text-[12px] outline-none focus:border-primary/40 min-w-[160px] disabled:opacity-50"
          >
            <option value="">— No department —</option>
            {list.map((w) => (
              <option key={w.id} value={w.id}>
                Lead of {w.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || addStaff.isPending}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {addStaff.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add
          </button>
        </div>

        {/* List */}
        {loadingStaff ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-3">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading roster…
          </div>
        ) : staff.length === 0 ? (
          <p className="text-[12px] text-muted-foreground py-2">No staff yet — add the first one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border">
                {editingId === s.id ? (
                  <>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(s.id, s.name);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 bg-surface border border-border rounded px-2 py-1 text-[13px] outline-none focus:border-primary/40"
                    />
                    <button
                      onClick={() => handleRename(s.id, s.name)}
                      className="text-success hover:opacity-70"
                      title="Save"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-muted-foreground hover:opacity-70"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-[13px] truncate">{s.name}</span>
                    <button
                      onClick={() => { setEditingId(s.id); setEditValue(s.name); }}
                      className="text-muted-foreground hover:text-foreground"
                      title="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground pt-1">
          Changes save instantly to the database and propagate everywhere staff appear (department leads, action-item owners, coaching dropdowns).
        </p>
      </div>
    </div>
  );
}
