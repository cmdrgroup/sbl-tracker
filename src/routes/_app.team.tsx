import { createFileRoute } from "@tanstack/react-router";
import { Mail, Plus, Loader2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useWorkstreams, usePlaybooks } from "@/lib/hooks";
import { useRequiredClient } from "@/lib/client-context";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team — Command Overlay" }] }),
});

const HUES = [80, 28, 145, 220, 295, 60, 175, 340];

function getInitials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

function getLoad(approved: number, total: number): string {
  if (total === 0) return "light";
  const pct = approved / total;
  if (pct >= 0.75) return "light";
  if (pct >= 0.5) return "balanced";
  if (pct >= 0.25) return "heavy";
  return "stretched";
}

const LOAD_CLS: Record<string, string> = {
  light: "bg-success/15 text-success border-success/30",
  balanced: "bg-info/15 text-info border-info/30",
  heavy: "bg-warning/15 text-warning border-warning/30",
  stretched: "bg-destructive/15 text-destructive border-destructive/30",
};

function TeamPage() {
  const { client } = useRequiredClient();
  const { data: workstreams = [], isLoading: loadingWs } = useWorkstreams(client.id);
  const { data: playbooks = [], isLoading: loadingPb } = usePlaybooks(client.id);

  const people = useMemo(() => {
    return workstreams.map((ws, i) => {
      const items = playbooks.filter((p) => p.workstream_id === ws.id);
      const total = items.length;
      const approved = items.filter((p) => p.status === "approved").length;
      return {
        id: ws.id,
        name: ws.owner_name ?? ws.name,
        role: `Head of ${ws.name}`,
        department: ws.name,
        sops: total,
        approved,
        load: getLoad(approved, total),
        initials: getInitials(ws.owner_name ?? ws.name),
        hue: HUES[i % HUES.length],
      };
    });
  }, [workstreams, playbooks]);

  if (loadingWs || loadingPb) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        {people.map((p) => {
          const pct = p.sops > 0 ? Math.round((p.approved / p.sops) * 100) : 0;
          return (
            <Panel key={p.id}>
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
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${LOAD_CLS[p.load]}`}>
                  {p.load}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Playbook Progress</span>
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
