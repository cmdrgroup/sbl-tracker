import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthContext } from "@/lib/auth-context";
import type { UserProfile } from "@/lib/types";
import { isDevBypassHost, DEV_MOCK_USER, DEV_MOCK_PROFILE } from "@/lib/dev-bypass";

export function AuthProvider({ children }: { children: ReactNode }) {
  const devBypass = isDevBypassHost();
  const [user, setUser] = useState<User | null>(devBypass ? DEV_MOCK_USER : null);
  const [profile, setProfile] = useState<UserProfile | null>(devBypass ? DEV_MOCK_PROFILE : null);
  const [loading, setLoading] = useState(!devBypass);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  }, []);

  useEffect(() => {
    if (devBypass) return;
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
