import { useSyncExternalStore } from "react";

export type Profile = {
  id: string;
  name: string;
  // Soft duotone gradient in the Apple/visionOS taste — no AI clichés.
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

const KEY = "airi.profile.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function getCurrentProfile(): Profile | null {
  if (!isBrowser()) return null;
  const id = localStorage.getItem(KEY);
  return PROFILES.find((p) => p.id === id) ?? null;
}

export function setCurrentProfile(id: string) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, id);
  emit();
}

export function signOutProfile() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY);
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useCurrentProfile(): Profile | null {
  return useSyncExternalStore(
    subscribe,
    () => getCurrentProfile(),
    () => null,
  );
}
