import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus, Calendar } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { coachingLogs } from "@/lib/demo-data";
import { useActiveClient } from "@/lib/client-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/coaching")({
  component: CoachingPage,
  head: () => ({ meta: [{ title: "Coaching Logs — Command Overlay" }] }),
});

const MOOD: Record<string, { label: string; cls: string }> = {
  strong: { label: "Strong", cls: "bg-success/15 text-success border-success/30" },
  steady: { label: "Steady", cls: "bg-info/15 text-info border-info/30" },
  flat: { label: "Flat", cls: "bg-warning/15 text-warning border-warning/30" },
  pressure: { label: "Under Pressure", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

function CoachingPage() {
  const { client } = useActiveClient();

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <PageHeader
        eyebrow={`${client.name} · Captain's Table`}
        title="Coaching Logs"
        subtitle="Every weekly session captured. Decisions, mood, momentum — the operator's record."
        actions={
          <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Log this week
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-3">
        <Panel title="Sessions Logged" subtitle="All time">
          <div className="font-display text-[44px] leading-none font-semibold">14</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">100% adherence</div>
        </Panel>
        <Panel title="Decisions Locked" subtitle="Last 90 days">
          <div className="font-display text-[44px] leading-none font-semibold">37</div>
          <div className="text-[11px] font-mono text-success mt-1">+8 vs prior 90</div>
        </Panel>
        <Panel title="Avg Mood" subtitle="Trailing 4 weeks">
          <div className="font-display text-[44px] leading-none font-semibold text-success">Steady</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">Trending up</div>
        </Panel>
        <Panel title="Next Session" subtitle="Captain's Table" accent>
          <div className="font-display text-[28px] leading-none font-semibold">Tue · 7:00am</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">Week 15 · in 4 days</div>
        </Panel>
      </div>

      <div className="space-y-3">
        {coachingLogs.map((log) => (
          <Panel key={log.id}>
            <div className="grid grid-cols-[120px_1fr] gap-6">
              <div className="border-r border-border pr-6">
                <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Week {log.week}</div>
                <div className="font-display text-[28px] font-semibold mt-1">{log.date}</div>
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border font-mono uppercase tracking-wider mt-3", MOOD[log.mood].cls)}>
                  {MOOD[log.mood].label}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3">
                  <Calendar className="h-3 w-3" />
                  <span>{client.name}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1.5">Summary</div>
                  <p className="text-[14px] leading-relaxed">{log.summary}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">Decisions Locked</div>
                  <div className="space-y-1.5">
                    {log.decisions.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-[13px]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
