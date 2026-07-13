import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/page-header";
import { QuickSubmitForm } from "@/components/quick-submit-form";
import { useRequiredClient } from "@/lib/client-context";
import { useAuth } from "@/lib/auth-context";
import { usePlaybooks } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Playbook } from "@/lib/types";

export const Route = createFileRoute("/_app/submit")({
  component: SubmitPage,
  head: () => ({ meta: [{ title: "Submit a Playbook — Command Overlay" }] }),
});

function SubmitPage() {
  const { client } = useRequiredClient();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[640px]">
      <PageHeader
        eyebrow={`${client.name} · Intake`}
        title="Submit a Playbook"
        subtitle="Pick your name, paste your Loom link, ship it. Lands in the SOP pipeline as Submitted."
      />
      <Panel>
        <QuickSubmitForm />
      </Panel>
      <MySubmissions />
      <p className="text-[11px] text-muted-foreground">
        Need to edit details, add code, or change status? Open the entry on the{" "}
        <a href="/sops" className="text-primary hover:underline">SOPs board</a>.
      </p>
    </div>
  );
}

const STATUS_LABELS: Record<Playbook["status"], string> = {
  not_started: "Not started",
  submitted: "Submitted",
  under_review: "Under review",
  refined: "Refined",
  approved: "Approved",
};

const STATUS_CLASSES: Record<Playbook["status"], string> = {
  not_started: "border-border text-muted-foreground",
  submitted: "border-primary/60 text-primary",
  under_review: "border-primary/60 text-primary",
  refined: "border-primary/60 text-primary",
  approved: "border-[#2B4F17] text-[#5a8a3c]",
};

/**
 * The submitter's own trail — every playbook THEY shipped (submitted_by = the
 * authed user), newest first, with where each sits in the review pipeline.
 * Attribution only exists from the 20260713 migration onward, so submissions
 * made before it won't appear here (they have no reliable submitter signal).
 */
function MySubmissions() {
  const { client } = useRequiredClient();
  const { user } = useAuth();
  const { data: playbooks = [] } = usePlaybooks(client.id);

  const mine = playbooks
    .filter((p) => p.submitted_by && p.submitted_by === user?.id)
    .sort((a, b) => (b.submitted_at ?? b.updated_at).localeCompare(a.submitted_at ?? a.updated_at));

  if (mine.length === 0) return null;

  return (
    <Panel>
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Your submissions</h2>
          <p className="text-[11px] text-muted-foreground">
            What you&apos;ve shipped and where it sits in review.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {mine.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <span
                className={cn(
                  "shrink-0 rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  STATUS_CLASSES[p.status],
                )}
              >
                {STATUS_LABELS[p.status]}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {p.code ? `${p.code} · ` : ""}{p.title}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {new Date(p.submitted_at ?? p.updated_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
