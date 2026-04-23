import { TrendingUp, TrendingDown, Minus, ArrowUpRight, Sparkles, AlertCircle, CheckCircle2, Clock, FileText, Loader2, Plus, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { usePlaybooks, useWorkstreams, useCoachingLogs, useActivityFeed, useActionItems, useUpdateActionItem, useCreateActionItem, useGenerateBrief } from "@/lib/hooks";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type Props = { client: Client };

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

export function Dashboard({ client }: Props) {
  const { data: playbooks = [], isLoading: loadPb } = usePlaybooks(client.id);
  const { data: workstreams = [], isLoading: loadWs } = useWorkstreams(client.id);
  const { data: coachingLogs = [] } = useCoachingLogs(client.id);
  const { data: activityFeed = [] } = useActivityFeed(client.id);
  const { data: actionItemsList = [] } = useActionItems(client.id);
  const updateAction = useUpdateActionItem();
  const createAction = useCreateActionItem();
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionOwner, setNewActionOwner] = useState("");
  const [showAddAction, setShowAddAction] = useState(false);

  const handleToggleAction = (id: string, currentStatus: string) => {
    updateAction.mutate({
      id,
      status: currentStatus === "done" ? "open" : "done",
      completed_at: currentStatus === "done" ? null : new Date().toISOString(),
    });
  };

  // AI Brief
  const generateBrief = useGenerateBrief();
  const [briefContent, setBriefContent] = useState<string | null>(null);
  const [showBrief, setShowBrief] = useState(false);

  const handleGenerateBrief = async () => {
    setShowBrief(true);
    setBriefContent(null);
    try {
      const result = await generateBrief.mutateAsync({ client_id: client.id, brief_type: "weekly" });
      setBriefContent(result.brief);
    } catch {
      // error handled by mutation state
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;
    await createAction.mutateAsync({
      client_id: client.id,
      title: newActionTitle.trim(),
      owner_name: newActionOwner.trim() || null,
      due_date: null,
      status: "open",
      coaching_log_id: null,
    });
    setNewActionTitle("");
    setNewActionOwner("");
    setShowAddAction(false);
  };

  const wsStats = useMemo(() => {
    return workstreams.map((ws) => {
      const items = playbooks.filter((p) => p.workstream_id === ws.id);
      const total = items.length;
      const approved = items.filter((p) => p.status === "approved").length;
      const inReview = items.filter((p) => p.status === "under_review" || p.status === "refined").length;
      const notStarted = items.filter((p) => p.status === "not_started").length;
      return { id: ws.id, name: ws.name, owner: ws.owner_name ?? "—", total, approved, inReview, notStarted };
    });
  }, [workstreams, playbooks]);

  const totalPb = playbooks.length;
  const approvedPb = playbooks.filter((p) => p.status === "approved").length;
  const playbookPct = totalPb > 0 ? Math.round((approvedPb / totalPb) * 100) : 0;
  const openCount = playbooks.filter((p) => p.status !== "approved" && p.status !== "not_started").length;
  const latestLog = coachingLogs.length > 0 ? coachingLogs[0] : null;
  const openActions = actionItemsList.filter((a) => a.status !== "done").length;

  if (loadPb || loadWs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            <span>Operational Picture</span>
            <span>·</span>
            <span>{latestLog ? `Week ${latestLog.week_number ?? "—"}` : "—"}</span>
          </div>
          <h1 className="font-display text-[22px] sm:text-[28px] md:text-[34px] font-semibold tracking-tight leading-tight">
            Good morning, Curtis. <span className="text-muted-foreground italic">Here's where {client.name} stands.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="px-3 py-1.5 rounded-md bg-secondary/60 hover:bg-secondary text-[12px] font-medium border border-border">
            This week
          </button>
          <button
            onClick={handleGenerateBrief}
            disabled={generateBrief.isPending}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[12px] font-medium flex items-center gap-1.5 shadow-[0_0_20px_oklch(0.62_0.22_280_/_0.3)] disabled:opacity-60"
          >
            {generateBrief.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{generateBrief.isPending ? "Generating..." : "Ask AI for brief"}</span>
            <span className="sm:hidden">{generateBrief.isPending ? "..." : "AI brief"}</span>
          </button>
        </div>
      </div>

      {/* AI Brief panel */}
      {showBrief && (
        <Panel accent>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-background" />
              </div>
              <div>
                <div className="text-[13px] font-semibold">AI Executive Brief</div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {generateBrief.isPending ? "Generating..." : `Generated just now`}
                </div>
              </div>
            </div>
            <button onClick={() => setShowBrief(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {generateBrief.isPending ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[13px] text-muted-foreground">Analysing playbooks, coaching logs, action items...</span>
            </div>
          ) : generateBrief.isError ? (
            <div className="text-[13px] text-destructive">
              {(generateBrief.error as Error).message}
              <div className="text-[11px] text-muted-foreground mt-1">
                Make sure the ANTHROPIC_API_KEY is set in your Supabase Edge Function secrets and the generate-brief function is deployed.
              </div>
            </div>
          ) : briefContent ? (
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{briefContent}</div>
          ) : null}
        </Panel>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Operational Health" value={client.health_score} suffix="/100" trend={+4} accent="oklch(0.62 0.22 280)" sparkline={[60, 65, 68, 72, 75, 78, 81, 84, 87]} />
        <Kpi label="Playbook Progress" value={playbookPct} suffix="%" trend={0} accent="oklch(0.72 0.18 195)" sparkline={[10, 15, 20, 28, 35, 40, 48, 55, playbookPct]} />
        <Kpi label="In Progress" value={openCount} trend={0} invertTrend accent="oklch(0.78 0.16 75)" sparkline={[12, 11, 10, 9, 8, 7, 6, 5, openCount]} />
        <Kpi label="Total Playbooks" value={totalPb} suffix="" trend={0} accent="oklch(0.72 0.18 155)" sparkline={[20, 40, 60, 80, 90, 100, 110, 115, totalPb]} />
      </div>

      {/* Two col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Department progress — wide */}
        <Panel title="Departments" subtitle={`Playbook completion · ${workstreams.length} areas`} className="lg:col-span-2">
          <div className="space-y-2.5">
            {wsStats.map((d) => {
              const pct = d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0;
              return (
                <Link
                  key={d.name}
                  to="/sops"
                  search={{ dept: d.id }}
                  className="grid grid-cols-[100px_1fr_auto] sm:grid-cols-[140px_1fr_auto] items-center gap-3 rounded-md px-1 -mx-1 py-1 hover:bg-secondary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[12px] sm:text-[13px] font-medium truncate">{d.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{d.owner}</div>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden flex">
                      <div className="bg-success h-full" style={{ width: `${pct}%` }} />
                      <div className="bg-warning/70 h-full" style={{ width: `${d.total > 0 ? (d.inReview / d.total) * 100 : 0}%` }} />
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      <span><span className="text-success">●</span> {d.approved} approved</span>
                      <span><span className="text-warning">●</span> {d.inReview} review</span>
                      <span><span className="text-muted-foreground">●</span> {d.notStarted} pending</span>
                    </div>
                    <div className="sm:hidden text-[10px] font-mono text-muted-foreground">
                      {d.approved}/{d.total} done
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] sm:text-[15px] font-semibold tabular-nums">{pct}<span className="text-[11px] text-muted-foreground">%</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>

        {/* AI Insight */}
        <Panel
          title="AI Insight"
          subtitle="Generated 12 min ago"
          accent
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-background" />
              </div>
              <div className="text-[13px] leading-relaxed">
                {approvedPb} of {totalPb} playbooks approved ({playbookPct}%). {wsStats.length > 0 && (
                  <>The strongest department is <span className="text-success font-medium">{wsStats.reduce((best, ws) => ws.total > 0 && (ws.approved / ws.total) > (best.total > 0 ? best.approved / best.total : 0) ? ws : best, wsStats[0]).name}</span>.</>
                )} {openActions > 0 && <> You have <span className="text-warning font-medium">{openActions} open action items</span> to close out.</>}
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1.5">Suggested actions</div>
              {[
                "Review pending playbooks",
                "Close overdue action items",
                "Surface in next Captain's Table",
              ].map((s) => (
                <button key={s} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/40 text-[12px] group">
                  <ArrowUpRight className="h-3 w-3 text-accent shrink-0" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Three col bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* SOP Pipeline */}
        <Panel title="Playbook Pipeline" subtitle="Recently updated" className="lg:col-span-2">
          <div className="overflow-x-auto -mx-2 scrollbar-thin">
            <div className="min-w-[560px] px-2">
              <div className="grid grid-cols-[80px_1fr_120px_100px_60px] gap-3 px-2 py-1.5 text-[10px] uppercase tracking-wider font-mono text-muted-foreground border-b border-border">
                <div>Code</div>
                <div>Title</div>
                <div>Owner</div>
                <div>Status</div>
                <div className="text-right">Updated</div>
              </div>
              {playbooks.slice(0, 8).map((s) => (
                <div key={s.id} className="grid grid-cols-[80px_1fr_120px_100px_60px] gap-3 px-2 py-2 text-[12px] hover:bg-secondary/30 rounded-md items-center">
                  <div className="font-mono text-[11px] text-muted-foreground">{s.code ?? "—"}</div>
                  <div className="truncate">{s.title}</div>
                  <div className="text-muted-foreground truncate text-[11px]">{s.owner_name ?? "—"}</div>
                  <div><StatusPill status={s.status} /></div>
                  <div className="text-right text-[10px] text-muted-foreground font-mono">{timeAgo(s.updated_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Activity feed */}
        <Panel title="Live Feed" subtitle="Across all systems">
          <div className="space-y-3">
            {activityFeed.slice(0, 6).map((a) => (
              <div key={a.id} className="flex gap-2.5">
                <div className="mt-0.5">
                  {a.type === "playbook" && <FileText className="h-3.5 w-3.5 text-info" />}
                  {a.type === "alert" && <AlertCircle className="h-3.5 w-3.5 text-warning" />}
                  {a.type === "decision" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                  {a.type === "log" && <Clock className="h-3.5 w-3.5 text-accent" />}
                  {a.type === "action" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] leading-snug">
                    <span className="font-medium">{a.actor_name ?? "System"}</span>{" "}
                    <span className="text-muted-foreground">{a.message}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{timeAgo(a.created_at)}</div>
                </div>
              </div>
            ))}
            {activityFeed.length === 0 && (
              <div className="text-[12px] text-muted-foreground">No activity yet.</div>
            )}
          </div>
        </Panel>
      </div>

      {/* Coaching + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Captain's Table" subtitle={latestLog ? `Latest coaching log · Week ${latestLog.week_number ?? "—"}` : "No sessions yet"} className="lg:col-span-2">
          {latestLog ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-mono text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/30 uppercase tracking-wider">{latestLog.mood ?? "—"}</span>
                <span>{formatShortDate(latestLog.session_date)}</span>
                <span>·</span>
                <span>Week {latestLog.week_number ?? "—"}</span>
              </div>
              <div className="text-[13px] sm:text-[14px] leading-relaxed">{latestLog.summary ?? "No summary."}</div>
              {(latestLog.decisions?.length ?? 0) > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">Decisions locked</div>
                  <div className="space-y-1.5">
                    {latestLog.decisions!.map((d, i) => (
                      <div key={d.id ?? i} className="flex items-start gap-2 text-[12px]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                        <span>{d.decision}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[13px] text-muted-foreground">No coaching sessions recorded yet.</div>
          )}
        </Panel>

        <Panel title="Open Actions" subtitle={`${openActions} pending`}>
          <div className="space-y-1.5">
            {actionItemsList.map((a) => (
              <div key={a.id} className={cn(
                "flex items-start gap-2 p-2 rounded-md hover:bg-secondary/40",
                a.status === "done" && "opacity-50",
              )}>
                <input
                  type="checkbox"
                  checked={a.status === "done"}
                  onChange={() => handleToggleAction(a.id, a.status)}
                  className="mt-0.5 accent-primary cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-[12px]", a.status === "done" && "line-through")}>{a.title}</div>
                  <div className="flex items-center gap-2 text-[10px] font-mono mt-0.5">
                    <span className="text-muted-foreground">{a.owner_name ?? "—"}</span>
                    <span className={cn(
                      a.status === "overdue" ? "text-destructive" : "text-muted-foreground",
                    )}>· {a.due_date ? formatShortDate(a.due_date) : "—"}</span>
                  </div>
                </div>
              </div>
            ))}
            {actionItemsList.length === 0 && (
              <div className="text-[12px] text-muted-foreground">No action items yet.</div>
            )}
          </div>

          {/* Quick-add action */}
          {showAddAction ? (
            <form onSubmit={handleAddAction} className="mt-3 pt-3 border-t border-border space-y-2">
              <input
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="What needs to happen?"
                autoFocus
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[12px] outline-none focus:border-primary/40"
              />
              <input
                value={newActionOwner}
                onChange={(e) => setNewActionOwner(e.target.value)}
                placeholder="Owner (optional)"
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[12px] outline-none focus:border-primary/40"
              />
              <div className="flex items-center gap-2">
                <button type="submit" disabled={createAction.isPending || !newActionTitle.trim()} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[11px] font-medium disabled:opacity-50">
                  {createAction.isPending ? "Adding..." : "Add"}
                </button>
                <button type="button" onClick={() => { setShowAddAction(false); setNewActionTitle(""); setNewActionOwner(""); }} className="px-3 py-1.5 rounded-md bg-secondary/60 border border-border text-[11px]">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAddAction(true)} className="mt-3 pt-3 border-t border-border w-full flex items-center gap-1.5 text-[11px] text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add action item
            </button>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({
  label, value, suffix, trend, invertTrend, accent, sparkline,
}: { label: string; value: number; suffix?: string; trend: number; invertTrend?: boolean; accent: string; sparkline: number[] }) {
  const positive = invertTrend ? trend < 0 : trend > 0;
  const TrendIcon = trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const max = Math.max(...sparkline);
  const min = Math.min(...sparkline);
  const range = max - min || 1;
  const points = sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * 100},${30 - ((v - min) / range) * 28}`).join(" ");

  return (
    <div className="relative bg-card border border-border rounded-xl p-3 md:p-4 overflow-hidden group hover:border-primary/40 transition-colors">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${accent.replace(")", " / 0.15)")}, transparent 70%)` }} />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2 truncate">{label}</div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[24px] md:text-[32px] font-semibold tabular-nums leading-none tracking-tight">{value}</span>
            {suffix && <span className="text-[12px] md:text-[14px] text-muted-foreground">{suffix}</span>}
          </div>
          <svg viewBox="0 0 100 30" className="w-14 h-7 md:w-20 md:h-8 shrink-0" preserveAspectRatio="none">
            <polyline fill="none" stroke={accent} strokeWidth="1.5" points={points} />
          </svg>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] md:text-[11px] mt-2 font-mono",
          positive ? "text-success" : "text-destructive",
        )}>
          <TrendIcon className="h-3 w-3" />
          <span>{trend > 0 ? "+" : ""}{trend}{label.includes("%") || suffix === "%" ? "pp" : ""}</span>
          <span className="text-muted-foreground hidden sm:inline">vs last week</span>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title, subtitle, children, className, accent,
}: { title?: string; subtitle?: string; children: React.ReactNode; className?: string; accent?: boolean }) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-4",
      accent && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent",
      className,
    )}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[13px] font-semibold">{title}</div>
          {subtitle && <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mt-0.5">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    not_started: { label: "Not started", cls: "bg-secondary text-muted-foreground border-border" },
    submitted: { label: "Submitted", cls: "bg-info/15 text-info border-info/30" },
    under_review: { label: "In review", cls: "bg-warning/15 text-warning border-warning/30" },
    refined: { label: "Refined", cls: "bg-accent/15 text-accent border-accent/30" },
    approved: { label: "Approved", cls: "bg-success/15 text-success border-success/30" },
  };
  const s = map[status] || map.not_started;
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border font-mono uppercase tracking-wider", s.cls)}>
      {s.label}
    </span>
  );
}
