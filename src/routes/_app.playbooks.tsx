import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ArrowUpRight, Sparkles } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { departments, playbookTrend } from "@/lib/demo-data";
import { useRequiredClient } from "@/lib/client-context";

export const Route = createFileRoute("/_app/playbooks")({
  component: PlaybooksPage,
  head: () => ({ meta: [{ title: "Playbooks — Command Overlay" }] }),
});

function PlaybooksPage() {
  const { client } = useRequiredClient();
  const total = departments.reduce((s, d) => s + d.total, 0);
  const approved = departments.reduce((s, d) => s + d.approved, 0);
  const pct = Math.round((approved / total) * 100);

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
        <Panel title="Overall Completion" subtitle="Across 7 departments">
          <div className="flex items-end gap-2">
            <span className="font-display text-[44px] md:text-[56px] leading-none font-semibold">{pct}</span>
            <span className="text-[18px] text-muted-foreground mb-2">%</span>
          </div>
          <div className="h-1.5 mt-3 rounded-full bg-secondary/60 overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-2">{approved} of {total} SOPs approved</div>
        </Panel>

        <Panel title="14-Week Trend" subtitle="Playbook completion %">
          <Sparkline data={playbookTrend} />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-2">
            <span>Wk 1</span><span>Wk 7</span><span>Wk 14</span>
          </div>
        </Panel>

        <Panel title="This Week" subtitle="Velocity indicators" accent>
          <div className="space-y-2 text-[13px]">
            <Stat label="New SOPs filmed" value="13" />
            <Stat label="Approved" value="9" />
            <Stat label="Returned for refinement" value="2" />
            <Stat label="Days saved (est.)" value="41" />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {departments.map((d) => {
          const pct = Math.round((d.approved / d.total) * 100);
          return (
            <Panel key={d.name}>
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-display text-[16px] md:text-[18px] font-semibold truncate">{d.name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">Owner · {d.owner}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-[24px] md:text-[28px] leading-none font-semibold">{pct}<span className="text-[12px] text-muted-foreground">%</span></div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden flex">
                <div className="bg-success h-full" style={{ width: `${(d.approved / d.total) * 100}%` }} />
                <div className="bg-warning/70 h-full" style={{ width: `${(d.inReview / d.total) * 100}%` }} />
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

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${40 - ((v - min) / range) * 36}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.105 80)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="oklch(0.72 0.105 80)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#g1)" points={`0,40 ${pts} 100,40`} />
      <polyline fill="none" stroke="oklch(0.72 0.105 80)" strokeWidth="1.5" points={pts} />
    </svg>
  );
}
