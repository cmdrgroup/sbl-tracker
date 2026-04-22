import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { CommandOverlay } from "@/components/command-overlay";
import { AuthProvider } from "@/components/auth-provider";
import { LoginScreen } from "@/components/login-screen";
import { useAuth } from "@/lib/auth-context";
import { ClientContext } from "@/lib/client-context";
import { useClients } from "@/lib/hooks";
import type { Client } from "@/lib/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      retry: 1,
    },
  },
});

export const Route = createFileRoute("/_app")({
  component: AppWrapper,
});

// Outer wrapper: provides QueryClient + Auth
function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Auth gate: shows login or the app
function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <div className="mb-3 text-sm font-medium tracking-[0.3em] text-white/40 uppercase">
            CMDR · Group
          </div>
          <div className="text-lg font-semibold text-white/60">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AppWithClients />;
}

// Inner app: loads clients from Supabase, provides context
function AppWithClients() {
  const { data: clientList = [], isLoading } = useClients();
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Set initial client once loaded
  useEffect(() => {
    if (clientList.length > 0 && !activeClient) {
      // TODO: In production, derive from subdomain
      // const hostname = window.location.hostname;
      // const slug = hostname.split(".")[0];
      // const match = clientList.find((c) => c.slug === slug);
      // setActiveClient(match ?? clientList[0]);
      setActiveClient(clientList[0]);
    }
  }, [clientList, activeClient]);

  if (isLoading || !activeClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="text-lg font-semibold text-white/60">
          Loading client...
        </div>
      </div>
    );
  }

  return (
    <ClientContext.Provider
      value={{
        client: activeClient,
        clients: clientList,
        setClient: setActiveClient,
        loading: isLoading,
      }}
    >
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
