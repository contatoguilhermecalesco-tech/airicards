// Profile store — agora ancorado em uma sessão Supabase real.
// Cada perfil ('guilherme' / 'arlayne') tem um PIN protegido no banco (bcrypt via
// pgcrypto) e é vinculado a um usuário anônimo do Supabase Auth através da função
// SECURITY DEFINER `link_profile(_profile_id, _pin)`. As RLS de todas as tabelas
// usam `current_profile_id()` para autorização — o app_id no cliente deixou de
// ser fonte de verdade e virou apenas conveniência de UI.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  name: string;
  gradient: string;
  initial: string;
};

export const PROFILES: Profile[] = [
  {
    id: "guilherme",
    name: "Guilherme",
    initial: "G",
    gradient:
      "linear-gradient(135deg, oklch(0.72 0.14 250), oklch(0.55 0.15 300))",
  },
  {
    id: "arlayne",
    name: "Arlayne",
    initial: "A",
    gradient:
      "linear-gradient(135deg, oklch(0.78 0.13 25), oklch(0.62 0.14 340))",
  },
];

const CACHE_KEY = "airi.profile.v2";

function isBrowser() {
  return typeof window !== "undefined";
}

// ---- Estado reativo em módulo (SSR-safe, hidrata no browser) ---------------

let currentProfile: Profile | null = null;
let hydrated = false;
let isAdminFlag = false;
let bootstrapping: Promise<void> | null = null;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

// Cache local só para evitar flicker em navegações — a autoridade continua
// sendo a sessão do Supabase + a função `current_profile_id()` no banco.
function readCache(): Profile | null {
  if (!isBrowser()) return null;
  try {
    const id = localStorage.getItem(CACHE_KEY);
    return PROFILES.find((p) => p.id === id) ?? null;
  } catch {
    return null;
  }
}
function writeCache(p: Profile | null) {
  if (!isBrowser()) return;
  try {
    if (p) localStorage.setItem(CACHE_KEY, p.id);
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    /* noop */
  }
}

async function fetchLinkedProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.rpc("current_profile_id");
  if (error || !data) return null;
  return PROFILES.find((p) => p.id === (data as string)) ?? null;
}

async function fetchAdminFlag(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}

async function bootstrap(): Promise<void> {
  if (!isBrowser()) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    currentProfile = null;
    isAdminFlag = false;
    writeCache(null);
    hydrated = true;
    emit();
    return;
  }
  const [p, admin] = await Promise.all([fetchLinkedProfile(), fetchAdminFlag()]);
  currentProfile = p;
  isAdminFlag = admin;
  writeCache(p);
  hydrated = true;
  emit();
}

export function ensureBootstrap(): Promise<void> {
  if (!isBrowser()) return Promise.resolve();
  if (hydrated) return Promise.resolve();
  if (!bootstrapping) bootstrapping = bootstrap();
  return bootstrapping;
}

if (isBrowser()) {
  // Cache leitura instantânea; ainda assim aguardamos o bootstrap real.
  currentProfile = readCache();
  void ensureBootstrap();
  supabase.auth.onAuthStateChange((event) => {
    if (
      event === "SIGNED_IN" ||
      event === "SIGNED_OUT" ||
      event === "USER_UPDATED" ||
      event === "TOKEN_REFRESHED"
    ) {
      bootstrapping = null;
      hydrated = false;
      void ensureBootstrap();
    }
  });
}

// ---- API pública -----------------------------------------------------------

export function getCurrentProfile(): Profile | null {
  return currentProfile;
}

export function isProfileHydrated(): boolean {
  return hydrated;
}

export function isCurrentAdmin(): boolean {
  return isAdminFlag;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function subscribeProfile(cb: () => void) {
  return subscribe(cb);
}

export function useCurrentProfile(): Profile | null {
  return useSyncExternalStore(
    subscribe,
    () => currentProfile,
    () => null,
  );
}

export function useIsAdmin(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isAdminFlag,
    () => false,
  );
}

export function useProfileHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

// Metadados dos perfis para a tela de escolha (nome + has_pin).
export type ProfileMeta = {
  id: string;
  displayName: string;
  hasPin: boolean;
  isLinked: boolean;
};

export async function listProfilesMeta(): Promise<ProfileMeta[]> {
  const { data, error } = await supabase.rpc("list_profiles");
  if (error || !data) {
    return PROFILES.map((p) => ({
      id: p.id,
      displayName: p.name,
      hasPin: false,
      isLinked: false,
    }));
  }
  return (data as Array<{
    id: string;
    display_name: string;
    has_pin: boolean;
    is_linked: boolean;
  }>).map((r) => ({
    id: r.id,
    displayName: r.display_name,
    hasPin: r.has_pin,
    isLinked: r.is_linked,
  }));
}

export type LinkResult =
  | { ok: true; createdPin: boolean }
  | { ok: false; error: "wrong_pin" | "invalid_pin" | "unknown" };

export async function linkProfile(
  id: string,
  pin: string,
): Promise<LinkResult> {
  if (!/^\d{4,8}$/.test(pin)) {
    return { ok: false, error: "invalid_pin" };
  }
  // Garantir sessão (anônima) antes do RPC.
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) {
    const { error: signErr } = await supabase.auth.signInAnonymously();
    if (signErr) return { ok: false, error: "unknown" };
  }
  const { data, error } = await supabase.rpc("link_profile", {
    _profile_id: id,
    _pin: pin,
  });
  if (error) return { ok: false, error: "unknown" };
  const res = data as { ok: boolean; created_pin?: boolean; error?: string };
  if (!res?.ok) {
    if (res?.error === "wrong_pin") return { ok: false, error: "wrong_pin" };
    return { ok: false, error: "unknown" };
  }
  bootstrapping = null;
  hydrated = false;
  await ensureBootstrap();
  return { ok: true, createdPin: !!res.created_pin };
}

export async function signOutProfile(): Promise<void> {
  await supabase.auth.signOut();
  currentProfile = null;
  isAdminFlag = false;
  writeCache(null);
  emit();
  // Ao trocar de perfil, sempre volte para a Home com um reload limpo —
  // isso descarta qualquer estado de módulo (social-store, gifts, decks…)
  // carregado sob a sessão anterior e garante um refetch completo do
  // Supabase para o novo perfil autenticado.
  if (isBrowser()) {
    window.location.replace("/");
  }
}
