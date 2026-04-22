import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { useRequiredClient } from "@/lib/client-context";

export const Route = createFileRoute("/_app/")({
  component: IndexPage,
  head: () => ({
    meta: [
      { title: "Overview — Command Overlay" },
      { name: "description", content: "Multi-tenant operational picture for fractional COS." },
    ],
  }),
});

function IndexPage() {
  const { client } = useRequiredClient();
  return <Dashboard client={client} />;
}
