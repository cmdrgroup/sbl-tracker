import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, TrendingUp, AlertTriangle, Target, ArrowUpRight } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useActiveClient } from "@/lib/client-context";

export const Route = createFileRoute("/_app/insights")({
  component: InsightsPage,
  head: () => ({ meta: [{ title: "AI Insights — Command Overlay" }] }),
});

const INSIGHTS = [
  {
    icon: AlertTriangle,
    severity: "warning",
    title: "Cashflow drift detected",
    body: "Operating cashflow is tracking 18% below your trailing 4-week average. Three invoices over $25k are aged 45+ days.",
    actions: ["Run cashflow tightening playbook", "Surface in next Captain's Table", "Draft chase emails"],
  },
  {
    icon: Target,
    severity: "info",
    title: "Compliance bottleneck",
    body: "3 SOPs in Compliance have been stuck in 'Under Review' for 8+ days. Liam appears to be the constraint — review queue depth is 4× normal.",
    actions: ["Reassign 2 reviews to backup", "Block 90 min on Liam's calendar"],
  },
  {
    icon: TrendingUp,
    severity: "success",
    title: "Construction velocity surge",
    body: "Construction filmed 5 SOPs this week — 2.5× the rolling average. Rachel's onboarding of 2 new field leads is paying off.",
    actions: ["Capture pattern in coaching log", "Replicate model with Operations"],
  },
  {
    icon: Sparkles,
    severity: "primary",
    title: "Pattern across portfolio",
    body: "Across all 5 clients, weeks where the Captain's Table covers 'cashflow' explicitly correlate with 23% higher SOP velocity the following week.",
    actions: ["Add cashflow as a standing agenda item"],
  },
];

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

function InsightsPage() {
  const { client } = useActiveClient();

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px]">
      <PageHeader
        eyebrow={`${client.name} · AI`}
        title="Insights from the Overlay"
        subtitle="Continuous analysis across SOPs, coaching logs, and operational signals — surfaced before it becomes a problem."
        actions={
          <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Generate weekly brief</span><span className="sm:hidden">Brief</span>
          </button>
        }
      />

      <Panel accent>
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Executive brief · Generated 12 min ago</div>
            <p className="font-display text-[16px] md:text-[20px] leading-snug mt-1.5 italic text-foreground">
              "{client.name} is steady but trending tight. Cashflow needs intervention this week; Compliance needs a process unblock; Construction is the model to study."
            </p>
            <div className="text-[11px] font-mono text-muted-foreground mt-2">— Command Overlay AI · 4 signals analysed</div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {INSIGHTS.map((ins) => {
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
