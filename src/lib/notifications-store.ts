// Notifications store: notifications + tags + per-profile read status.
// Realtime updates via Supabase channels.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/lib/profile";

export type NotificationTag = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  tag_id: string | null;
  icon: string | null;
  created_at: string;
};

let tags: NotificationTag[] = [];
let notifications: Notification[] = [];
let readIds = new Set<string>();
let activeProfile: string | null = null;

type Snapshot = {
  notifications: Notification[];
  tags: NotificationTag[];
  readIds: Set<string>;
};
let snapshot: Snapshot = { notifications, tags, readIds };
const SERVER_SNAPSHOT: Snapshot = {
  notifications: [],
  tags: [],
  readIds: new Set<string>(),
};

const listeners = new Set<() => void>();
function emit() {
  snapshot = { notifications, tags, readIds };
  listeners.forEach((l) => l());
}


let channel: ReturnType<typeof supabase.channel> | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

async function fetchAll() {
  const [t, n] = await Promise.all([
    supabase.from("notification_tags").select("*").order("name"),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  if (!t.error && t.data) tags = t.data as NotificationTag[];
  if (!n.error && n.data) notifications = n.data as Notification[];
  emit();
}

async function fetchReads(profileId: string) {
  const { data, error } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("profile_id", profileId);
  if (!error && data) {
    readIds = new Set(data.map((r) => r.notification_id));
    emit();
  }
}

export async function initNotifications() {
  if (!isBrowser()) return;
  const p = getCurrentProfile();
  activeProfile = p?.id ?? null;
  await fetchAll();
  if (activeProfile) await fetchReads(activeProfile);

  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
  channel = supabase
    .channel("notifications-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
      void fetchAll();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "notification_tags" }, () => {
      void fetchAll();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "notification_reads" }, () => {
      if (activeProfile) void fetchReads(activeProfile);
    })
    .subscribe();
}

export function teardownNotifications() {
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useNotifications() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

export function useUnreadCount() {
  const s = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
  return s.notifications.filter((n) => !s.readIds.has(n.id)).length;
}


export async function markAsRead(notificationId: string) {
  const p = getCurrentProfile();
  if (!p) return;
  if (readIds.has(notificationId)) return;
  readIds = new Set(readIds).add(notificationId);
  emit();
  await supabase
    .from("notification_reads")
    .upsert({ notification_id: notificationId, profile_id: p.id }, { onConflict: "notification_id,profile_id" });
}

export async function markAllAsRead() {
  const p = getCurrentProfile();
  if (!p) return;
  const unread = notifications.filter((n) => !readIds.has(n.id));
  if (unread.length === 0) return;
  const next = new Set(readIds);
  unread.forEach((n) => next.add(n.id));
  readIds = next;
  emit();
  await supabase
    .from("notification_reads")
    .upsert(
      unread.map((n) => ({ notification_id: n.id, profile_id: p.id })),
      { onConflict: "notification_id,profile_id" },
    );
}

// ===== Admin helpers =====
export async function createTag(name: string, color: string) {
  const { data, error } = await supabase
    .from("notification_tags")
    .insert({ name: name.trim(), color })
    .select("*")
    .single();
  if (error) throw error;
  await fetchAll();
  return data as NotificationTag;
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("notification_tags").delete().eq("id", id);
  if (error) throw error;
  await fetchAll();
}

export async function createNotification(input: { title: string; body: string; tag_id: string | null }) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({ title: input.title.trim(), body: input.body.trim(), tag_id: input.tag_id })
    .select("*")
    .single();
  if (error) throw error;
  await fetchAll();
  return data as Notification;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
  await fetchAll();
}
