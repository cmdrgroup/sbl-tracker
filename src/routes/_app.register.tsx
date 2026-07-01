import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Printer, Copy, Play, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { usePlaybooks, useWorkstreams } from "@/lib/hooks";
import { useRequiredClient } from "@/lib/client-context";
import type { Playbook, Workstream } from "@/lib/types";

export const Route = createFileRoute("/_app/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "SOP Register — Command Overlay" }] }),
});

type Group = { id: string; name: string; sops: Playbook[] };

function buildGroups(playbooks: Playbook[], workstreams: Workstream[]): Group[] {
  const approved = playbooks.filter((p) => p.status === "approved");
  const byCode = (a: Playbook, b: Playbook) =>
    (a.code ?? a.title).localeCompare(b.code ?? b.title);

  const groups: Group[] = workstreams
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((w) => ({
      id: w.id,
      name: w.name,
      sops: approved.filter((p) => p.workstream_id === w.id).sort(byCode),
    }));

  const unassigned = approved.filter((p) => !p.workstream_id).sort(byCode);
  if (unassigned.length) groups.push({ id: "__none__", name: "Unassigned", sops: unassigned });

  return groups.filter((g) => g.sops.length > 0);
}

function toMarkdown(clientName: string, dateStr: string, groups: Group[], total: number): string {
  const lines: string[] = [`# ${clientName} — SOP Register`, `_${dateStr} · ${total} approved SOPs_`, ""];
  for (const g of groups) {
    lines.push(`## ${g.name}`);
    for (const s of g.sops) {
      const code = s.code ? `**${s.code}** ` : "";
      lines.push(`- ${code}${s.title}${s.owner_name ? ` — ${s.owner_name}` : ""} (${s.type})`);
      if (s.loom_url) lines.push(`  - Loom: ${s.loom_url}`);
      if (s.scribe_url) lines.push(`  - Scribe: ${s.scribe_url}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function RegisterPage() {
  const { client } = useRequiredClient();
  const { data: playbooks = [] } = usePlaybooks(client.id);
  const { data: workstreams = [] } = useWorkstreams(client.id);

  const groups = useMemo(() => buildGroups(playbooks, workstreams), [playbooks, workstreams]);
  const total = useMemo(() => groups.reduce((n, g) => n + g.sops.length, 0), [groups]);

  // Stable, locale-formatted date (no Date.now in render path beyond first paint).
  const dateStr = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(client.name, dateStr, groups, total));
      toast.success("Copied", { description: "SOP register copied as Markdown — paste into Notion, Drive, etc." });
    } catch {
      toast.error("Copy failed", { description: "Your browser blocked clipboard access." });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] print-doc">
      <PageHeader
        eyebrow={`${client.name} · Finalised`}
        title="SOP Register"
        subtitle={`${total} approved SOP${total === 1 ? "" : "s"} · ${dateStr}. Print to PDF or copy as Markdown to store anywhere.`}
        actions={
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={copyMarkdown}
              className="px-3 py-1.5 rounded-md bg-secondary/60 border border-border text-[12px] font-medium flex items-center gap-1.5 hover:bg-secondary"
            >
              <Copy className="h-3.5 w-3.5" /> Copy as Markdown
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
            </button>
          </div>
        }
      />

      {total === 0 ? (
        <div className="bg-card border border-border rounded-md p-6 text-[13px] text-muted-foreground">
          No approved SOPs yet. Once SOPs reach <span className="text-foreground">Approved</span> in the pipeline, they'll
          appear here as your finalised register.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.id} className="space-y-2">
              <div className="flex items-baseline gap-2 border-b border-border pb-1.5">
                <h2 className="font-display text-[18px] md:text-[20px] font-semibold uppercase tracking-[0.04em]">{g.name}</h2>
                <span className="text-[11px] font-mono text-muted-foreground">{g.sops.length}</span>
              </div>
              <div className="divide-y divide-border">
                {g.sops.map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        {s.code && <span className="text-[11px] font-mono text-primary shrink-0">{s.code}</span>}
                        <span className="text-[13px] font-medium">{s.title}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {s.owner_name ?? "—"} · <span className="capitalize">{s.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] shrink-0 whitespace-nowrap">
                      {s.loom_url && (
                        <a href={s.loom_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Play className="h-3 w-3" /> Loom
                        </a>
                      )}
                      {s.scribe_url && (
                        <a href={s.scribe_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <FileText className="h-3 w-3" /> Scribe
                        </a>
                      )}
                      {!s.loom_url && !s.scribe_url && <span className="text-muted-foreground">no link</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
