import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureBootstrap, getCurrentProfile } from "@/lib/profile";

export type SystemUpdateStatus = "maintenance" | "offline" | "degraded" | "info" | "resolved";

export type SystemUpdate = {
  id: string;
  title: string;
  body: string;
  status: SystemUpdateStatus;
  affected_area: string | null;
  icon: string;
  color: string;
  action_label: string | null;
  action_route: string | null;
  created_at: string;
  updated_at: string;
  expected_return_at: string | null;
  related_update_id: string | null;
};

type ReadDiagnostic = { action: string; profileId: string | null; updateId?: string; result: string; code?: string; message?: string; at: string } | null;
type Snapshot = { updates: SystemUpdate[]; readIds: Set<string>; loading: boolean; profileId: string | null; readDiagnostic: ReadDiagnostic };

let updates: SystemUpdate[] = [];
let readIds = new Set<string>();
let activeProfile: string | null = null;
let loading = true;
let readDiagnostic: ReadDiagnostic = null;
let snapshot: Snapshot = { updates, readIds, loading, profileId: activeProfile, readDiagnostic };
const serverSnapshot: Snapshot = { updates: [], readIds: new Set<string>(), loading: true, profileId: null, readDiagnostic: null };
const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | null = null;
let initSequence = 0;

function emit() {
  snapshot = { updates, readIds, loading, profileId: activeProfile, readDiagnostic };
  listeners.forEach((listener) => listener());
}

async function fetchUpdates() {
  const { data, error } = await supabase
    .from("system_updates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  updates = (data ?? []) as SystemUpdate[];
}

async function fetchReads(profileId: string) {
  const { data, error } = await supabase
    .from("system_update_reads")
    .select("update_id")
    .eq("profile_id", profileId);
  if (error) throw error;
  readIds = new Set((data ?? []).map((row) => row.update_id));
}

export async function initSystemUpdates() {
  if (typeof window === "undefined") return;
  const sequence = ++initSequence;
  loading = true;
  emit();
  try {
    // O perfil é resolvido de forma assíncrona pelo Supabase Auth.
    // Nunca carregar leituras antes de concluir essa vinculação.
    await ensureBootstrap();
    const profile = getCurrentProfile();
    const profileId = profile?.id ?? null;
    if (sequence !== initSequence) return;
    activeProfile = profileId;
    readIds = new Set();
    await fetchUpdates();
    if (profileId) await fetchReads(profileId);
    if (sequence !== initSequence) return;
  } catch (error) {
    console.error("[airi] system updates load failed", error);
  } finally {
    if (sequence === initSequence) {
      loading = false;
      emit();
    }
  }

  if (sequence !== initSequence) return;
  if (channel) void supabase.removeChannel(channel);
  channel = supabase
    .channel("system-updates-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "system_updates" }, () => {
      void fetchUpdates().then(emit).catch((error) => console.error("[airi] system updates refresh failed", error));
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "system_update_reads" }, () => {
      const profileId = activeProfile;
      if (!profileId) return;
      void fetchReads(profileId).then(emit).catch((error) => console.error("[airi] system reads refresh failed", error));
    })
    .subscribe();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSystemUpdates() {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}

export function useSystemUpdatesUnread() {
  const state = useSystemUpdates();
  return state.updates.filter((update) => !state.readIds.has(update.id)).length;
}

function setReadDiagnostic(value: NonNullable<ReadDiagnostic>) {
  readDiagnostic = value;
  emit();
}

function errorMessage(error: { code?: string; message?: string; details?: string; hint?: string }) {
  return [error.message, error.details, error.hint].filter(Boolean).join(" | ");
}

export async function markSystemUpdateRead(updateId: string) {
  await ensureBootstrap();
  const profile = getCurrentProfile();
  if (!profile) {
    setReadDiagnostic({ action: "Leitura individual", profileId: null, updateId, result: "Perfil não identificado após ensureBootstrap", at: new Date().toISOString() });
    return;
  }
  if (readIds.has(updateId)) {
    setReadDiagnostic({ action: "Leitura individual", profileId: profile.id, updateId, result: "Esta leitura já estava registrada no estado local", at: new Date().toISOString() });
    return;
  }
  setReadDiagnostic({ action: "Leitura individual", profileId: profile.id, updateId, result: "Enviando INSERT ao Supabase…", at: new Date().toISOString() });
  const previous = readIds;
  readIds = new Set(readIds).add(updateId);
  emit();
  const { error } = await supabase
    .from("system_update_reads")
    .insert({ update_id: updateId, profile_id: profile.id });
  if (error && error.code !== "23505") {
    readIds = previous;
    setReadDiagnostic({ action: "Leitura individual", profileId: profile.id, updateId, result: "ERRO ao gravar", code: error.code, message: errorMessage(error), at: new Date().toISOString() });
    console.error("[airi] system update read failed", error);
    return;
  }
  setReadDiagnostic({ action: "Leitura individual", profileId: profile.id, updateId, result: error?.code === "23505" ? "Registro já existia (duplicado)" : "INSERT confirmado pelo Supabase", code: error?.code, at: new Date().toISOString() });
}

export async function markAllSystemUpdatesRead() {
  await ensureBootstrap();
  const profile = getCurrentProfile();
  if (!profile) {
    setReadDiagnostic({ action: "Marcar tudo", profileId: null, result: "Perfil não identificado após ensureBootstrap", at: new Date().toISOString() });
    return;
  }
  const unread = updates.filter((update) => !readIds.has(update.id));
  if (!unread.length) {
    setReadDiagnostic({ action: "Marcar tudo", profileId: profile.id, result: "Não havia comunicados não lidos no estado local", at: new Date().toISOString() });
    return;
  }
  setReadDiagnostic({ action: "Marcar tudo", profileId: profile.id, result: `Enviando INSERT de ${unread.length} leitura(s)…`, at: new Date().toISOString() });
  const previous = readIds;
  const next = new Set(readIds);
  unread.forEach((update) => next.add(update.id));
  readIds = next;
  emit();
  const { error } = await supabase.from("system_update_reads").insert(
    unread.map((update) => ({ update_id: update.id, profile_id: profile.id })),
  );
  if (error && error.code !== "23505") {
    readIds = previous;
    setReadDiagnostic({ action: "Marcar tudo", profileId: profile.id, result: "ERRO ao gravar", code: error.code, message: errorMessage(error), at: new Date().toISOString() });
    console.error("[airi] system updates read-all failed", error);
    return;
  }
  setReadDiagnostic({ action: "Marcar tudo", profileId: profile.id, result: error?.code === "23505" ? "Conflito de duplicidade no lote" : "INSERT confirmado pelo Supabase", code: error?.code, at: new Date().toISOString() });
}

export async function createSystemUpdate(input: Omit<SystemUpdate, "id" | "created_at" | "updated_at">) {
  const { error } = await supabase.from("system_updates").insert(input);
  if (error) throw error;
  await fetchUpdates();
  emit();
}

export async function updateSystemUpdate(id: string, input: Partial<Omit<SystemUpdate, "id" | "created_at" | "updated_at">>) {
  const { error } = await supabase.from("system_updates").update(input).eq("id", id);
  if (error) throw error;
  await fetchUpdates();
  emit();
}

export async function deleteSystemUpdate(id: string) {
  const { error } = await supabase.from("system_updates").delete().eq("id", id);
  if (error) throw error;
  await fetchUpdates();
  emit();
}
