import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CommandOverlay } from "@/components/command-overlay";
import { Dashboard } from "@/components/dashboard";
import { clients } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      { title: "Command Overlay — Operational Picture for Fractional COS" },
      { name: "description", content: "Multi-tenant operational platform: playbook tracking, SOPs, coaching logs, accountability — for the fractional Chief of Staff." },
    ],
  }),
});

function App() {
  const [activeClient, setActiveClient] = useState(clients[0]);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <AppShell
        activeClient={activeClient}
        onClientChange={setActiveClient}
        onOpenCommand={() => setCmdOpen(true)}
      >
        <Dashboard client={activeClient} />
      </AppShell>
      <CommandOverlay open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
