import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { resolveWorkstreamOwner } from "./staff";
import type {
  Client,
  Workstream,
  Playbook,
  CoachingLog,
  CoachingDecision,
  ActionItem,
  ActivityFeedItem,
  AiBrief,
  ClientIntegration,
} from "./types";

// ─── CLIENTS ────────────────────────────────────────────────

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useClientBySlug(slug: string) {
  return useQuery<Client | null>({
    queryKey: ["clients", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

// ─── WORKSTREAMS ────────────────────────────────────────────

export function useWorkstreams(clientId: string) {
  return useQuery<Workstream[]>({
    queryKey: ["workstreams", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstreams")
        .select("*")
        .eq("client_id", clientId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((workstream) => ({
        ...workstream,
        owner_name: resolveWorkstreamOwner(workstream.name, workstream.owner_name),
      }));
    },
    enabled: !!clientId,
  });
}

// ─── PLAYBOOKS ──────────────────────────────────────────────

export function usePlaybooks(clientId: string) {
  return useQuery<Playbook[]>({
    queryKey: ["playbooks", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbooks")
        .select("*, workstream:workstreams(*)")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useCreatePlaybook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playbook: Omit<Playbook, "id" | "created_at" | "updated_at" | "workstream">) => {
      const { data, error } = await supabase
        .from("playbooks")
        .insert(playbook)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["playbooks", data.client_id] });
    },
  });
}

export function useUpdatePlaybook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Playbook> & { id: string }) => {
      const { data, error } = await supabase
        .from("playbooks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["playbooks", data.client_id] });
    },
  });
}

// ─── COACHING LOGS ──────────────────────────────────────────

export function useCoachingLogs(clientId: string) {
  return useQuery<CoachingLog[]>({
    queryKey: ["coaching_logs", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_logs")
        .select("*, decisions:coaching_decisions(*)")
        .eq("client_id", clientId)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useCreateCoachingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      decisions,
      ...log
    }: Omit<CoachingLog, "id" | "created_at" | "decisions"> & {
      decisions?: string[];
    }) => {
      // Insert the coaching log
      const { data: logData, error: logError } = await supabase
        .from("coaching_logs")
        .insert(log)
        .select()
        .single();
      if (logError) throw logError;

      // Insert decisions if any
      if (decisions?.length) {
        const decisionRows = decisions.map((d) => ({
          coaching_log_id: logData.id,
          decision: d,
        }));
        const { error: decError } = await supabase
          .from("coaching_decisions")
          .insert(decisionRows);
        if (decError) throw decError;
      }

      return logData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coaching_logs", data.client_id] });
    },
  });
}

// ─── ACTION ITEMS ───────────────────────────────────────────

export function useActionItems(clientId: string) {
  return useQuery<ActionItem[]>({
    queryKey: ["action_items", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_items")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useCreateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ActionItem, "id" | "created_at" | "completed_at">) => {
      const { data, error } = await supabase
        .from("action_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["action_items", data.client_id] });
    },
  });
}

export function useUpdateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ActionItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("action_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["action_items", data.client_id] });
    },
  });
}

// ─── ACTIVITY FEED ──────────────────────────────────────────

export function useActivityFeed(clientId: string) {
  return useQuery<ActivityFeedItem[]>({
    queryKey: ["activity_feed", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useInsertActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ActivityFeedItem, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("activity_feed")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activity_feed", data.client_id] });
    },
  });
}

// ─── AI BRIEFS ─────────────────────────────────────────────

export function useAiBriefs(clientId: string) {
  return useQuery<AiBrief[]>({
    queryKey: ["ai_briefs", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_briefs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useGenerateBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      client_id,
      brief_type = "weekly",
    }: {
      client_id: string;
      brief_type?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-brief", {
        body: { client_id, brief_type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { brief: string; id: string; signals_used: number; generated_at: string };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ai_briefs", vars.client_id] });
    },
  });
}

// ─── CLIENT INTEGRATIONS ───────────────────────────────────

export function useIntegrations(clientId: string) {
  return useQuery<ClientIntegration[]>({
    queryKey: ["integrations", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_integrations")
        .select("*")
        .eq("client_id", clientId)
        .order("provider");
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useUpsertIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      integration: Omit<ClientIntegration, "id" | "created_at" | "updated_at">
    ) => {
      const { data, error } = await supabase
        .from("client_integrations")
        .upsert(integration, { onConflict: "client_id,provider" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integrations", data.client_id] });
    },
  });
}
