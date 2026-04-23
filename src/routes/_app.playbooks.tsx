import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ArrowUpRight, Sparkles, Loader2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { usePlaybooks, useWorkstreams } from "@/lib/hooks";
import { useRequiredClient } from "@/lib/client-context";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/playbooks")({
  component: PlaybooksPage,
  head: () => ({ meta: [{ title: "Playbooks — Command Overlay" }] }),
});

function PlaybooksPage() {
  const { client } = useRequiredClient();
  const { data: playbooks = [], isLoading: loadingPb } = usePlaybooks(client.id);
  const { data: workstreams = [], isLoading: loadingWs } = useWorkstreams(client.id);

  // Aggregate per-workstream stats from real playbook data
  const wsStats = useMemo(() => {
    return workstreams.map((ws) => {
      const items = playbooks.filter((p) => p.workstream_id === ws.id);
      const total = items.length;
      const approved = items.filter((p) => p.status === "approved").length;
      const inReview = items.filter((p) => p.status === "under_review" || p.status === "refined").length;
      const notStarted = items.filter((p) => p.status === "not_started").length;
      return { ...ws, total, approved, inReview, notStarted };
    });
  }, [workstreams, playbooks]);

  const total = playbooks.length;
  const approved = playbooks.filter((p) => p.status === "approved").length;
  const submitted = playbooks.filter((p) => p.status === "submitted").length;
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

  if (loadingPb || loadingWs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px]">
      <PageHeader
        eyebrow={`${client.name} · Playbook`}
        title="The Operating Playbook"
        subtitle="Every department, every SOP, every owner — captured as a living system."
        actions={
          <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Generate next chapter</span><span className="sm:hidden">Generate</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Panel title="Overall Completion" subtitle={`Across ${workstreams.length} departments`}>
          <div className="flex items-end gap-2">
            <span className="font-display text-[44px] md:text-[56px] leading-none font-semibold">{pct}</span>
            <span className="text-[18px] text-muted-foreground mb-2">%</span>
          </div>
          <div className="h-1.5 mt-3 rounded-full bg-secondary/60 overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-2">{approved} of {total} playbooks approved</div>
        </Panel>

        <Panel title="Pipeline" subtitle="By status">
          <div className="space-y-2 text-[13px]">
            <Stat label="Approved" value={String(approved)} />
            <Stat label="Submitted" value={String(submitted)} />
            <Stat label="In review / Refined" value={String(playbooks.filter(p => p.status === "under_review" || p.status === "refined").length)} />
            <Stat label="Not started" value={String(playbooks.filter(p => p.status === "not_started").length)} />
          </div>
        </Panel>

        <Panel title="This Week" subtitle="Velocity indicators" accent>
          <div className="space-y-2 text-[13px]">
            <Stat label="Total playbooks" value={String(total)} />
            <Stat label="Departments" value={String(workstreams.length)} />
            <Stat label="Completion" value={`${pct}%`} />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {wsStats.map((d) => {
          const dpct = d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0;
          return (
            <Panel key={d.id}>
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-display text-[16px] md:text-[18px] font-semibold truncate">{d.name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">Owner · {d.owner_name ?? "—"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-[24px] md:text-[28px] leading-none font-semibold">{dpct}<span className="text-[12px] text-muted-foreground">%</span></div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden flex">
                <div className="bg-success h-full" style={{ width: `${d.total > 0 ? (d.approved / d.total) * 100 : 0}%` }} />
                <div className="bg-warning/70 h-full" style={{ width: `${d.total > 0 ? (d.inReview / d.total) * 100 : 0}%` }} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground">
                  <span><span className="text-success">●</span> {d.approved} approved</span>
                  <span><span className="text-warning">●</span> {d.inReview} review</span>
                  <span>{d.notStarted} pending</span>
                </div>
                <button className="text-[11px] text-primary flex items-center gap-1 hover:underline">
                  Open <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border last:border-0 pb-1.5 last:pb-0">
      <span className="text-muted-foreground text-[12px]">{label}</span>
      <span className="font-mono font-semibold text-primary">{value}</span>
    </div>
  );
}

