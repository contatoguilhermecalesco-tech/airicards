// Global app settings (admin-controlled). Synced via Supabase realtime.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppSettings = {
  exam_visible: boolean;
};

const DEFAULTS: AppSettings = {
  exam_visible: false,
};

let state: AppSettings = { ...DEFAULTS };
const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

let bootstrapped = false;
let channel: ReturnType<typeof supabase.channel> | null = null;

async function fetchAll() {
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error || !data) return;
  const next: AppSettings = { ...DEFAULTS };
  for (const row of data) {
    if (row.key === "exam_visible") {
      next.exam_visible = row.value === true || row.value === "true";
    }
  }
  state = next;
  emit();
}

function ensureBootstrap() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  void fetchAll();
  channel = supabase
    .channel("app_settings-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_settings" },
      () => void fetchAll(),
    )
    .subscribe();
}

export function useAppSettings(): AppSettings {
  ensureBootstrap();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => DEFAULTS,
  );
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value: value as never, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
  state = { ...state, [key]: value };
  emit();
}

export { channel as __appSettingsChannel };
