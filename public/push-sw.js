// Messaging-only service worker: receives push notifications and updates the icon badge.
// It does NOT cache anything (no offline mode).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || "airi";
  const tasks = [
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/airi-icon-192.png",
      badge: "/icons/airi-icon-192.png",
      data: { url: data.url || "/" },
      tag: data.tag,
    }),
  ];
  if (typeof data.badge === "number" && self.navigator.setAppBadge) {
    tasks.push(data.badge > 0 ? self.navigator.setAppBadge(data.badge) : self.navigator.clearAppBadge());
  }
  event.waitUntil(Promise.allSettled(tasks));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) { if ("focus" in c) { await c.focus(); if ("navigate" in c) return c.navigate(url); return; } }
    return self.clients.openWindow(url);
  })());
});
