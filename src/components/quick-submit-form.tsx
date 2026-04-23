import { useMemo, useState } from "react";
import { Loader2, Check } from "lucide-react";
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

  const [owner, setOwner] = useState("");
  const [selectedSopId, setSelectedSopId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [loomUrl, setLoomUrl] = useState("");
  const [duration, setDuration] = useState("");
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
    setDuration("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || !title || !loomUrl) return;
    await createPlaybook.mutateAsync({
      client_id: client.id,
      title,
      code: null,
      owner_name: owner,
      workstream_id: inferredWorkstreamId,
      type: "sop",
      status: "submitted",
      loom_url: loomUrl,
      loom_duration_min: duration ? Number(duration) : null,
      notes: null,
    });
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
        <label className={labelCls}>SOP title *</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Site mobilisation checklist"
          className={inputCls}
        />
      </div>

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
      </div>

      {!compact && (
        <div>
          <label className={labelCls}>Duration (min)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 12"
            className={inputCls}
          />
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={createPlaybook.isPending || !owner || !title || !loomUrl}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 flex items-center gap-1.5"
        >
          {createPlaybook.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {createPlaybook.isPending ? "Submitting..." : "Submit SOP"}
        </button>
        {justSaved && (
          <span className="flex items-center gap-1 text-[11px] text-success">
            <Check className="h-3.5 w-3.5" /> Submitted — added to pipeline
          </span>
        )}
        {createPlaybook.isError && (
          <span className="text-[11px] text-destructive">
            {(createPlaybook.error as Error).message}
          </span>
        )}
      </div>
    </form>
  );
}
