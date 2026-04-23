import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/page-header";
import { QuickSubmitForm } from "@/components/quick-submit-form";
import { useRequiredClient } from "@/lib/client-context";

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
      <p className="text-[11px] text-muted-foreground">
        Need to edit details, add code, or change status? Open the entry on the{" "}
        <a href="/sops" className="text-primary hover:underline">SOPs board</a>.
      </p>
    </div>
  );
}
