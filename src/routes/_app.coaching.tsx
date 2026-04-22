import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Plus, Calendar, Loader2, X, PlusCircle, Trash2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useCoachingLogs, useCreateCoachingLog } from "@/lib/hooks";
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
  const createLog = useCreateCoachingLog();

  const totalDecisions = logs.reduce((s, l) => s + (l.decisions?.length ?? 0), 0);
  const latestWeek = logs.length > 0 ? (logs[0].week_number ?? 0) : 0;

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [fDate, setFDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [fWeek, setFWeek] = useState(() => String(latestWeek + 1));
  const [fMood, setFMood] = useState<string>("steady");
  const [fSummary, setFSummary] = useState("");
  const [fDecisions, setFDecisions] = useState<string[]>([""]);

  const resetForm = () => {
    setFDate(new Date().toISOString().split("T")[0]);
    setFWeek(String(latestWeek + 1));
    setFMood("steady");
    setFSummary("");
    setFDecisions([""]);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const decisions = fDecisions.filter((d) => d.trim() !== "");
    await createLog.mutateAsync({
      client_id: client.id,
      session_date: fDate,
      week_number: Number(fWeek) || null,
      mood: fMood as "strong" | "steady" | "flat" | "under_pressure" | null,
      summary: fSummary || null,
      decisions,
    });
    resetForm();
    setShowForm(false);
  };

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
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Log this week</span><span className="sm:hidden">Log</span>
          </button>
        }
      />

      {/* ─── New coaching session form ─── */}
      {showForm && (
        <Panel>
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[13px] font-semibold">Log Coaching Session</div>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Date *</label>
                <input required type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Week #</label>
                <input type="number" value={fWeek} onChange={(e) => setFWeek(e.target.value)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Mood</label>
                <select value={fMood} onChange={(e) => setFMood(e.target.value)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40">
                  <option value="strong">Strong</option>
                  <option value="steady">Steady</option>
                  <option value="flat">Flat</option>
                  <option value="under_pressure">Under Pressure</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Summary</label>
              <textarea value={fSummary} onChange={(e) => setFSummary(e.target.value)} rows={3} placeholder="What happened this session? Key takeaways, observations, momentum..." className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40 resize-y" />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Decisions Locked</label>
              <div className="space-y-2">
                {fDecisions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={d}
                      onChange={(e) => {
                        const next = [...fDecisions];
                        next[i] = e.target.value;
                        setFDecisions(next);
                      }}
                      placeholder={`Decision ${i + 1}`}
                      className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40"
                    />
                    {fDecisions.length > 1 && (
                      <button type="button" onClick={() => setFDecisions(fDecisions.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setFDecisions([...fDecisions, ""])} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                  <PlusCircle className="h-3 w-3" /> Add decision
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button type="submit" disabled={createLog.isPending || !fDate} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50">
                {createLog.isPending ? "Saving..." : "Log Session"}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2 rounded-md bg-secondary/60 border border-border text-[12px]">
                Cancel
              </button>
              {createLog.isError && (
                <span className="text-[11px] text-destructive">{(createLog.error as Error).message}</span>
              )}
            </div>
          </form>
        </Panel>
      )}

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
