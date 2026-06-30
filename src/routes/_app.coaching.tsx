import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Calendar, Loader2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import { useCoachingLogs, useActionItems, useStaff } from "@/lib/hooks";
import { useRequiredClient } from "@/lib/client-context";
import { cn } from "@/lib/utils";
import type { CoachingLog, ActionItem } from "@/lib/types";

// NOTE: Coaching is owned by the TOC (system of record). Command Overlay is the
// client-facing DELIVERY tool, so it does NOT capture coaching here — this page is a
// read-only view of agreed decisions + delivery commitments. A curated, client-safe
// slice will be fed from the TOC (see docs/TOC-INTEGRATION.md, Stage C). No mood,
// sitreps, or private coaching notes are surfaced.

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

export const Route = createFileRoute("/_app/coaching")({
  component: DecisionsPage,
  head: () => ({ meta: [{ title: "Decisions & Commitments — Command Overlay" }] }),
});

const ACTION_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-secondary text-muted-foreground border-border" },
  done: { label: "Done", cls: "bg-success/15 text-success border-success/30" },
  overdue: { label: "Overdue", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

const inputCls =
  "w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40";

function DecisionsPage() {
  const { client } = useRequiredClient();
  const { data: logs = [], isLoading } = useCoachingLogs(client.id);
  const { data: actionItems = [] } = useActionItems(client.id);
  const { data: staff = [] } = useStaff();
  const staffNames = staff.map((s) => s.name);

  const totalDecisions = logs.reduce((s, l) => s + (l.decisions?.length ?? 0), 0);
  const openCommitments = actionItems.filter((a) => a.status !== "done").length;
  const doneCommitments = actionItems.filter((a) => a.status === "done").length;

  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const QUICK_OWNERS = ["Brett Poole", "Curtis Tofa", "Ryan Christensen"];

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
        title="Decisions & Commitments"
        subtitle="Decisions locked in your sessions and the delivery commitments that follow. Coaching is run from the TOC; this is your read-only record."
      />

      <div className="grid grid-cols-3 gap-3">
        <Panel title="Decisions Locked" subtitle="All time">
          <div className="font-display text-[32px] md:text-[44px] leading-none font-semibold">{totalDecisions}</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">Across {logs.length} sessions</div>
        </Panel>
        <Panel title="Open Commitments" subtitle="Delivery actions">
          <div className="font-display text-[32px] md:text-[44px] leading-none font-semibold">{openCommitments}</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">In progress</div>
        </Panel>
        <Panel title="Completed" subtitle="Delivery actions" accent>
          <div className="font-display text-[32px] md:text-[44px] leading-none font-semibold text-success">{doneCommitments}</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">Closed out</div>
        </Panel>
      </div>

      {/* Owner filter for commitments */}
      <Panel>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mr-1">
            Filter commitments by owner
          </span>
          <button
            onClick={() => setOwnerFilter(null)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium border",
              ownerFilter === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {QUICK_OWNERS.map((name) => (
            <button
              key={name}
              onClick={() => setOwnerFilter(ownerFilter === name ? null : name)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium border",
                ownerFilter === name
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {name.split(" ")[0]}
            </button>
          ))}
          <select
            value={ownerFilter && !QUICK_OWNERS.includes(ownerFilter) ? ownerFilter : ""}
            onChange={(e) => setOwnerFilter(e.target.value || null)}
            className={cn(inputCls, "w-auto text-[11px] py-1 ml-1")}
          >
            <option value="">Other staff…</option>
            {staffNames.filter((s) => !QUICK_OWNERS.includes(s)).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </Panel>

      <div className="space-y-3">
        {logs
          .filter((log) => {
            if (!ownerFilter) return true;
            return actionItems.some(
              (a) => a.coaching_log_id === log.id && a.owner_name === ownerFilter,
            );
          })
          .map((log) => {
            const sessionActions = actionItems.filter(
              (a) =>
                a.coaching_log_id === log.id &&
                (!ownerFilter || a.owner_name === ownerFilter),
            );
            return (
              <SessionCard
                key={log.id}
                log={log}
                clientName={client.name}
                actions={sessionActions}
              />
            );
          })}
        {logs.length === 0 && (
          <Panel>
            <div className="text-[13px] text-muted-foreground">
              No decisions recorded yet. Decisions agreed in your Captain's Table sessions will appear here.
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  log,
  clientName,
  actions,
}: {
  log: CoachingLog;
  clientName: string;
  actions: ActionItem[];
}) {
  return (
    <Panel>
      <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 md:gap-6">
        <div className="md:border-r md:border-border md:pr-6 pb-3 md:pb-0 border-b md:border-b-0 border-border">
          <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Week {log.week_number ?? "—"}</div>
          <div className="font-display text-[24px] md:text-[28px] font-semibold mt-1">{formatDate(log.session_date)}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3">
            <Calendar className="h-3 w-3" />
            <span className="truncate">{clientName}</span>
          </div>
        </div>
        <div className="space-y-4">
          {(log.decisions?.length ?? 0) > 0 ? (
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
          ) : (
            <div className="text-[12px] text-muted-foreground">No decisions locked this session.</div>
          )}

          {actions.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">
                Commitments · {actions.length}
              </div>
              <div className="space-y-1.5">
                {actions.map((a) => {
                  const s = ACTION_STATUS[a.status] ?? ACTION_STATUS.open;
                  return (
                    <div key={a.id} className="flex items-center gap-2 text-[12px]">
                      <span className={cn("flex-1", a.status === "done" && "line-through text-muted-foreground")}>
                        {a.title}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{a.owner_name ?? "—"}</span>
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border font-mono uppercase tracking-wider shrink-0", s.cls)}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
