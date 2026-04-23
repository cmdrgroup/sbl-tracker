import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Filter, Plus, Loader2, X } from "lucide-react";
import { z } from "zod";
import { PageHeader, Panel } from "@/components/page-header";
import { usePlaybooks, useWorkstreams, useCreatePlaybook, useUpdatePlaybook } from "@/lib/hooks";
import { useRequiredClient } from "@/lib/client-context";
import { cn } from "@/lib/utils";
import type { Playbook } from "@/lib/types";

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

export const Route = createFileRoute("/_app/sops")({
  component: SopsPage,
  validateSearch: z.object({ dept: z.string().optional() }),
  head: () => ({ meta: [{ title: "SOPs — Command Overlay" }] }),
});

const COLUMNS = [
  { key: "not_started", label: "Not Started" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "In Review" },
  { key: "refined", label: "Refined" },
  { key: "approved", label: "Approved" },
] as const;

const STATUS_CLASS: Record<string, string> = {
  not_started: "border-l-muted-foreground",
  submitted: "border-l-info",
  under_review: "border-l-warning",
  refined: "border-l-accent",
  approved: "border-l-success",
};

function SopsPage() {
  const { client } = useRequiredClient();
  const navigate = useNavigate({ from: "/sops" });
  const { dept } = Route.useSearch();
  const { data: playbooks = [], isLoading } = usePlaybooks(client.id);
  const { data: workstreams = [] } = useWorkstreams(client.id);
  const createPlaybook = useCreatePlaybook();
  const updatePlaybook = useUpdatePlaybook();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);

  const activeDept = workstreams.find((w) => w.id === dept);
  const clearDept = () => navigate({ search: {} });

  // New playbook form state
  const [formTitle, setFormTitle] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formWorkstream, setFormWorkstream] = useState("");
  const [formType, setFormType] = useState<Playbook["type"]>("sop");
  const [formStatus, setFormStatus] = useState<Playbook["status"]>("not_started");
  const [formLoomUrl, setFormLoomUrl] = useState("");
  const [formLoomMin, setFormLoomMin] = useState("");

  const resetForm = () => {
    setFormTitle(""); setFormCode(""); setFormOwner(""); setFormWorkstream("");
    setFormType("sop"); setFormStatus("not_started"); setFormLoomUrl(""); setFormLoomMin("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPlaybook.mutateAsync({
      client_id: client.id,
      title: formTitle,
      code: formCode || null,
      owner_name: formOwner || null,
      workstream_id: formWorkstream || null,
      type: formType,
      status: formStatus,
      loom_url: formLoomUrl || null,
      loom_duration_min: formLoomMin ? Number(formLoomMin) : null,
      notes: null,
    });
    resetForm();
    setShowForm(false);
  };

  const filtered = playbooks.filter(
    (s) =>
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      (s.code ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (s.owner_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

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
        eyebrow={`${client.name} · SOPs`}
        title="Standard Operating Procedures"
        subtitle="Track every SOP from filmed to approved. Drag, review, ship."
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> New SOP
          </button>
        }
      />

      {/* ─── New SOP slide-down form ─── */}
      {showForm && (
        <Panel>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[13px] font-semibold">New Playbook Entry</div>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Title *</label>
                <input required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Site mobilisation checklist" className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Code</label>
                <input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. OPS-014" className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Owner</label>
                <input value={formOwner} onChange={(e) => setFormOwner(e.target.value)} placeholder="e.g. Katie" className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Department</label>
                <select value={formWorkstream} onChange={(e) => setFormWorkstream(e.target.value)} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40">
                  <option value="">— Select —</option>
                  {workstreams.map((ws) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value as Playbook["type"])} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40">
                  {["sop", "framework", "script", "policy", "campaign", "playbook", "other"].map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as Playbook["status"])} className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40">
                  {COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Loom URL</label>
                <input value={formLoomUrl} onChange={(e) => setFormLoomUrl(e.target.value)} placeholder="https://loom.com/..." className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Duration (min)</label>
                <input type="number" value={formLoomMin} onChange={(e) => setFormLoomMin(e.target.value)} placeholder="e.g. 12" className="w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button type="submit" disabled={createPlaybook.isPending || !formTitle} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50">
                {createPlaybook.isPending ? "Saving..." : "Create Playbook"}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2 rounded-md bg-secondary/60 border border-border text-[12px]">
                Cancel
              </button>
              {createPlaybook.isError && (
                <span className="text-[11px] text-destructive">{(createPlaybook.error as Error).message}</span>
              )}
            </div>
          </form>
        </Panel>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SOPs..."
            className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-[13px] placeholder:text-muted-foreground outline-none focus:border-primary/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-md bg-secondary/60 border border-border text-[12px] flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Filter</span>
          </button>
          <div className="flex bg-secondary/60 rounded-md border border-border p-0.5 text-[12px] font-mono">
            {(["kanban", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1 rounded uppercase tracking-wider",
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 scrollbar-thin">
          <div className="grid grid-cols-5 gap-3 min-w-[900px]">
            {COLUMNS.map((col) => {
              const items = filtered.filter((s) => s.status === col.key);
              return (
                <div key={col.key} className="bg-surface/40 border border-border rounded-xl p-2.5 min-h-[400px]">
                  <div className="flex items-center justify-between px-1.5 py-1.5 mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{col.label}</span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-secondary text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "bg-card border border-border border-l-2 rounded-md p-2.5 hover:border-primary/40 cursor-grab",
                          STATUS_CLASS[s.status],
                        )}
                      >
                        <div className="text-[10px] font-mono text-muted-foreground">{s.code ?? "—"}</div>
                        <div className="text-[12px] font-medium mt-0.5 leading-snug">{s.title}</div>
                        <div className="flex items-center justify-between mt-2 text-[10px]">
                          <span className="text-muted-foreground">{(s.owner_name ?? "").split(" ")[0]}</span>
                          {s.loom_duration_min && <span className="font-mono text-primary">▶ {s.loom_duration_min}m</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Panel>
          <div className="overflow-x-auto -mx-2 scrollbar-thin">
            <div className="min-w-[700px] px-2">
              <div className="grid grid-cols-[80px_1fr_140px_140px_120px_70px] gap-3 px-2 py-1.5 text-[10px] uppercase tracking-wider font-mono text-muted-foreground border-b border-border">
                <div>Code</div><div>Title</div><div>Department</div><div>Owner</div><div>Status</div><div className="text-right">Updated</div>
              </div>
              {filtered.map((s) => (
                <div key={s.id} className="grid grid-cols-[80px_1fr_140px_140px_120px_70px] gap-3 px-2 py-2.5 text-[12px] hover:bg-secondary/30 rounded-md items-center border-b border-border last:border-0">
                  <div className="font-mono text-[11px] text-muted-foreground">{s.code ?? "—"}</div>
                  <div className="truncate">{s.title}</div>
                  <div className="text-muted-foreground text-[11px]">{s.workstream?.name ?? "—"}</div>
                  <div className="text-muted-foreground text-[11px]">{s.owner_name ?? "—"}</div>
                  <div>
                    <span className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border font-mono uppercase tracking-wider",
                      s.status === "approved" && "bg-success/15 text-success border-success/30",
                      s.status === "under_review" && "bg-warning/15 text-warning border-warning/30",
                      s.status === "submitted" && "bg-info/15 text-info border-info/30",
                      s.status === "refined" && "bg-accent/15 text-accent border-accent/30",
                      s.status === "not_started" && "bg-secondary text-muted-foreground border-border",
                    )}>
                      {s.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground font-mono">{timeAgo(s.updated_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
