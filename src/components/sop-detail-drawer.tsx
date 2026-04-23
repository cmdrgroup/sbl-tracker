import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUpdatePlaybook } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Playbook, Workstream } from "@/lib/types";
import { Loader2, Play, MessageSquare, ArrowRight } from "lucide-react";

const STATUS_LABEL: Record<Playbook["status"], string> = {
  not_started: "Not Started",
  submitted: "Submitted",
  under_review: "In Review",
  refined: "Refined",
  approved: "Approved",
};

const STATUS_BADGE: Record<Playbook["status"], string> = {
  not_started: "bg-secondary text-muted-foreground border-border",
  submitted: "bg-info/15 text-info border-info/30",
  under_review: "bg-warning/15 text-warning border-warning/30",
  refined: "bg-accent/15 text-accent border-accent/30",
  approved: "bg-success/15 text-success border-success/30",
};

const TYPES = ["sop", "framework", "script", "policy", "campaign", "playbook", "other"] as const;
const STATUSES: Playbook["status"][] = ["not_started", "submitted", "under_review", "refined", "approved"];

interface Props {
  sop: Playbook | null;
  workstreams: Workstream[];
  open: boolean;
  onClose: () => void;
}

export function SopDetailDrawer({ sop, workstreams, open, onClose }: Props) {
  const updatePlaybook = useUpdatePlaybook();

  const [code, setCode] = useState("");
  const [type, setType] = useState<Playbook["type"]>("sop");
  const [loomUrl, setLoomUrl] = useState("");
  const [loomMin, setLoomMin] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!sop) return;
    setCode(sop.code ?? "");
    setType(sop.type);
    setLoomUrl(sop.loom_url ?? "");
    setLoomMin(sop.loom_duration_min?.toString() ?? "");
    setNotes(sop.notes ?? "");
    setSaved(false);
  }, [sop?.id]);

  if (!sop) return null;

  const dept = workstreams.find((w) => w.id === sop.workstream_id);
  const isNotStarted = sop.status === "not_started";
  const isSubmitted = sop.status === "submitted";
  const isReviewStage = sop.status === "under_review" || sop.status === "refined";
  const isApproved = sop.status === "approved";

  const transitionTo = async (next: Playbook["status"]) => {
    await updatePlaybook.mutateAsync({
      id: sop.id,
      status: next,
      code: code || null,
      type,
      loom_url: loomUrl || null,
      loom_duration_min: loomMin ? Number(loomMin) : null,
      notes: notes || null,
    });
    onClose();
  };

  const saveOnly = async () => {
    await updatePlaybook.mutateAsync({
      id: sop.id,
      code: code || null,
      type,
      loom_url: loomUrl || null,
      loom_duration_min: loomMin ? Number(loomMin) : null,
      notes: notes || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card border-border p-0">
        <div className="border-b border-border p-5">
          <SheetHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {sop.code ?? "—"}
              </span>
              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border font-mono uppercase tracking-wider", STATUS_BADGE[sop.status])}>
                {STATUS_LABEL[sop.status].replace("_", " ")}
              </span>
            </div>
            <SheetTitle className="text-[18px] font-semibold leading-snug">{sop.title}</SheetTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {dept && <span><span className="font-mono uppercase tracking-wider text-[10px]">Dept</span> · {dept.name}</span>}
              {sop.owner_name && <span><span className="font-mono uppercase tracking-wider text-[10px]">Owner</span> · {sop.owner_name}</span>}
              <span><span className="font-mono uppercase tracking-wider text-[10px]">Type</span> · {sop.type}</span>
            </div>
          </SheetHeader>
        </div>

        <div className="p-5 space-y-5">
          {/* ── NOT STARTED → submission form ── */}
          {isNotStarted && (
            <>
              <div className="text-[12px] text-muted-foreground bg-secondary/40 border border-border rounded-md p-3">
                Fill in the details below to submit this SOP for review. Title, department and owner are pre-filled.
              </div>

              <FieldGrid>
                <Field label="Code">
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="OPS-014" className={inputCls} />
                </Field>
                <Field label="Type">
                  <select value={type} onChange={(e) => setType(e.target.value as Playbook["type"])} className={inputCls}>
                    {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Loom URL" full>
                  <input value={loomUrl} onChange={(e) => setLoomUrl(e.target.value)} placeholder="https://loom.com/..." className={inputCls} />
                </Field>
                <Field label="Duration (min)">
                  <input type="number" value={loomMin} onChange={(e) => setLoomMin(e.target.value)} placeholder="12" className={inputCls} />
                </Field>
              </FieldGrid>

              <Field label="Notes / written steps" full>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Outline the steps, context, edge cases…" className={cn(inputCls, "min-h-[140px] resize-y")} />
              </Field>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => transitionTo("submitted")}
                  disabled={updatePlaybook.isPending}
                  className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  {updatePlaybook.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  Submit for Review
                </button>
                <button onClick={saveOnly} disabled={updatePlaybook.isPending} className="px-4 py-2 rounded-md bg-secondary/60 border border-border text-[12px]">
                  {saved ? "Saved ✓" : "Save Draft"}
                </button>
              </div>
            </>
          )}

          {/* ── SUBMITTED → view-only ── */}
          {isSubmitted && (
            <>
              <ContentView code={sop.code} type={sop.type} loomUrl={sop.loom_url} loomMin={sop.loom_duration_min} notes={sop.notes} />
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button onClick={() => transitionTo("under_review")} disabled={updatePlaybook.isPending} className="flex-1 px-4 py-2 rounded-md bg-warning/20 border border-warning/40 text-warning text-[12px] font-medium">
                  Move to In Review →
                </button>
              </div>
            </>
          )}

          {/* ── IN REVIEW / REFINED → view + inline notes ── */}
          {isReviewStage && (
            <>
              <ContentView code={sop.code} type={sop.type} loomUrl={sop.loom_url} loomMin={sop.loom_duration_min} notes={sop.notes} />

              <Field label={<span className="inline-flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Review notes / refinements</span>} full>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Add inline comments, refinements or feedback…" className={cn(inputCls, "min-h-[120px] resize-y")} />
              </Field>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                <button onClick={saveOnly} disabled={updatePlaybook.isPending} className="px-3 py-2 rounded-md bg-secondary/60 border border-border text-[12px]">
                  {saved ? "Saved ✓" : "Save notes"}
                </button>
                {sop.status === "under_review" && (
                  <button onClick={() => transitionTo("refined")} disabled={updatePlaybook.isPending} className="px-3 py-2 rounded-md bg-accent/20 border border-accent/40 text-accent text-[12px] font-medium">
                    Mark Refined →
                  </button>
                )}
                {sop.status === "refined" && (
                  <button onClick={() => transitionTo("approved")} disabled={updatePlaybook.isPending} className="px-3 py-2 rounded-md bg-success/20 border border-success/40 text-success text-[12px] font-medium">
                    Approve →
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── APPROVED → view-only locked ── */}
          {isApproved && (
            <>
              <ContentView code={sop.code} type={sop.type} loomUrl={sop.loom_url} loomMin={sop.loom_duration_min} notes={sop.notes} />
              <div className="text-[11px] text-success bg-success/10 border border-success/30 rounded-md p-2.5 font-mono uppercase tracking-wider">
                ✓ Approved — locked
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const inputCls = "w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40";

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children, full }: { label: React.ReactNode; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function ContentView({ code, type, loomUrl, loomMin, notes }: { code: string | null; type: string; loomUrl: string | null; loomMin: number | null; notes: string | null }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Code</div>
          <div>{code ?? "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Type</div>
          <div className="capitalize">{type}</div>
        </div>
      </div>
      {loomUrl && (
        <a href={loomUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/30 text-primary text-[12px] hover:bg-primary/15">
          <Play className="h-3.5 w-3.5" />
          Watch Loom {loomMin && <span className="font-mono ml-auto">{loomMin}m</span>}
        </a>
      )}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Notes / steps</div>
        <div className="text-[12px] whitespace-pre-wrap bg-secondary/40 border border-border rounded-md p-3 min-h-[80px] text-foreground/90">
          {notes || <span className="text-muted-foreground italic">No notes provided.</span>}
        </div>
      </div>
    </div>
  );
}
