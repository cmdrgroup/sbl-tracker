import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Plus, Calendar, Loader2, X, PlusCircle, Trash2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/page-header";
import {
  useCoachingLogs,
  useCreateCoachingLog,
  useActionItems,
  useCreateActionItem,
  useUpdateActionItem,
  useStaff,
} from "@/lib/hooks";
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

const inputCls =
  "w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40";
const labelCls =
  "text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block";

function CoachingPage() {
  const { client } = useRequiredClient();
  const { data: logs = [], isLoading } = useCoachingLogs(client.id);
  const { data: actionItems = [] } = useActionItems(client.id);
  const { data: staff = [] } = useStaff();
  const staffNames = staff.map((s) => s.name);
  const createLog = useCreateCoachingLog();

  const totalDecisions = logs.reduce((s, l) => s + (l.decisions?.length ?? 0), 0);
  const latestWeek = logs.length > 0 ? (logs[0].week_number ?? 0) : 0;

  // Owner filter for action items
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const QUICK_OWNERS = ["Brett Poole", "Curtis Tofa", "Ryan Christensen"];

  // Form state
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);
  const [fDate, setFDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [fWeek, setFWeek] = useState(() => String(latestWeek + 1));
  const [fMood, setFMood] = useState<string>("steady");
  const [fBrett, setFBrett] = useState("");
  const [fCurtis, setFCurtis] = useState("");
  const [fSummary, setFSummary] = useState("");
  const [fDecisions, setFDecisions] = useState<string[]>([""]);

  const resetForm = () => {
    setFDate(new Date().toISOString().split("T")[0]);
    setFWeek(String(latestWeek + 1));
    setFMood("steady");
    setFBrett("");
    setFCurtis("");
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
      brett_sitrep: fBrett || null,
      curtis_sitrep: fCurtis || null,
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
        <div ref={formRef}>
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
                <label className={labelCls}>Date *</label>
                <input required type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Week #</label>
                <input type="number" value={fWeek} onChange={(e) => setFWeek(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mood</label>
                <select value={fMood} onChange={(e) => setFMood(e.target.value)} className={inputCls}>
                  <option value="strong">Strong</option>
                  <option value="steady">Steady</option>
                  <option value="flat">Flat</option>
                  <option value="under_pressure">Under Pressure</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Brett's Sit-Rep</label>
                <textarea
                  value={fBrett}
                  onChange={(e) => setFBrett(e.target.value)}
                  rows={4}
                  placeholder="What's on Brett's mind — business, personal, strategic..."
                  className={cn(inputCls, "resize-y")}
                />
              </div>
              <div>
                <label className={labelCls}>Curtis's Sit-Rep</label>
                <textarea
                  value={fCurtis}
                  onChange={(e) => setFCurtis(e.target.value)}
                  rows={4}
                  placeholder="Playbook progress, blockers, what moved this week..."
                  className={cn(inputCls, "resize-y")}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Discussion Notes</label>
              <textarea
                value={fSummary}
                onChange={(e) => setFSummary(e.target.value)}
                rows={3}
                placeholder="Other discussion points, context, follow-ups..."
                className={cn(inputCls, "resize-y")}
              />
            </div>

            <div>
              <label className={labelCls}>Key Decisions Made</label>
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
                      className={cn(inputCls, "flex-1")}
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
                {createLog.isPending ? "Saving..." : "Save Session"}
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
        </div>
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

      {/* Owner filter for action items */}
      <Panel>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mr-1">
            Filter actions by owner
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
          {ownerFilter && (
            <span className="text-[11px] text-muted-foreground ml-1">
              Showing items for <span className="text-foreground font-medium">{ownerFilter}</span>
            </span>
          )}
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
          const moodKey = log.mood ?? "steady";
          const moodInfo = MOOD[moodKey] ?? MOOD.steady;
          const sessionActions = actionItems.filter(
            (a) =>
              a.coaching_log_id === log.id &&
              (!ownerFilter || a.owner_name === ownerFilter),
          );
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
                  {log.brett_sitrep && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1.5">Brett's Sit-Rep</div>
                      <p className="text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap">{log.brett_sitrep}</p>
                    </div>
                  )}
                  {log.curtis_sitrep && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1.5">Curtis's Sit-Rep</div>
                      <p className="text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap">{log.curtis_sitrep}</p>
                    </div>
                  )}
                  {log.summary && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1.5">Discussion Notes</div>
                      <p className="text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap">{log.summary}</p>
                    </div>
                  )}
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

                  {/* Action items for this session */}
                  <SessionActions logId={log.id} clientId={client.id} actions={sessionActions} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function SessionActions({
  logId,
  clientId,
  actions,
}: {
  logId: string;
  clientId: string;
  actions: ReturnType<typeof useActionItems>["data"] extends (infer T)[] | undefined ? T[] : never;
}) {
  const createAction = useCreateActionItem();
  const updateAction = useUpdateActionItem();
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState(STAFF_MEMBERS[0]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createAction.mutateAsync({
      client_id: clientId,
      coaching_log_id: logId,
      title: title.trim(),
      owner_name: owner,
      due_date: null,
      status: "open",
    });
    setTitle("");
  };

  const toggle = (id: string, currentStatus: string) => {
    updateAction.mutate({
      id,
      status: currentStatus === "done" ? "open" : "done",
      completed_at: currentStatus === "done" ? null : new Date().toISOString(),
    });
  };

  return (
    <div className="border-t border-border pt-3">
      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-2">
        Action Items {actions.length > 0 && <span className="text-foreground">· {actions.length}</span>}
      </div>

      {actions.length > 0 && (
        <div className="space-y-1 mb-3">
          {actions.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={a.status === "done"}
                onChange={() => toggle(a.id, a.status)}
                className="accent-primary cursor-pointer"
              />
              <span className={cn("flex-1", a.status === "done" && "line-through text-muted-foreground")}>
                {a.title}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{a.owner_name ?? "—"}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add action item..."
          className={cn(inputCls, "flex-1 text-[12px] py-1.5")}
        />
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className={cn(inputCls, "sm:w-44 text-[12px] py-1.5")}
        >
          {STAFF_MEMBERS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!title.trim() || createAction.isPending}
          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[11px] font-medium disabled:opacity-50"
        >
          {createAction.isPending ? "..." : "Add"}
        </button>
      </form>
    </div>
  );
}
