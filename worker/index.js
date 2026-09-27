// Custom worker do next-pwa: Web Push + clique na notificação.
// Este ficheiro é empacotado e importado pelo sw.js gerado.
self.addEventListener("push", (event) => {
  let data = { title: "LK Aluguel", body: "Tens novidades nos alugueres.", url: "/" };
  try {
    if (event.data) {
      const j = event.data.json();
      data = { ...data, ...j };
    }
  } catch (_) {
    try {
      if (event.data) data.body = event.data.text();
    } catch {}
  }
  const title = data.title || "LK Aluguel";
  const options = {
    body: data.body || "Abre a app para ver.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "lk-aluguel",
    renotify: true,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(new URL(url, self.location.origin).pathname) && "focus" in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
