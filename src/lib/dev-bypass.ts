import type { User } from "@supabase/supabase-js";
import type { Client, Staff, UserProfile } from "./types";
import { STAFF_MEMBERS } from "./staff";

/**
 * Returns true when running in the Lovable preview/editor or localhost.
 * Production domains (e.g. sbl-tracker.lovable.app) should return false so
 * real auth is enforced.
 */
export function isDevBypassHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  // Lovable preview/sandbox subdomains: id-preview--*.lovable.app,
  // *--*.lovable.app, lovableproject.com, etc. Exclude the published
  // production hostname so real auth still applies there.
  if (host === "sbl-tracker.lovable.app") return false;
  if (host.endsWith(".lovable.app")) return true;
  if (host.endsWith(".lovableproject.com")) return true;
  return false;
}

export const DEV_MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000dev",
  email: "dev@lovable.preview",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

export const DEV_MOCK_PROFILE: UserProfile = {
  id: DEV_MOCK_USER.id,
  full_name: "Preview User",
  email: DEV_MOCK_USER.email!,
  role: "commander",
  avatar_url: null,
  created_at: new Date().toISOString(),
};

export const DEV_MOCK_CLIENTS: Client[] = [
  {
    id: "00000000-0000-0000-0000-0000000c1ient",
    name: "SBL Solutions (Preview)",
    slug: "sbl",
    industry: "Construction Services",
    color: "oklch(0.62 0.22 280)",
    health_score: 87,
    timezone: "Australia/Sydney",
    week_start: "monday",
    coaching_cadence: "weekly",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEV_MOCK_STAFF: Staff[] = STAFF_MEMBERS.map((name, i) => ({
  id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
  name,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));
