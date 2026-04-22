import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, TrendingUp, AlertTriangle, Target, ArrowUpRight, CheckCircle2, Loader2, X } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useRequiredClient } from "@/lib/client-context";
import { usePlaybooks, useWorkstreams, useCoachingLogs, useActionItems, useGenerateBrief, useAiBriefs } from "@/lib/hooks";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_app/insights")({
  component: InsightsPage,
  head: () => ({ meta: [{ title: "AI Insights — Command Overlay" }] }),
});

const SEV: Record<string, string> = {
  warning: "border-warning/40 from-warning/8",
  info: "border-info/40 from-info/8",
  success: "border-success/40 from-success/8",
  primary: "border-primary/40 from-primary/8",
};

const SEV_ICON: Record<string, string> = {
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  primary: "bg-primary/20 text-primary",
};

type Insight = {
  icon: typeof AlertTriangle;
  severity: string;
  title: string;
  body: string;
  actions: string[];
};

function InsightsPage() {
  const { client } = useRequiredClient();
  const { data: playbooks = [], isLoading: loadPb } = usePlaybooks(client.id);
  const { data: workstreams = [] } = useWorkstreams(client.id);
  const { data: logs = [] } = useCoachingLogs(client.id);
  const { data: actionItems = [] } = useActionItems(client.id);
  const { data: pastBriefs = [] } = useAiBriefs(client.id);
  const generateBrief = useGenerateBrief();
  const [liveBrief, setLiveBrief] = useState<string | null>(null);
  const [showLiveBrief, setShowLiveBrief] = useState(false);

  const handleGenerate = async () => {
    setShowLiveBrief(true);
    setLiveBrief(null);
    try {
      const result = await generateBrief.mutateAsync({ client_id: client.id, brief_type: "weekly" });
      setLiveBrief(result.brief);
    } catch {
      // error handled by mutation state
    }
  };

  const insights = useMemo(() => {
    const result: Insight[] = [];

    // Find departments with playbooks stuck in review
    const stuckWs = workstreams.map((ws) => {
      const stuck = playbooks.filter((p) => p.workstream_id === ws.id && (p.status === "under_review" || p.status === "refined"));
      return { name: ws.name, owner: ws.owner_name, count: stuck.length };
    }).filter((w) => w.count >= 2).sort((a, b) => b.count - a.count);

    if (stuckWs.length > 0) {
      const top = stuckWs[0];
      result.push({
        icon: AlertTriangle,
        severity: "warning",
        title: `${top.name} review bottleneck`,
        body: `${top.count} playbooks in ${top.name} are stuck in review. ${top.owner ? `${top.owner} may need support to clear the backlog.` : "Consider assigning reviewers."}`,
        actions: ["Reassign reviews to backup", "Surface in next Captain's Table"],
      });
    }

    // Find best-performing department
    const wsPct = workstreams.map((ws) => {
      const items = playbooks.filter((p) => p.workstream_id === ws.id);
      const approved = items.filter((p) => p.status === "approved").length;
      return { name: ws.name, pct: items.length > 0 ? approved / items.length : 0, total: items.length, approved };
    }).filter((w) => w.total >= 3).sort((a, b) => b.pct - a.pct);

    if (wsPct.length > 0) {
      const best = wsPct[0];
      result.push({
        icon: TrendingUp,
        severity: "success",
        title: `${best.name} leading the playbook`,
        body: `${best.name} has ${best.approved} of ${best.total} playbooks approved (${Math.round(best.pct * 100)}%). This is the department to study and replicate.`,
        actions: ["Capture pattern in coaching log", "Replicate model with other departments"],
      });
    }

    // Overdue action items
    const overdueItems = actionItems.filter((a) => a.status === "overdue");
    if (overdueItems.length > 0) {
      result.push({
        icon: Target,
        severity: "info",
        title: `${overdueItems.length} overdue action item${overdueItems.length > 1 ? "s" : ""}`,
        body: `${overdueItems.map((a) => a.title).slice(0, 2).join(", ")}${overdueItems.length > 2 ? ` and ${overdueItems.length - 2} more` : ""}. These need attention before the next Captain's Table.`,
        actions: ["Review and close overdue items", "Reassign if owner is blocked"],
      });
    }

    // Not-started playbooks signal
    const notStarted = playbooks.filter((p) => p.status === "not_started");
    if (notStarted.length >= 5) {
      result.push({
        icon: Target,
        severity: "info",
        title: `${notStarted.length} playbooks not yet started`,
        body: `There are ${notStarted.length} playbooks still in "Not Started" — consider prioritising the next batch for filming and documentation.`,
        actions: ["Prioritise next filming batch", "Schedule recording sessions"],
      });
    }

    // Overall progress insight
    const totalPb = playbooks.length;
    const approvedPb = playbooks.filter((p) => p.status === "approved").length;
    const pct = totalPb > 0 ? Math.round((approvedPb / totalPb) * 100) : 0;
    result.push({
      icon: Sparkles,
      severity: "primary",
      title: "Overall playbook progress",
      body: `${approvedPb} of ${totalPb} playbooks approved (${pct}%) across ${workstreams.length} departments. ${logs.length} coaching sessions logged with ${logs.reduce((s, l) => s + (l.decisions?.length ?? 0), 0)} decisions locked.`,
      actions: ["Generate weekly brief for Brett"],
    });

    return result;
  }, [playbooks, workstreams, logs, actionItems]);

  const totalPb = playbooks.length;
  const approvedPb = playbooks.filter((p) => p.status === "approved").length;
  const pct = totalPb > 0 ? Math.round((approvedPb / totalPb) * 100) : 0;

  if (loadPb) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px]">
      <PageHeader
        eyebrow={`${client.name} · AI`}
        title="Insights from the Overlay"
        subtitle="Continuous analysis across SOPs, coaching logs, and operational signals — surfaced before it becomes a problem."
        actions={
          <button
            onClick={handleGenerate}
            disabled={generateBrief.isPending}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5 disabled:opacity-60"
          >
            {generateBrief.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{generateBrief.isPending ? "Generating..." : "Generate weekly brief"}</span>
            <span className="sm:hidden">{generateBrief.isPending ? "..." : "Brief"}</span>
          </button>
        }
      />

      {/* Live AI brief panel */}
      {showLiveBrief && (
        <Panel accent>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-background" />
              </div>
              <div>
                <div className="text-[13px] font-semibold">AI Executive Brief</div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  {generateBrief.isPending ? "Generating..." : "Generated just now"}
                </div>
              </div>
            </div>
            <button onClick={() => setShowLiveBrief(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {generateBrief.isPending ? (
            <div className="flex items-center gap-2 py-6">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[13px] text-muted-foreground">Analysing playbooks, coaching logs, and action items...</span>
            </div>
          ) : generateBrief.isError ? (
            <div className="text-[13px] text-destructive">
              {(generateBrief.error as Error).message}
              <div className="text-[11px] text-muted-foreground mt-1">
                Make sure the ANTHROPIC_API_KEY is set in your Supabase Edge Function secrets and the generate-brief function is deployed.
              </div>
            </div>
          ) : liveBrief ? (
            <div className="text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap">{liveBrief}</div>
          ) : null}
        </Panel>
      )}

      {/* Static data-driven summary */}
      {!showLiveBrief && (
        <Panel accent>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Executive brief · Data-driven</div>
              <p className="font-display text-[16px] md:text-[20px] leading-snug mt-1.5 italic text-foreground">
                "{client.name} is at {pct}% playbook completion across {workstreams.length} departments. {approvedPb} approved, {totalPb - approvedPb} remaining. {actionItems.filter(a => a.status === "overdue").length > 0 ? `${actionItems.filter(a => a.status === "overdue").length} overdue actions need attention.` : "All action items on track."}"
              </p>
              <div className="text-[11px] font-mono text-muted-foreground mt-2">— Command Overlay · {insights.length} signals analysed</div>
            </div>
          </div>
        </Panel>
      )}

      {/* Past briefs */}
      {pastBriefs.length > 0 && !showLiveBrief && (
        <Panel title="Previous Briefs" subtitle={`${pastBriefs.length} generated`}>
          <div className="space-y-3">
            {pastBriefs.slice(0, 3).map((b) => (
              <div key={b.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mb-1">
                  <span className="uppercase tracking-wider">{b.brief_type}</span>
                  <span>·</span>
                  <span>{new Date(b.created_at).toLocaleDateString("en-AU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>·</span>
                  <span>{b.signals_used} signals</span>
                </div>
                <div className="text-[12px] leading-relaxed line-clamp-3">{b.content}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins) => {
          const Icon = ins.icon;
          return (
            <div
              key={ins.title}
              className={`bg-gradient-to-br to-transparent bg-card border rounded-xl p-4 md:p-5 ${SEV[ins.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${SEV_ICON[ins.severity]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[16px] md:text-[18px] font-semibold leading-tight">{ins.title}</div>
                  <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{ins.body}</p>
                </div>
              </div>
              <div className="border-t border-border mt-4 pt-3 space-y-1">
                <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">Suggested actions</div>
                {ins.actions.map((a) => (
                  <button key={a} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/40 text-[12px] group">
                    <ArrowUpRight className="h-3 w-3 text-primary shrink-0" />
                    <span>{a}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
