import { useMemo, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useCreatePlaybook, useUpdatePlaybook, useWorkstreams, usePlaybooks } from "@/lib/hooks";
import { useRequiredClient } from "@/lib/client-context";

type Props = {
  /** Optional callback when a submission completes successfully */
  onSubmitted?: () => void;
  /** Compact variant — used in dashboard widget */
  compact?: boolean;
};

/**
 * Lightweight intake form for the SBL Playbook playlist.
 * User picks their name from existing department owners,
 * pastes a Loom link, and ships it. Behind the scenes this
 * creates a playbook row with status=submitted.
 */
export function QuickSubmitForm({ onSubmitted, compact = false }: Props) {
  const { client } = useRequiredClient();
  const { data: workstreams = [] } = useWorkstreams(client.id);
  const { data: playbooks = [] } = usePlaybooks(client.id);
  const createPlaybook = useCreatePlaybook();
  const updatePlaybook = useUpdatePlaybook();

  const [owner, setOwner] = useState("");
  const [selectedSopId, setSelectedSopId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [loomUrl, setLoomUrl] = useState("");
  
  const [justSaved, setJustSaved] = useState(false);

  // Build deduped name list from workstream owners + existing playbook owners
  const owners = useMemo(() => {
    const set = new Set<string>();
    workstreams.forEach((w) => w.owner_name && set.add(w.owner_name));
    playbooks.forEach((p) => p.owner_name && set.add(p.owner_name));
    return Array.from(set).sort();
  }, [workstreams, playbooks]);

  // Best-effort: match owner → workstream so the SOP lands in the right department
  const inferredWorkstreamId = useMemo(() => {
    const ws = workstreams.find((w) => w.owner_name === owner);
    return ws?.id ?? null;
  }, [workstreams, owner]);

  // SOPs relevant to this owner / their department
  const relevantSops = useMemo(() => {
    if (!owner) return [];
    return playbooks
      .filter(
        (p) =>
          p.owner_name === owner ||
          (inferredWorkstreamId && p.workstream_id === inferredWorkstreamId),
      )
      .sort((a, b) => (a.code ?? a.title).localeCompare(b.code ?? b.title));
  }, [playbooks, owner, inferredWorkstreamId]);

  const isNewSop = selectedSopId === "__new__";
  const selectedSop = playbooks.find((p) => p.id === selectedSopId) ?? null;

  const reset = () => {
    setSelectedSopId("");
    setTitle("");
    setLoomUrl("");
    
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || !loomUrl) return;

    if (selectedSop && !isNewSop) {
      // Attach Loom to an existing SOP
      await updatePlaybook.mutateAsync({
        id: selectedSop.id,
        status: "submitted",
        loom_url: loomUrl,
        loom_duration_min: null,
        owner_name: selectedSop.owner_name ?? owner,
      });
      const label = selectedSop.code
        ? `${selectedSop.code} · ${selectedSop.title}`
        : selectedSop.title;
      toast.success("SOP updated", {
        description: `Loom attached to ${label}.`,
      });
    } else {
      // Brand-new SOP
      if (!title) return;
      await createPlaybook.mutateAsync({
        client_id: client.id,
        title,
        code: null,
        owner_name: owner,
        workstream_id: inferredWorkstreamId,
        type: "sop",
        status: "submitted",
        loom_url: loomUrl,
        loom_duration_min: null,
        notes: null,
      });
      toast.success("New SOP created", {
        description: `"${title}" added to the pipeline.`,
      });
    }

    reset();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    onSubmitted?.();
  };

  const inputCls =
    "w-full bg-surface border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary/40";
  const labelCls =
    "text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block";

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2.5" : "space-y-3"}>
      <div>
        <label className={labelCls}>Your name *</label>
        <select
          required
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className={inputCls}
        >
          <option value="">— Select your name —</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>SOP *</label>
        <select
          required
          value={selectedSopId}
          onChange={(e) => setSelectedSopId(e.target.value)}
          disabled={!owner}
          className={inputCls}
        >
          <option value="">
            {owner ? "— Select an SOP —" : "Select your name first"}
          </option>
          {relevantSops.length > 0 && (
            <optgroup label="Your SOPs">
              {relevantSops.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} · ${p.title}` : p.title}
                </option>
              ))}
            </optgroup>
          )}
          <option value="__new__">+ New SOP (not in the list)</option>
        </select>
        {owner && relevantSops.length === 0 && (
          <p className="text-[11px] text-muted-foreground mt-1">
            No SOPs assigned yet — pick "New SOP" to add one.
          </p>
        )}
      </div>

      {isNewSop && (
        <div>
          <label className={labelCls}>New SOP title *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Site mobilisation checklist"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className={labelCls}>Loom URL *</label>
        <input
          required
          type="url"
          value={loomUrl}
          onChange={(e) => setLoomUrl(e.target.value)}
          placeholder="https://loom.com/..."
          className={inputCls}
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          💡 Tip: install the{" "}
          <a
            href="https://chromewebstore.google.com/detail/loom-screen-recorder-scre/liecbddmkiiihnedobmlmillhodjkdmb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Loom Chrome extension
          </a>{" "}
          to record &amp; paste in one click — no tab switching.
        </p>
      </div>



      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={
            createPlaybook.isPending ||
            updatePlaybook.isPending ||
            !owner ||
            !loomUrl ||
            !selectedSopId ||
            (isNewSop && !title)
          }
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 flex items-center gap-1.5"
        >
          {(createPlaybook.isPending || updatePlaybook.isPending) && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          {createPlaybook.isPending || updatePlaybook.isPending
            ? "Submitting..."
            : "Submit SOP"}
        </button>
        {justSaved && (
          <span className="flex items-center gap-1 text-[11px] text-success">
            <Check className="h-3.5 w-3.5" /> Submitted — added to pipeline
          </span>
        )}
        {(createPlaybook.isError || updatePlaybook.isError) && (
          <span className="text-[11px] text-destructive">
            {((createPlaybook.error ?? updatePlaybook.error) as Error)?.message}
          </span>
        )}
      </div>
    </form>
  );
}
