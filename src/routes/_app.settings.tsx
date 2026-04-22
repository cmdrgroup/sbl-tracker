import { createFileRoute } from "@tanstack/react-router";
import { Plug, Bell, Shield, CreditCard, Users, Command } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useActiveClient } from "@/lib/client-context";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Command Overlay" }] }),
});

const INTEGRATIONS = [
  { name: "Slack", desc: "Push alerts and AI briefs to channels", connected: true, color: "oklch(0.78 0.14 80)" },
  { name: "Google Drive", desc: "Sync SOP documents", connected: true, color: "oklch(0.68 0.13 145)" },
  { name: "Loom", desc: "Auto-attach recordings to SOPs", connected: true, color: "oklch(0.55 0.20 28)" },
  { name: "Xero", desc: "Pull cashflow signals", connected: false, color: "oklch(0.70 0.10 220)" },
  { name: "Notion", desc: "Mirror playbook chapters", connected: false, color: "oklch(0.65 0.012 75)" },
  { name: "ClickUp", desc: "Sync action items", connected: false, color: "oklch(0.62 0.115 70)" },
];

function SettingsPage() {
  const { client } = useActiveClient();
  return (
    <div className="p-6 space-y-6 max-w-[1100px]">
      <PageHeader
        eyebrow={`${client.name} · Workspace`}
        title="Settings"
        subtitle="Configure your Command Overlay workspace, integrations, and team."
      />

      <div className="grid grid-cols-[200px_1fr] gap-6">
        <nav className="space-y-0.5">
          {[
            { label: "Workspace", icon: Command, active: true },
            { label: "Team", icon: Users },
            { label: "Integrations", icon: Plug },
            { label: "Notifications", icon: Bell },
            { label: "Security", icon: Shield },
            { label: "Billing", icon: CreditCard },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-left ${
                  s.active ? "bg-primary/15 text-foreground border border-primary/30" : "text-muted-foreground hover:bg-secondary/40 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          <Panel title="Workspace" subtitle="The basics">
            <div className="space-y-4">
              <Field label="Workspace name" value={`${client.name} · Curtis Davies`} />
              <Field label="Default timezone" value="Australia / Brisbane (AEST)" />
              <Field label="Week starts on" value="Monday" />
              <Field label="Captain's Table cadence" value="Tuesdays · 7:00am" />
            </div>
          </Panel>

          <Panel title="Integrations" subtitle="Connect the systems your clients already use">
            <div className="grid grid-cols-2 gap-2.5">
              {INTEGRATIONS.map((i) => (
                <div key={i.name} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
                  <div
                    className="h-8 w-8 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: i.color, color: "oklch(0.13 0.003 60)" }}
                  >
                    {i.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{i.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{i.desc}</div>
                  </div>
                  {i.connected ? (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30">
                      Connected
                    </span>
                  ) : (
                    <button className="text-[11px] font-medium text-primary hover:underline">Connect</button>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Danger zone" subtitle="Irreversible actions">
            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30">
              <div>
                <div className="text-[13px] font-medium">Archive workspace</div>
                <div className="text-[11px] text-muted-foreground">Read-only after archive. Re-activation requires support.</div>
              </div>
              <button className="px-3 py-1.5 rounded-md bg-destructive/15 text-destructive border border-destructive/30 text-[12px] font-medium">
                Archive
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-3">
      <label className="text-[12px] text-muted-foreground">{label}</label>
      <input
        key={value}
        defaultValue={value}
        className="bg-surface border border-border rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-primary/40"
      />
    </div>
  );
}
