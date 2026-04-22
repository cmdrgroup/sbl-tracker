import { createContext, useContext } from "react";
import { clients, type Client } from "./demo-data";

export const ClientContext = createContext<{
  client: Client;
  setClient: (c: Client) => void;
}>({
  client: clients[0],
  setClient: () => {},
});

export const useActiveClient = () => useContext(ClientContext);
