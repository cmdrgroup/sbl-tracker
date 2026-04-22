import { TrendingUp, TrendingDown, Minus, ArrowUpRight, Sparkles, AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import {
  departments, sops, coachingLogs, activity, actionItems,
  playbookTrend, sopVelocity, type Client,
} from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Props = { client: Client };

export function Dashboard({ client }: Props) {
  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            <span>Operational Picture</span>
            <span>·</span>
            <span>Week 14</span>
          </div>
          <h1 className="font-display text-[34px] font-semibold tracking-tight leading-tight">
            Good morning, Curtis. <span className="text-muted-foreground italic">Here's where {client.name} stands.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-md bg-secondary/60 hover:bg-secondary text-[12px] font-medium border border-border">
            This week
          </button>
          <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[12px] font-medium flex items-center gap-1.5 shadow-[0_0_20px_oklch(0.62_0.22_280_/_0.3)]">
            <Sparkles className="h-3.5 w-3.5" /> Ask AI for brief
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Operational Health" value={client.health} suffix="/100" trend={+4} accent="oklch(0.62 0.22 280)" sparkline={[60, 65, 68, 72, 75, 78, 81, 84, 87]} />
        <Kpi label="Playbook Progress" value={client.playbookProgress} suffix="%" trend={+8} accent="oklch(0.72 0.18 195)" sparkline={playbookTrend} />
        <Kpi label="Open SOPs" value={client.openSops} trend={-2} invertTrend accent="oklch(0.78 0.16 75)" sparkline={[12, 11, 10, 9, 8, 7, 6, 5, 4]} />
        <Kpi label="SOP Velocity" value={13} suffix="/wk" trend={+18} accent="oklch(0.72 0.18 155)" sparkline={sopVelocity} />
      </div>

      {/* Two col */}
      <div className="grid grid-cols-3 gap-3">
        {/* Department progress — wide */}
        <Panel title="Departments" subtitle="SOP completion · 7 areas" className="col-span-2">
          <div className="space-y-2.5">
            {departments.map((d) => {
              const pct = Math.round((d.approved / d.total) * 100);
              return (
                <div key={d.name} className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
                  <div>
                    <div className="text-[13px] font-medium">{d.name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.owner}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden flex">
                      <div className="bg-success h-full" style={{ width: `${pct}%` }} />
                      <div className="bg-warning/70 h-full" style={{ width: `${(d.inReview / d.total) * 100}%` }} />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      <span><span className="text-success">●</span> {d.approved} approved</span>
                      <span><span className="text-warning">●</span> {d.inReview} review</span>
                      <span><span className="text-muted-foreground">●</span> {d.notStarted} pending</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold tabular-nums">{pct}<span className="text-[11px] text-muted-foreground">%</span></div>
                  </div>
                </div>
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
                Cashflow is tracking <span className="text-warning font-medium">18% below</span> the trailing 4-week average. Construction is your fastest-moving department but Compliance has 3 SOPs stuck in review for 8+ days.
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1.5">Suggested actions</div>
              {[
                "Run cashflow tightening playbook",
                "Nudge Compliance reviewers",
                "Surface in next Captain's Table",
              ].map((s) => (
                <button key={s} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/40 text-[12px] group">
                  <ArrowUpRight className="h-3 w-3 text-accent" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Three col bottom */}
      <div className="grid grid-cols-3 gap-3">
        {/* SOP Pipeline */}
        <Panel title="SOP Pipeline" subtitle="Recent submissions" className="col-span-2">
          <div className="space-y-1">
            <div className="grid grid-cols-[80px_1fr_120px_100px_60px] gap-3 px-2 py-1.5 text-[10px] uppercase tracking-wider font-mono text-muted-foreground border-b border-border">
              <div>Code</div>
              <div>Title</div>
              <div>Owner</div>
              <div>Status</div>
              <div className="text-right">Updated</div>
            </div>
            {sops.slice(0, 8).map((s) => (
              <div key={s.id} className="grid grid-cols-[80px_1fr_120px_100px_60px] gap-3 px-2 py-2 text-[12px] hover:bg-secondary/30 rounded-md items-center">
                <div className="font-mono text-[11px] text-muted-foreground">{s.code}</div>
                <div className="truncate">{s.title}</div>
                <div className="text-muted-foreground truncate text-[11px]">{s.owner}</div>
                <div><StatusPill status={s.status} /></div>
                <div className="text-right text-[10px] text-muted-foreground font-mono">{s.updatedAt}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Activity feed */}
        <Panel title="Live Feed" subtitle="Across all systems">
          <div className="space-y-3">
            {activity.slice(0, 6).map((a) => (
              <div key={a.id} className="flex gap-2.5">
                <div className="mt-0.5">
                  {a.type === "sop" && <FileText className="h-3.5 w-3.5 text-info" />}
                  {a.type === "alert" && <AlertCircle className="h-3.5 w-3.5 text-warning" />}
                  {a.type === "decision" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                  {a.type === "log" && <Clock className="h-3.5 w-3.5 text-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] leading-snug">
                    <span className="font-medium">{a.actor}</span>{" "}
                    <span className="text-muted-foreground">{a.text}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{a.time} ago</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Coaching + actions */}
      <div className="grid grid-cols-3 gap-3">
        <Panel title="Captain's Table" subtitle="Latest coaching log · Week 14" className="col-span-2">
          {coachingLogs.slice(0, 1).map((log) => (
            <div key={log.id} className="space-y-3">
              <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/30 uppercase tracking-wider">{log.mood}</span>
                <span>{log.date}</span>
                <span>·</span>
                <span>Week {log.week}</span>
              </div>
              <div className="text-[14px] leading-relaxed">{log.summary}</div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">Decisions locked</div>
                <div className="space-y-1.5">
                  {log.decisions.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="Open Actions" subtitle={`${actionItems.filter(a => a.status !== "done").length} pending`}>
          <div className="space-y-1.5">
            {actionItems.map((a) => (
              <div key={a.id} className={cn(
                "flex items-start gap-2 p-2 rounded-md hover:bg-secondary/40",
                a.status === "done" && "opacity-50",
              )}>
                <input type="checkbox" defaultChecked={a.status === "done"} className="mt-0.5 accent-primary" />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-[12px]", a.status === "done" && "line-through")}>{a.text}</div>
                  <div className="flex items-center gap-2 text-[10px] font-mono mt-0.5">
                    <span className="text-muted-foreground">{a.owner}</span>
                    <span className={cn(
                      a.status === "overdue" ? "text-destructive" : "text-muted-foreground",
                    )}>· {a.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    <div className="relative bg-card border border-border rounded-xl p-4 overflow-hidden group hover:border-primary/40 transition-colors">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${accent.replace(")", " / 0.15)")}, transparent 70%)` }} />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">{label}</div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[32px] font-semibold tabular-nums leading-none tracking-tight">{value}</span>
            {suffix && <span className="text-[14px] text-muted-foreground">{suffix}</span>}
          </div>
          <svg viewBox="0 0 100 30" className="w-20 h-8 shrink-0" preserveAspectRatio="none">
            <polyline fill="none" stroke={accent} strokeWidth="1.5" points={points} />
          </svg>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[11px] mt-2 font-mono",
          positive ? "text-success" : "text-destructive",
        )}>
          <TrendIcon className="h-3 w-3" />
          <span>{trend > 0 ? "+" : ""}{trend}{label.includes("%") || suffix === "%" ? "pp" : ""}</span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title, subtitle, children, className, accent,
}: { title: string; subtitle?: string; children: React.ReactNode; className?: string; accent?: boolean }) {
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
