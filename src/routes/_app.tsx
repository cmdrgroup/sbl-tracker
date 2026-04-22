import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CommandOverlay } from "@/components/command-overlay";
import { clients, type Client } from "@/lib/demo-data";
import { ClientContext } from "@/lib/client-context";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [activeClient, setActiveClient] = useState<Client>(clients[0]);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <ClientContext.Provider value={{ client: activeClient, setClient: setActiveClient }}>
      <AppShell
        activeClient={activeClient}
        onClientChange={setActiveClient}
        onOpenCommand={() => setCmdOpen(true)}
      >
        <Outlet />
      </AppShell>
      <CommandOverlay open={cmdOpen} onOpenChange={setCmdOpen} />
    </ClientContext.Provider>
  );
}
