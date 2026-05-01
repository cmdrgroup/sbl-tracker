import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { resolveWorkstreamOwner } from "./staff";
import { isDevBypassHost, DEV_MOCK_CLIENTS, DEV_MOCK_STAFF } from "./dev-bypass";
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
  Staff,
} from "./types";

// ─── CLIENTS ────────────────────────────────────────────────

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      if (isDevBypassHost()) return DEV_MOCK_CLIENTS;
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

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Client> }) => {
      if (isDevBypassHost()) {
        // Mutate the in-memory mock so changes persist for the preview session
        const idx = DEV_MOCK_CLIENTS.findIndex((c) => c.id === id);
        if (idx >= 0) {
          DEV_MOCK_CLIENTS[idx] = {
            ...DEV_MOCK_CLIENTS[idx],
            ...patch,
            updated_at: new Date().toISOString(),
          };
        }
        return;
      }
      const { error } = await supabase.from("clients").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      // Optimistically update the cached clients list so every consumer
      // (sidebar, header, active client context) reflects the new values
      // immediately — without waiting for refetch.
      qc.setQueryData<Client[]>(["clients"], (old) =>
        old?.map((c) => (c.id === vars.id ? { ...c, ...vars.patch } : c)),
      );
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
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

export function useUpdateWorkstream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Workstream, "name" | "owner_name" | "color" | "sort_order">>;
    }) => {
      const { data, error } = await supabase
        .from("workstreams")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Workstream;
    },
    onSuccess: (data) => {
      qc.setQueryData<Workstream[]>(["workstreams", data.client_id], (old) =>
        old?.map((w) => (w.id === data.id ? { ...w, ...data } : w)),
      );
      qc.invalidateQueries({ queryKey: ["workstreams", data.client_id] });
    },
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

export function useUpdateCoachingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decisions,
      ...patch
    }: Partial<Omit<CoachingLog, "decisions">> & {
      id: string;
      decisions?: string[];
    }) => {
      const { data: logData, error: logError } = await supabase
        .from("coaching_logs")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (logError) throw logError;

      // Replace decisions if provided (full overwrite)
      if (decisions !== undefined) {
        const { error: delErr } = await supabase
          .from("coaching_decisions")
          .delete()
          .eq("coaching_log_id", id);
        if (delErr) throw delErr;
        const cleaned = decisions.map((d) => d.trim()).filter(Boolean);
        if (cleaned.length) {
          const { error: insErr } = await supabase
            .from("coaching_decisions")
            .insert(cleaned.map((d) => ({ coaching_log_id: id, decision: d })));
          if (insErr) throw insErr;
        }
      }
      return logData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coaching_logs", data.client_id] });
    },
  });
}

export function useDeleteCoachingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      // Decisions and action_items.coaching_log_id should be set null/cascade by FK;
      // explicitly clear decisions to be safe.
      await supabase.from("coaching_decisions").delete().eq("coaching_log_id", id);
      const { error } = await supabase.from("coaching_logs").delete().eq("id", id);
      if (error) throw error;
      return { id, clientId };
    },
    onSuccess: ({ clientId }) => {
      queryClient.invalidateQueries({ queryKey: ["coaching_logs", clientId] });
      queryClient.invalidateQueries({ queryKey: ["action_items", clientId] });
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

// ─── STAFF ROSTER ──────────────────────────────────────────

export function useStaff() {
  return useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      if (isDevBypassHost()) return [...DEV_MOCK_STAFF].sort((a, b) => a.name.localeCompare(b.name));
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name is required");
      if (isDevBypassHost()) {
        const exists = DEV_MOCK_STAFF.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) throw new Error("That staff member already exists");
        const row: Staff = {
          id: crypto.randomUUID(),
          name: trimmed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        DEV_MOCK_STAFF.push(row);
        return row;
      }
      const { data, error } = await supabase
        .from("staff")
        .insert({ name: trimmed })
        .select()
        .single();
      if (error) throw error;
      return data as Staff;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useRenameStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, previousName }: { id: string; name: string; previousName: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name is required");
      if (isDevBypassHost()) {
        const idx = DEV_MOCK_STAFF.findIndex((s) => s.id === id);
        if (idx >= 0) {
          DEV_MOCK_STAFF[idx] = { ...DEV_MOCK_STAFF[idx], name: trimmed, updated_at: new Date().toISOString() };
        }
      } else {
        const { error } = await supabase
          .from("staff")
          .update({ name: trimmed, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        // Cascade rename to any workstreams currently owned by this person.
        const { error: wsErr } = await supabase
          .from("workstreams")
          .update({ owner_name: trimmed })
          .eq("owner_name", previousName);
        if (wsErr) throw wsErr;
      }
      return { id, name: trimmed, previousName };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["workstreams"] });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (isDevBypassHost()) {
        const idx = DEV_MOCK_STAFF.findIndex((s) => s.id === id);
        if (idx >= 0) DEV_MOCK_STAFF.splice(idx, 1);
        return { id, name };
      }
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
      // Unassign this person from any workstreams they currently lead.
      const { error: wsErr } = await supabase
        .from("workstreams")
        .update({ owner_name: null })
        .eq("owner_name", name);
      if (wsErr) throw wsErr;
      return { id, name };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["workstreams"] });
    },
  });
}
