import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { Plug, Bell, Shield, Users, Command, CheckCircle2, X, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useRequiredClient } from "@/lib/client-context";
import { useAuth } from "@/lib/auth-context";
import { useIntegrations, useUpsertIntegration, useWorkstreams, useClients } from "@/lib/hooks";
import { STAFF_MEMBERS } from "@/lib/staff";
import { seedDemoClient, isDemoClient, stripDemoPrefix } from "@/lib/demo-seed";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const existingDemos = allClients.filter((c) => isDemoClient(c.name));
  const [demoName, setDemoName] = useState("Apex Demo Co");
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const result = await seedDemoClient(demoName.trim() || "Apex Demo Co");
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSeedMessage({ kind: "success", text: `Created "${stripDemoPrefix(result.client_name)}". Switch to it from the client picker in the sidebar.` });
    } catch (err) {
      setSeedMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed to create demo client." });
    } finally {
      setSeeding(false);
    }
  };

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
              <Field label="Workspace name" value={`${client.name} · ${profile?.full_name ?? "Commander"}`} />
              <Field label="Default timezone" value={client.timezone ?? "Australia/Brisbane"} />
              <Field label="Week starts on" value={client.week_start ?? "Monday"} />
              <Field label="Coaching cadence" value={client.coaching_cadence ?? "Tuesdays · 7:00am"} />
              <Field label="Industry" value={client.industry ?? "—"} />
              <Field label="Client slug" value={client.slug} />
            </div>
          </Panel>
          )}

          {tab === "team" && (
            <Panel title="Team & department leads" subtitle="Who runs what at SBL Solutions Services">
              <div className="space-y-2">
                {workstreams.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="text-[13px] font-medium">{w.name}</div>
                      <div className="text-[11px] text-muted-foreground">Lead: {w.owner_name ?? "—"}</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Dept</span>
                  </div>
                ))}
                <div className="p-3 rounded-lg border border-dashed border-border text-[11px] text-muted-foreground">
                  Staff roster ({STAFF_MEMBERS.length}): {STAFF_MEMBERS.join(", ")}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  To change a department lead or add new staff, edit <code>src/lib/staff.ts</code> or run an UPDATE on the <code>workstreams</code> table.
                </p>
              </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-1.5 sm:gap-3">
      <label className="text-[12px] text-muted-foreground">{label}</label>
      <input
        key={value}
        defaultValue={value}
        className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-primary/40"
      />
    </div>
  );
}
