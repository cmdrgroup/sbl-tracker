import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus, Calendar, Loader2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useCoachingLogs } from "@/lib/hooks";
import { useRequiredClient } from "@/lib/client-context";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

export const Route = createFileRoute("/_app/coaching")({
  component: CoachingPage,
  head: () => ({ meta: [{ title: "Coaching Logs — Command Overlay" }] }),
});

const MOOD: Record<string, { label: string; cls: string }> = {
  strong: { label: "Strong", cls: "bg-success/15 text-success border-success/30" },
  steady: { label: "Steady", cls: "bg-info/15 text-info border-info/30" },
  flat: { label: "Flat", cls: "bg-warning/15 text-warning border-warning/30" },
  pressure: { label: "Under Pressure", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  under_pressure: { label: "Under Pressure", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

function CoachingPage() {
  const { client } = useRequiredClient();
  const { data: logs = [], isLoading } = useCoachingLogs(client.id);

  const totalDecisions = logs.reduce((s, l) => s + (l.decisions?.length ?? 0), 0);
  const latestWeek = logs.length > 0 ? (logs[0].week_number ?? 0) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px]">
      <PageHeader
        eyebrow={`${client.name} · Captain's Table`}
        title="Coaching Logs"
        subtitle="Every weekly session captured. Decisions, mood, momentum — the operator's record."
        actions={
          <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Log this week</span><span className="sm:hidden">Log</span>
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Panel title="Sessions Logged" subtitle="All time">
          <div className="font-display text-[32px] md:text-[44px] leading-none font-semibold">{logs.length}</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">100% adherence</div>
        </Panel>
        <Panel title="Decisions Locked" subtitle="All time">
          <div className="font-display text-[32px] md:text-[44px] leading-none font-semibold">{totalDecisions}</div>
          <div className="text-[11px] font-mono text-success mt-1">Across {logs.length} sessions</div>
        </Panel>
        <Panel title="Latest Mood" subtitle="Most recent session">
          <div className="font-display text-[32px] md:text-[44px] leading-none font-semibold text-success">
            {logs.length > 0 && logs[0].mood ? MOOD[logs[0].mood]?.label ?? "—" : "—"}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">Week {latestWeek}</div>
        </Panel>
        <Panel title="Next Session" subtitle="Captain's Table" accent>
          <div className="font-display text-[20px] md:text-[28px] leading-none font-semibold">Tue · 7:00am</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">Week {latestWeek + 1}</div>
        </Panel>
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          const moodKey = log.mood ?? "steady";
          const moodInfo = MOOD[moodKey] ?? MOOD.steady;
          return (
            <Panel key={log.id}>
              <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 md:gap-6">
                <div className="md:border-r md:border-border md:pr-6 pb-3 md:pb-0 border-b md:border-b-0 border-border">
                  <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Week {log.week_number ?? "—"}</div>
                  <div className="font-display text-[24px] md:text-[28px] font-semibold mt-1">{formatDate(log.session_date)}</div>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border font-mono uppercase tracking-wider mt-3", moodInfo.cls)}>
                    {moodInfo.label}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3">
                    <Calendar className="h-3 w-3" />
                    <span className="truncate">{client.name}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1.5">Summary</div>
                    <p className="text-[13px] md:text-[14px] leading-relaxed">{log.summary ?? "No summary recorded."}</p>
                  </div>
                  {(log.decisions?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">Decisions Locked</div>
                      <div className="space-y-1.5">
                        {log.decisions!.map((d, i) => (
                          <div key={d.id ?? i} className="flex items-start gap-2 text-[13px]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                            <span>{d.decision}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
