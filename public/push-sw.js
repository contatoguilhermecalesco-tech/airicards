// Messaging-only service worker: receives push notifications and updates the icon badge.
// It does NOT cache anything (no offline mode).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }

  const title = data.title || "AIRI";
  const notificationOptions = {
    body: data.body || "",
    icon: "/icons/airi-icon-192.png",
    badge: "/icons/airi-icon-192.png",
    lang: "pt-BR",
    dir: "auto",
    timestamp: Date.now(),
    vibrate: [100, 50, 100],
    tag: data.tag || undefined,
    renotify: false,
    silent: false,
    data: { url: data.url || "/" },
  };

  const tasks = [self.registration.showNotification(title, notificationOptions)];

  if (typeof data.badge === "number" && self.navigator.setAppBadge) {
    tasks.push(
      data.badge > 0
        ? self.navigator.setAppBadge(data.badge)
        : self.navigator.clearAppBadge(),
    );
  }

  event.waitUntil(Promise.allSettled(tasks));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const actionUrl =
    event.action === "inbox"
      ? "/notificacoes"
      : (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of all) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) return client.navigate(actionUrl);
        return;
      }
    }

    return self.clients.openWindow(actionUrl);
  })());
});
