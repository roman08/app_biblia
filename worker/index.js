// Este archivo se importa desde el sw.js generado por next-pwa
// y maneja los eventos push

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Biblia App", body: event.data.text() };
  }

  const options = {
    body: data.body || "Es hora de leer la Palabra",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    tag: data.tag || "daily-reminder",
    renotify: true,
    data: {
      url: data.url || "/",
      ...data.data,
    },
    actions: [
      {
        action: "read",
        title: "Leer ahora",
      },
      {
        action: "dismiss",
        title: "Después",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Biblia App", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});