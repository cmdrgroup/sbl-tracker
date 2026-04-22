import { createFileRoute } from "@tanstack/react-router";
import { Mail, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { departments } from "@/lib/demo-data";
import { useActiveClient } from "@/lib/client-context";

export const Route = createFileRoute("/_app/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team — Command Overlay" }] }),
});

const emailDomain = (name: string) =>
  name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "") + ".com";

const PEOPLE = departments.map((d, i) => ({
  name: d.owner,
  role: `Head of ${d.name}`,
  department: d.name,
  emailUser: d.owner.toLowerCase().replace(/[^a-z]/g, "."),
  sops: d.total,
  approved: d.approved,
  load: ["light", "balanced", "heavy", "stretched"][i % 4],
  initials: d.owner.split(" ").map((p) => p[0]).join(""),
  hue: [80, 28, 145, 220, 295, 60, 175][i % 7],
}));

const LOAD_CLS: Record<string, string> = {
  light: "bg-success/15 text-success border-success/30",
  balanced: "bg-info/15 text-info border-info/30",
  heavy: "bg-warning/15 text-warning border-warning/30",
  stretched: "bg-destructive/15 text-destructive border-destructive/30",
};

function TeamPage() {
  const { client } = useActiveClient();

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px]">
      <PageHeader
        eyebrow={`${client.name} · People`}
        title="The Team"
        subtitle="Every department lead, their load, their playbook progress — at a glance."
        actions={
          <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add team member</span><span className="sm:hidden">Add</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PEOPLE.map((p) => {
          const pct = Math.round((p.approved / p.sops) * 100);
          return (
            <Panel key={p.name}>
              <div className="flex items-start gap-3">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-[14px] font-bold shrink-0"
                  style={{ background: `oklch(0.72 0.10 ${p.hue})`, color: "oklch(0.13 0.003 60)" }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[16px] md:text-[18px] font-semibold leading-tight truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{p.role}</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5 font-mono">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.emailUser}@{emailDomain(client.name)}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${LOAD_CLS[p.load]}`}>
                  {p.load}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">SOP Ownership</span>
                  <span className="text-[12px] font-semibold tabular-nums">{p.approved}<span className="text-muted-foreground">/{p.sops}</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
