import { createContext, useContext } from "react";
import type { Client } from "./types";

export const ClientContext = createContext<{
  client: Client | null;
  clients: Client[];
  setClient: (c: Client) => void;
  loading: boolean;
}>({
  client: null,
  clients: [],
  setClient: () => {},
  loading: true,
});

export const useActiveClient = () => useContext(ClientContext);

/** Use inside routes that are guaranteed to have a client loaded (behind the _app guard) */
export function useRequiredClient() {
  const ctx = useContext(ClientContext);
  if (!ctx.client) throw new Error("useRequiredClient used outside of a loaded client context");
  return { ...ctx, client: ctx.client };
}
