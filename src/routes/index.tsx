import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

// ─── SUPABASE CONFIG ───
const SUPABASE_URL = "https://nzqmbduvnfdagobgzbre.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cW1iZHV2bmZkYWdvYmd6YnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjMzNjMsImV4cCI6MjA5MjE5OTM2M30.RxaOORpuWBwt1DM-b6k1h0d9_nJTYmMoVSVT6J8tCHc";

const supabase = {
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  } as Record<string, string>,
  async select(table: string, query = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: this.headers });
    if (!res.ok) throw new Error(`Select failed: ${res.status}`);
    return res.json();
  },
  async insert(table: string, data: any) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: this.headers, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Insert failed: ${res.status}`);
    return res.json();
  },
  async update(table: string, id: string, data: any) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH", headers: this.headers, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    return res.json();
  },
  async remove(table: string, id: string) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE", headers: this.headers,
    });
    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    return true;
  },
};

// ─── CONSTANTS ───
const DEPT_COLORS: Record<string, string> = {
  Finance: "#3498DB", HSEQ: "#9B59B6", Quality: "#E67E22",
  Compliance: "#E74C3C", Construction: "#F39C12", Operations: "#27AE60",
};

const PIPELINE_STAGES = [
  { key: "not_started", label: "Not Started", color: "#E0E0E0", text: "#777" },
  { key: "submitted", label: "Submitted", color: "#85C1E9", text: "#1A5276" },
  { key: "under_review", label: "Under Review", color: "#F9E79F", text: "#7D6608" },
  { key: "refined", label: "Refined", color: "#82E0AA", text: "#1E8449" },
  { key: "approved", label: "Approved", color: "#1F4E79", text: "#fff" },
];

const MOODS = [
  { key: "strong", label: "Strong", emoji: "\uD83D\uDFE2" },
  { key: "steady", label: "Steady", emoji: "\uD83D\uDFE1" },
  { key: "flat", label: "Flat", emoji: "\uD83D\uDFE0" },
  { key: "under_pressure", label: "Under Pressure", emoji: "\uD83D\uDD34" },
];

// ─── UI COMPONENTS ───
function ProgressBar({ value, max, color, height = 18 }: any) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <div style={{ flex: 1, height, background: "#F0F0F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s ease", minWidth: pct > 0 ? 6 : 0 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#555", minWidth: 55, textAlign: "right" }}>{value}/{max} ({pct}%)</span>
    </div>
  );
}

function Badge({ label, color, bg }: any) {
  return <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color, whiteSpace: "nowrap" }}>{label}</span>;
}

function StatusBadge({ status }: any) {
  const map: Record<string, { bg: string; c: string }> = {
    not_started: { bg: "#F2F3F4", c: "#808B96" }, submitted: { bg: "#D6EAF8", c: "#2471A3" },
    under_review: { bg: "#FEF9E7", c: "#B7950B" }, refined: { bg: "#D5F5E3", c: "#1E8449" },
    approved: { bg: "#1F4E79", c: "#fff" }, pending: { bg: "#FDEDEC", c: "#C0392B" },
    in_progress: { bg: "#FEF9E7", c: "#B7950B" }, complete: { bg: "#D5F5E3", c: "#1E8449" },
    open: { bg: "#D6EAF8", c: "#2471A3" }, done: { bg: "#D5F5E3", c: "#1E8449" },
    overdue: { bg: "#FDEDEC", c: "#C0392B" }, carried: { bg: "#FEF9E7", c: "#B7950B" },
  };
  const s = map[status] || { bg: "#F2F3F4", c: "#555" };
  const label = (status || "").replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
  return <Badge label={label} bg={s.bg} color={s.c} />;
}

function Card({ title, children, accent = "#1F4E79", actions }: any) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #E8E8E8", borderTop: `3px solid ${accent}`, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1F4E79", textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }: any) {
  return (
    <div style={{ flex: 1, minWidth: 110, background: "#fff", borderRadius: 8, border: "1px solid #E8E8E8", padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#1F4E79" }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#999" }}>{sub}</div>}
    </div>
  );
}

// ─── SUBMISSION FORM ───
function SubmissionForm({ sops, onSubmitted }: any) {
  const [owner, setOwner] = useState("");
  const [sopId, setSopId] = useState("");
  const [loomUrl, setLoomUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const owners = useMemo(() => [...new Set(sops.filter((s: any) => s.department !== "Operations").map((s: any) => s.owner))].sort() as string[], [sops]);
  const available = useMemo(() => sops.filter((s: any) => s.owner === owner && s.department !== "Operations"), [sops, owner]);

  const handleSubmit = async () => {
    if (!owner || !sopId || !loomUrl) return;
    setLoading(true);
    try {
      await supabase.insert("sop_submissions", { sop_id: sopId, submitted_by: owner, loom_url: loomUrl, notes: notes || null });
      setSubmitted(true);
      onSubmitted();
      setTimeout(() => { setSubmitted(false); setSopId(""); setLoomUrl(""); setNotes(""); }, 3000);
    } catch (e) { alert("Submission failed — please try again."); }
    setLoading(false);
  };

  const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D5D8DC", fontSize: 14, fontFamily: "Arial", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #1F4E79 0%, #2E75B6 40%, #F7F8FA 40%)", display: "flex", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", color: "#fff", marginBottom: 30 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>SBL Playbook</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>SOP Filming Submission</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48 }}>&#10003;</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#27AE60" }}>Submitted!</div>
              <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>Curtis has been notified. Thanks for filming!</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>Your Name</label>
                <select value={owner} onChange={e => { setOwner(e.target.value); setSopId(""); }} style={{ ...input, background: "#fff" }}>
                  <option value="">Select your name...</option>
                  {owners.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {owner && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>SOP You Filmed</label>
                  <select value={sopId} onChange={e => setSopId(e.target.value)} style={{ ...input, background: "#fff" }}>
                    <option value="">Select the SOP...</option>
                    {available.map((s: any) => <option key={s.id} value={s.id}>{s.id} — {s.title}</option>)}
                  </select>
                </div>
              )}
              {sopId && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>Loom Recording URL</label>
                    <input type="url" value={loomUrl} onChange={e => setLoomUrl(e.target.value)} placeholder="https://www.loom.com/share/..." style={input} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>Notes (optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything Curtis should know..." rows={3} style={{ ...input, resize: "vertical" }} />
                  </div>
                  <button onClick={handleSubmit} disabled={!loomUrl || loading} style={{
                    width: "100%", padding: "12px", borderRadius: 8, border: "none",
                    background: loomUrl && !loading ? "#1F4E79" : "#CCC", color: "#fff",
                    fontSize: 15, fontWeight: 600, cursor: loomUrl && !loading ? "pointer" : "default",
                  }}>{loading ? "Submitting..." : "Submit Recording"}</button>
                </>
              )}
            </>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#aaa" }}>SBL Solutions Services Pty Ltd</div>
      </div>
    </div>
  );
}

// ─── CAPTAIN'S TABLE ───
function CaptainsTable({ sessions, actions, onRefresh }: any) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<any>({ session_date: new Date().toISOString().slice(0, 10), week_number: sessions.length + 1, discussion_summary: "", brett_sitrep: "", curtis_sitrep: "", key_decisions: "", mood: "steady" });
  const [newAction, setNewAction] = useState<any>({ owner: "Brett Poole", description: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const saveSession = async () => {
    setSaving(true);
    try {
      await supabase.insert("captains_table_sessions", form);
      setShowNew(false);
      setForm({ ...form, discussion_summary: "", brett_sitrep: "", curtis_sitrep: "", key_decisions: "", week_number: form.week_number + 1 });
      onRefresh();
    } catch (e) { alert("Save failed"); }
    setSaving(false);
  };

  const updateSession = async () => {
    if (!editingId || !editForm) return;
    setSaving(true);
    try {
      const { id, created_at, ...data } = editForm;
      await supabase.update("captains_table_sessions", editingId, data);
      setEditingId(null);
      setEditForm(null);
      onRefresh();
    } catch (e) { alert("Update failed"); }
    setSaving(false);
  };

  const startEdit = (session: any) => {
    setEditingId(session.id);
    setEditForm({ ...session });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const addAction = async (sessionId: string) => {
    if (!newAction.description) return;
    try {
      const payload = { owner: newAction.owner, description: newAction.description, session_id: sessionId };
      await supabase.insert("action_items", payload);
      setNewAction({ owner: "Brett Poole", description: "" });
      onRefresh();
    } catch (e) { alert("Failed to add action"); }
  };

  const toggleAction = async (item: any) => {
    const newStatus = item.status === "done" ? "open" : "done";
    await supabase.update("action_items", item.id, { status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null });
    onRefresh();
  };

  const deleteAction = async (item: any) => {
    if (!confirm("Delete this action item?")) return;
    try {
      await supabase.remove("action_items", item.id);
      onRefresh();
    } catch (e) { alert("Delete failed"); }
  };

  const deleteSession = async (session: any) => {
    if (!confirm("Delete this session and all its action items? This can't be undone.")) return;
    try {
      const sessionActions = actions.filter((a: any) => a.session_id === session.id);
      for (const a of sessionActions) { await supabase.remove("action_items", a.id); }
      await supabase.remove("captains_table_sessions", session.id);
      onRefresh();
    } catch (e) { alert("Delete failed"); }
  };

  const openActions = actions.filter((a: any) => a.status === "open" || a.status === "overdue");
  const doneActions = actions.filter((a: any) => a.status === "done");

  const input: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #D5D8DC", fontSize: 13, fontFamily: "Arial", outline: "none", boxSizing: "border-box" };

  return (
    <>
      <Card title={`Open Actions (${openActions.length})`} accent="#E74C3C"
        actions={<button onClick={() => setShowNew(!showNew)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#1F4E79", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{showNew ? "Cancel" : "+ Log Session"}</button>}>
        {openActions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#AAA", fontSize: 13 }}>No open actions</div>
        ) : openActions.map((a: any, i: number) => (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < openActions.length - 1 ? "1px solid #F5F5F5" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" onChange={() => toggleAction(a)} style={{ cursor: "pointer" }} />
              <div>
                <div style={{ fontSize: 13 }}>{a.description}</div>
                <div style={{ fontSize: 11, color: "#999" }}>{a.owner}{a.due_date ? ` · Due: ${a.due_date}` : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusBadge status={a.status} />
              <button onClick={() => deleteAction(a)} title="Delete action" style={{ padding: "2px 6px", borderRadius: 4, border: "none", background: "none", color: "#CCC", fontSize: 13, cursor: "pointer", lineHeight: 1 }}>&times;</button>
            </div>
          </div>
        ))}
      </Card>

      {showNew && (
        <Card title="Log This Week's Session" accent="#27AE60">
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Date</label>
              <input type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} style={input} />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Week #</label>
              <input type="number" value={form.week_number} onChange={e => setForm({ ...form, week_number: parseInt(e.target.value) })} style={input} />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Brett's Mood</label>
              <select value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })} style={{ ...input, background: "#fff" }}>
                {MOODS.map(m => <option key={m.key} value={m.key}>{m.emoji} {m.label}</option>)}
              </select>
            </div>
          </div>
          {[
            { key: "brett_sitrep", label: "Brett's Sit-Rep", ph: "What's on Brett's mind — business, personal, strategic..." },
            { key: "curtis_sitrep", label: "Curtis's Sit-Rep", ph: "Playbook progress, blockers, what moved this week..." },
            { key: "key_decisions", label: "Key Decisions Made", ph: "Any decisions locked in this session..." },
            { key: "discussion_summary", label: "Discussion Notes", ph: "Other discussion points, context, follow-ups..." },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>{f.label}</label>
              <textarea value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} rows={2} style={{ ...input, resize: "vertical" }} />
            </div>
          ))}
          <button onClick={saveSession} disabled={saving} style={{
            padding: "10px 20px", borderRadius: 8, border: "none", background: "#27AE60", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{saving ? "Saving..." : "Save Session"}</button>
        </Card>
      )}

      <Card title="Session History">
        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#AAA", fontSize: 13 }}>No sessions logged yet. Start by clicking "+ Log Session" above.</div>
        ) : [...sessions].sort((a: any, b: any) => b.session_date.localeCompare(a.session_date)).map((s: any, i: number) => {
          const mood = MOODS.find(m => m.key === s.mood);
          const sessionActions = actions.filter((a: any) => a.session_id === s.id);
          const isEditing = editingId === s.id;
          return (
            <div key={s.id} style={{ padding: "14px 0", borderBottom: i < sessions.length - 1 ? "1px solid #F0F0F0" : "none" }}>
              {isEditing ? (
                <div style={{ background: "#FAFBFC", borderRadius: 8, padding: 16, border: "1px solid #E8E8E8" }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Date</label>
                      <input type="date" value={editForm.session_date} onChange={e => setEditForm({ ...editForm, session_date: e.target.value })} style={input} />
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Week #</label>
                      <input type="number" value={editForm.week_number} onChange={e => setEditForm({ ...editForm, week_number: parseInt(e.target.value) })} style={input} />
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Brett's Mood</label>
                      <select value={editForm.mood} onChange={e => setEditForm({ ...editForm, mood: e.target.value })} style={{ ...input, background: "#fff" }}>
                        {MOODS.map(m => <option key={m.key} value={m.key}>{m.emoji} {m.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {[
                    { key: "brett_sitrep", label: "Brett's Sit-Rep" },
                    { key: "curtis_sitrep", label: "Curtis's Sit-Rep" },
                    { key: "key_decisions", label: "Key Decisions Made" },
                    { key: "discussion_summary", label: "Discussion Notes" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <textarea value={editForm[f.key] || ""} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} rows={2} style={{ ...input, resize: "vertical" }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={updateSession} disabled={saving} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#27AE60", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving..." : "Save Changes"}</button>
                    <button onClick={cancelEdit} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #D5D8DC", background: "#fff", color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1F4E79" }}>Week {s.week_number}</span>
                      <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>{s.session_date}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {mood && <span style={{ fontSize: 13, marginRight: 4 }}>{mood.emoji} {mood.label}</span>}
                      <button onClick={() => startEdit(s)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #D5D8DC", background: "#fff", color: "#888", fontSize: 11, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => deleteSession(s)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #FADBD8", background: "#fff", color: "#E74C3C", fontSize: 11, cursor: "pointer" }}>Delete</button>
                    </div>
                  </div>
                  {s.brett_sitrep && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Brett:</strong> {s.brett_sitrep}</div>}
                  {s.curtis_sitrep && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Curtis:</strong> {s.curtis_sitrep}</div>}
                  {s.key_decisions && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Decisions:</strong> {s.key_decisions}</div>}
                  {s.discussion_summary && <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>{s.discussion_summary}</div>}
                  {sessionActions.length > 0 && (
                    <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "2px solid #E8E8E8" }}>
                      {sessionActions.map((a: any) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <input type="checkbox" checked={a.status === "done"} onChange={() => toggleAction(a)} style={{ cursor: "pointer" }} />
                          <span style={{ fontSize: 12, textDecoration: a.status === "done" ? "line-through" : "none", color: a.status === "done" ? "#AAA" : "#333", flex: 1 }}>{a.description}</span>
                          <span style={{ fontSize: 10, color: "#BBB" }}>{a.owner}</span>
                          <button onClick={() => deleteAction(a)} title="Delete" style={{ padding: "1px 5px", borderRadius: 3, border: "none", background: "none", color: "#CCC", fontSize: 12, cursor: "pointer", lineHeight: 1 }}>&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <input placeholder="Add action item..." value={newAction.session_id === s.id ? newAction.description : ""} onChange={e => setNewAction({ ...newAction, description: e.target.value, session_id: s.id })}
                      style={{ flex: 1, padding: "6px 8px", borderRadius: 4, border: "1px solid #E8E8E8", fontSize: 12, outline: "none" }} />
                    <select value={newAction.session_id === s.id ? newAction.owner : "Brett Poole"} onChange={e => setNewAction({ ...newAction, owner: e.target.value, session_id: s.id })}
                      style={{ padding: "6px", borderRadius: 4, border: "1px solid #E8E8E8", fontSize: 12 }}>
                      <option>Brett Poole</option><option>Curtis Tofa</option><option>Ryan Christensen</option>
                    </select>
                    <button onClick={() => addAction(s.id)} style={{ padding: "6px 10px", borderRadius: 4, border: "none", background: "#1F4E79", color: "#fff", fontSize: 11, cursor: "pointer" }}>Add</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </Card>

      {doneActions.length > 0 && (
        <Card title={`Completed Actions (${doneActions.length})`} accent="#27AE60">
          {doneActions.map((a: any, i: number) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < doneActions.length - 1 ? "1px solid #F5F5F5" : "none" }}>
              <span style={{ fontSize: 12, color: "#AAA", textDecoration: "line-through" }}>{a.description}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#CCC" }}>{a.owner} · {a.completed_at?.slice(0, 10)}</span>
                <button onClick={() => deleteAction(a)} title="Delete" style={{ padding: "1px 5px", borderRadius: 3, border: "none", background: "none", color: "#CCC", fontSize: 12, cursor: "pointer", lineHeight: 1 }}>&times;</button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

// ─── PIN GATE ───
const ADMIN_PIN = "1874";

function PinGate({ onSuccess, onBack }: any) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1F4E79 0%, #2E75B6 100%)", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 360,
        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        transform: shake ? "translateX(-8px)" : "none",
        transition: "transform 0.1s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1F4E79" }}>SBL Playbook</div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Enter PIN to access dashboard</div>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(false); }}
            placeholder="----"
            autoFocus
            style={{
              width: "100%", padding: "14px", borderRadius: 8,
              border: `2px solid ${error ? "#E74C3C" : "#D5D8DC"}`,
              fontSize: 24, fontFamily: "Arial", textAlign: "center", letterSpacing: 12,
              outline: "none", boxSizing: "border-box",
              transition: "border-color 0.2s ease",
            }}
          />
          {error && <div style={{ fontSize: 12, color: "#E74C3C", textAlign: "center", marginTop: 8 }}>Incorrect PIN</div>}
          <button type="submit" style={{
            width: "100%", padding: "12px", borderRadius: 8, border: "none",
            background: pin.length === 4 ? "#1F4E79" : "#CCC", color: "#fff",
            fontSize: 15, fontWeight: 600, cursor: pin.length === 4 ? "pointer" : "default",
            marginTop: 16, transition: "background 0.2s ease",
          }}>Access Dashboard</button>
          {onBack && (
            <button type="button" onClick={onBack} style={{
              width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D5D8DC",
              background: "#fff", color: "#1F4E79", fontSize: 13, fontWeight: 600,
              cursor: "pointer", marginTop: 10,
            }}>&larr; Back to Submission Form</button>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── MAIN APP ───
function App() {
  const [view, setView] = useState("submit");
  const [tab, setTab] = useState("overview");
  const [authed, setAuthed] = useState(false);
  const [sops, setSops] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [governance, setGovernance] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [s, sub, ses, act, gov] = await Promise.all([
        supabase.select("sops", "order=id"),
        supabase.select("sop_submissions", "order=submitted_at.desc"),
        supabase.select("captains_table_sessions", "order=session_date.desc"),
        supabase.select("action_items", "order=created_at.desc"),
        supabase.select("governance_items", "order=created_at"),
      ]);
      setSops(s); setSubmissions(sub); setSessions(ses); setActions(act); setGovernance(gov);
      setError(null);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalSOPs = sops.length;
  const totalSubmitted = submissions.length;
  const totalRefined = submissions.filter(s => s.status === "refined" || s.status === "approved").length;
  const totalApproved = submissions.filter(s => s.status === "approved").length;
  const overallPct = totalSOPs > 0 ? Math.round((totalRefined / totalSOPs) * 100) : 0;

  const deptStats = useMemo(() => {
    const d: Record<string, any> = {};
    sops.forEach(sop => {
      if (!d[sop.department]) d[sop.department] = { total: 0, submitted: 0, refined: 0, approved: 0, color: DEPT_COLORS[sop.department] };
      d[sop.department].total++;
      const sub = submissions.find(s => s.sop_id === sop.id);
      if (sub) {
        d[sop.department].submitted++;
        if (sub.status === "refined" || sub.status === "approved") d[sop.department].refined++;
        if (sub.status === "approved") d[sop.department].approved++;
      }
    });
    return d;
  }, [sops, submissions]);

  const milestones = [
    { label: "Field Staff Onboarding", target: "Sep 2026", days: Math.max(0, Math.ceil((new Date("2026-09-01").getTime() - new Date().getTime()) / 86400000)) },
    { label: "Construction SPV", target: "Jan 2027", days: Math.max(0, Math.ceil((new Date("2027-01-01").getTime() - new Date().getTime()) / 86400000)) },
    { label: "Christmas Checkpoint", target: "Dec 2026", days: Math.max(0, Math.ceil((new Date("2026-12-25").getTime() - new Date().getTime()) / 86400000)) },
  ];

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "Arial", color: "#999" }}>Loading SBL Playbook Tracker...</div>;
  if (error) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "Arial", color: "#C0392B", flexDirection: "column", gap: 8 }}><div style={{ fontSize: 16, fontWeight: 600 }}>Connection Error</div><div style={{ fontSize: 13 }}>{error}</div><div style={{ fontSize: 12, color: "#999" }}>Check Supabase URL and API key</div></div>;

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      {authed && (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000, display: "flex", gap: 8 }}>
          {["dashboard", "submit"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "10px 16px", borderRadius: 8, border: "none",
              background: view === v ? "#1F4E79" : "#fff", color: view === v ? "#fff" : "#1F4E79",
              fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              textTransform: "capitalize",
            }}>{v === "submit" ? "Submit Form" : "Dashboard"}</button>
          ))}
        </div>
      )}

      {view === "submit" ? (
        <>
          <SubmissionForm sops={sops} onSubmitted={loadData} />
          {!authed && (
            <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
              <button onClick={() => setView("pin")} style={{
                padding: "10px 18px", borderRadius: 8, border: "none",
                background: "#1F4E79", color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", gap: 6,
              }}>🔒 Admin Login</button>
            </div>
          )}
        </>
      ) : view === "pin" ? (
        <PinGate onSuccess={() => { setAuthed(true); setView("dashboard"); }} onBack={() => setView("submit")} />
      ) : !authed ? (
        <PinGate onSuccess={() => { setAuthed(true); setView("dashboard"); }} onBack={() => setView("submit")} />
      ) : (
        <div style={{ background: "#F7F8FA", minHeight: "100vh" }}>
          <div style={{ background: "linear-gradient(135deg, #1F4E79 0%, #2E75B6 100%)", padding: "20px 28px", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>SBL Playbook Dashboard</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                  Live Progress · {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 40, fontWeight: 700 }}>{overallPct}%</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>REFINED</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              {milestones.map(m => (
                <div key={m.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "8px 14px", flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{m.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{m.target} <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6 }}>({m.days}d)</span></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #E8E8E8", padding: "0 28px" }}>
            {["overview", "pipeline", "governance", "captains_table"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "12px 16px", fontSize: 13, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
                color: tab === t ? "#1F4E79" : "#999", borderBottom: tab === t ? "2px solid #1F4E79" : "2px solid transparent",
              }}>{t === "captains_table" ? "Captain's Table" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>

          <div style={{ padding: "20px 28px", maxWidth: 960 }}>
            {tab === "overview" && (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <StatCard label="Total SOPs" value={totalSOPs} sub="7 departments" />
                  <StatCard label="Submitted" value={totalSubmitted} sub={`of ${totalSOPs}`} />
                  <StatCard label="Refined" value={totalRefined} sub={`of ${totalSOPs}`} />
                  <StatCard label="Approved" value={totalApproved} sub={`of ${totalSOPs}`} />
                </div>

                <Card title="Department Progress">
                  {Object.entries(deptStats).map(([dept, d]: any) => (
                    <div key={dept} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{dept}</span>
                        <Badge label={d.approved === d.total ? "Codified" : d.submitted > 0 ? "In Progress" : "Brief Delivered"}
                          bg={d.approved === d.total ? "#D5F5E3" : d.submitted > 0 ? "#FEF9E7" : "#D6EAF8"}
                          color={d.approved === d.total ? "#1E8449" : d.submitted > 0 ? "#B7950B" : "#2471A3"} />
                      </div>
                      <ProgressBar value={d.refined} max={d.total} color={d.color} />
                    </div>
                  ))}
                </Card>

                <Card title="SOP Pipeline">
                  <div style={{ display: "flex", gap: 4 }}>
                    {PIPELINE_STAGES.map(stage => {
                      const count = stage.key === "not_started" ? totalSOPs - totalSubmitted : submissions.filter(s => s.status === stage.key).length;
                      return (
                        <div key={stage.key} style={{ flex: Math.max(count, 2), background: stage.color, borderRadius: 4, padding: "14px 6px", textAlign: "center", transition: "flex 0.5s ease" }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: stage.text }}>{count}</div>
                          <div style={{ fontSize: 9, color: stage.text, opacity: 0.8 }}>{stage.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </>
            )}

            {tab === "pipeline" && (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D5D8DC", fontSize: 13, fontFamily: "Arial" }}>
                    <option value="all">All Departments</option>
                    {Object.keys(DEPT_COLORS).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span style={{ fontSize: 11, color: "#AAA" }}>Click a status badge to advance it through the pipeline</span>
                </div>
                <Card title={`SOPs — ${filterDept === "all" ? "All Departments" : filterDept}`}>
                  {sops.filter(s => filterDept === "all" || s.department === filterDept).map((sop, i, arr) => {
                    const sub = submissions.find(s => s.sop_id === sop.id);
                    const status = sub ? sub.status : "not_started";
                    const stages = ["submitted", "under_review", "refined", "approved"];
                    const canAdvance = sub && status !== "approved";
                    const canRevert = sub && stages.indexOf(status) > 0;
                    const advanceStatus = async () => {
                      if (!sub || status === "approved") return;
                      const idx = stages.indexOf(status);
                      const next = stages[Math.min(idx + 1, stages.length - 1)];
                      if (next === status) return;
                      try {
                        await supabase.update("sop_submissions", sub.id, { status: next, reviewed_at: next === "approved" ? new Date().toISOString() : sub.reviewed_at });
                        loadData();
                      } catch (e) { alert("Status update failed"); }
                    };
                    const revertStatus = async () => {
                      if (!sub) return;
                      const idx = stages.indexOf(status);
                      if (idx <= 0) return;
                      const prev = stages[idx - 1];
                      try {
                        await supabase.update("sop_submissions", sub.id, { status: prev, reviewed_at: null });
                        loadData();
                      } catch (e) { alert("Status update failed"); }
                    };
                    return (
                      <div key={sop.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: DEPT_COLORS[sop.department], marginRight: 8 }}>{sop.id}</span>
                          <span style={{ fontSize: 13 }}>{sop.title}</span>
                          <span style={{ fontSize: 11, color: "#AAA", marginLeft: 8 }}>{sop.owner}</span>
                          {sub && sub.loom_url && (
                            <a href={sub.loom_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#3498DB", marginLeft: 8, textDecoration: "none" }}>Watch Loom</a>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {canRevert && (
                            <button onClick={revertStatus} title="Move back one stage" style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #E8E8E8", background: "#fff", color: "#AAA", fontSize: 11, cursor: "pointer", lineHeight: 1 }}>&larr;</button>
                          )}
                          <span onClick={canAdvance ? advanceStatus : undefined} style={{ cursor: canAdvance ? "pointer" : "default" }} title={canAdvance ? "Click to advance status" : ""}>
                            <StatusBadge status={status} />
                          </span>
                          {canAdvance && (
                            <button onClick={advanceStatus} title="Advance to next stage" style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #E8E8E8", background: "#fff", color: "#AAA", fontSize: 11, cursor: "pointer", lineHeight: 1 }}>&rarr;</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </>
            )}

            {tab === "governance" && (() => {
              const govStages = ["pending", "in_progress", "complete"];
              const cycleGovStatus = async (item: any) => {
                const idx = govStages.indexOf(item.status);
                const next = govStages[(idx + 1) % govStages.length];
                try {
                  await supabase.update("governance_items", item.id, { status: next });
                  loadData();
                } catch (e) { alert("Status update failed"); }
              };
              const pendingItems = governance.filter(g => g.status === "pending");
              const inProgressItems = governance.filter(g => g.status === "in_progress");
              const completedItems = governance.filter(g => g.status === "complete");
              return (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "#AAA" }}>Click a status badge to cycle: Pending → In Progress → Complete → Pending</span>
                  </div>
                  {pendingItems.length > 0 && (
                    <Card title={`Awaiting Decision (${pendingItems.length})`} accent="#E74C3C">
                      {pendingItems.map((g, i) => (
                        <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < pendingItems.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{g.title}</div>
                            {g.description && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{g.description}</div>}
                            {g.owner && <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>{g.owner}</div>}
                          </div>
                          <span onClick={() => cycleGovStatus(g)} style={{ cursor: "pointer" }} title="Click to advance"><StatusBadge status={g.status} /></span>
                        </div>
                      ))}
                    </Card>
                  )}
                  {inProgressItems.length > 0 && (
                    <Card title={`In Progress (${inProgressItems.length})`} accent="#E67E22">
                      {inProgressItems.map((g, i) => (
                        <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < inProgressItems.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{g.title}</div>
                            {g.description && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{g.description}</div>}
                            {g.owner && <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>{g.owner}</div>}
                          </div>
                          <span onClick={() => cycleGovStatus(g)} style={{ cursor: "pointer" }} title="Click to advance"><StatusBadge status={g.status} /></span>
                        </div>
                      ))}
                    </Card>
                  )}
                  {completedItems.length > 0 && (
                    <Card title={`Completed (${completedItems.length})`} accent="#27AE60">
                      {completedItems.map((g, i) => (
                        <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < completedItems.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#AAA" }}>{g.title}</div>
                            {g.owner && <div style={{ fontSize: 11, color: "#CCC", marginTop: 2 }}>{g.owner}</div>}
                          </div>
                          <span onClick={() => cycleGovStatus(g)} style={{ cursor: "pointer" }} title="Click to revert"><StatusBadge status={g.status} /></span>
                        </div>
                      ))}
                    </Card>
                  )}
                </>
              );
            })()}

            {tab === "captains_table" && (
              <CaptainsTable sessions={sessions} actions={actions} onRefresh={loadData} />
            )}
          </div>

          <div style={{ padding: "12px 28px", fontSize: 11, color: "#BBB", textAlign: "center", borderTop: "1px solid #F0F0F0", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <span>SBL Playbook Tracker · The Frontline Legacy Association · Managed by Curtis Tofa</span>
            <button onClick={() => { setAuthed(false); setView("submit"); }} style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 4, color: "#CCC", fontSize: 10, cursor: "pointer", padding: "2px 8px" }}>Lock</button>
          </div>
        </div>
      )}
    </div>
  );
}
