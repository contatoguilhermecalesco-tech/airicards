// Global app settings (admin-controlled). Synced via Supabase realtime.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppSettings = {
  exam_visible: boolean;
  /** Controle admin do Desafio Relâmpago. */
  lightning: LightningControl;
};

export type LightningMode = "auto" | "open" | "closed";
export type LightningControl = { mode: LightningMode; releasedAt: number };
const LIGHTNING_DEFAULT: LightningControl = { mode: "auto", releasedAt: 0 };

function parseLightning(v: unknown): LightningControl {
  if (!v || typeof v !== "object") return { ...LIGHTNING_DEFAULT };
  const o = v as Record<string, unknown>;
  const mode = o.mode === "open" || o.mode === "closed" ? o.mode : "auto";
  const releasedAt = typeof o.releasedAt === "number" ? o.releasedAt : 0;
  return { mode, releasedAt };
}

const DEFAULTS: AppSettings = {
  exam_visible: false,
  lightning: { mode: "auto", releasedAt: 0 },
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
    } else if (row.key === "lightning") {
      next.lightning = parseLightning(row.value);
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
