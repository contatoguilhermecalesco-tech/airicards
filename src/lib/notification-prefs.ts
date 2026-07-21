// Per-profile notification preferences stored in localStorage.
// Preferences are device-local (sound/vibration depend on device).
import { useSyncExternalStore } from "react";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";

export type NotificationPrefs = {
  sound: boolean;
  vibration: boolean;
  essentialOnly: boolean;
  quietHoursEnabled: boolean;
  quietStart: string; // "HH:MM"
  quietEnd: string;   // "HH:MM"
};

export const DEFAULT_PREFS: NotificationPrefs = {
  sound: true,
  vibration: true,
  essentialOnly: false,
  quietHoursEnabled: false,
  quietStart: "22:00",
  quietEnd: "07:00",
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function isBrowser() {
  return typeof window !== "undefined";
}

function key(profileId: string) {
  return `airi.notifprefs.${profileId}.v1`;
}

let cachedProfile: string | null = null;
let cachedPrefs: NotificationPrefs = DEFAULT_PREFS;

function load(profileId: string): NotificationPrefs {
  if (!isBrowser()) return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(key(profileId));
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function refresh() {
  const p = getCurrentProfile();
  cachedProfile = p?.id ?? null;
  cachedPrefs = cachedProfile ? load(cachedProfile) : DEFAULT_PREFS;
  emit();
}

if (isBrowser()) {
  refresh();
  subscribeProfile(refresh);
  window.addEventListener("storage", (e) => {
    if (cachedProfile && e.key === key(cachedProfile)) refresh();
  });
}

export function getPrefs(): NotificationPrefs {
  return cachedPrefs;
}

export function setPrefs(patch: Partial<NotificationPrefs>) {
  const p = getCurrentProfile();
  if (!p || !isBrowser()) return;
  cachedPrefs = { ...cachedPrefs, ...patch };
  localStorage.setItem(key(p.id), JSON.stringify(cachedPrefs));
  emit();
}

export function useNotificationPrefs(): NotificationPrefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => cachedPrefs,
    () => DEFAULT_PREFS,
  );
}

// Returns true if current time is inside the quiet window.
export function isQuietNow(prefs: NotificationPrefs = cachedPrefs): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = prefs.quietStart.split(":").map(Number);
  const [eh, em] = prefs.quietEnd.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end;
  // wraps midnight (e.g. 22:00 -> 07:00)
  return cur >= start || cur < end;
}
