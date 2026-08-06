const CACHE_NAME = "minix-pwa-shell-v6-mobile-app";
const APP_SHELL = [
  "/",
  "/index.html",
  "/dashboard",
  "/dashboard.html",
  "/mobile.html",
  "/admin",
  "/admin.html",
  "/config.js",
  "/manifest.json",
  "/pwa-install.js",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(APP_SHELL.map(asset => cache.add(asset)))
    )
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
      )
    ])
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api-")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
                 (await caches.match("/dashboard.html")) ||
                 (await caches.match("/index.html"));
        })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = { body: event.data ? event.data.text() : "Minix daily report is ready." };
  }

  const title = data.title || "📊 Minix Daily Report";
  const options = {
    body: data.body || "Tap to view today’s report.",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "minix-daily-report",
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/dashboard",
      notification_id: data.notification_id || null
    },
    actions: [
      { action: "view", title: "View Report" },
      { action: "snooze", title: "Snooze 15 min" }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const data = event.notification.data || {};

  if (event.action === "snooze") {
    event.waitUntil(
      fetch("/api-notification-snooze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notification_id: data.notification_id })
      }).catch(() => {})
    );
    return;
  }

  const targetUrl = new URL(data.url || "/dashboard", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
