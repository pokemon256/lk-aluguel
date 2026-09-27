// Cliente push partilhado: subscrição, sync reinstall, deteção standalone.
export function b64url(s: string) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob((s + pad).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return (await reg?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

export async function ensurePushSubscription(): Promise<{ ok: boolean; created: boolean; erro?: string }> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!pub) return { ok: false, created: false, erro: "VAPID em falta" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, created: false, erro: "bloqueado" };
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  let created = false;
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64url(pub) as BufferSource });
    created = true;
  }
  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
    }),
  }).then((r) => r.json().catch(() => null));
  if (!res?.ok) return { ok: false, created, erro: "subscribe falhou" };
  try {
    window.dispatchEvent(new Event("lk:push-change"));
  } catch {}
  return { ok: true, created };
}

// Reinstall: o POST faz upsert e atualiza lastSeen; chamamos no arranque para reativar.
export async function syncPushOnAppStart() {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission !== "granted") return;
    const sub = await getExistingSubscription();
    if (!sub) return;
    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        userAgent: navigator.userAgent.slice(0, 200),
      }),
    }).catch(() => {});
  } catch {}
}
