import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "./types";

export type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);
