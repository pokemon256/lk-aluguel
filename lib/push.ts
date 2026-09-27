import webpush from "web-push";
import { eq } from "drizzle-orm";
import { requireDb } from "./db";
import { pushSubscriptions } from "./schema";

// BACKEND — Web Push (navegador). Sem VAPID configurado, não faz nada.
let ready = false;

function normKey(k: string) {
  return k.trim().replace(/=+$/, "");
}

function setup() {
  if (ready) return true;
  const pubRaw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privRaw = process.env.VAPID_PRIVATE_KEY;
  if (!pubRaw || !privRaw) {
    console.warn("[push] sem VAPID: NEXT_PUBLIC_VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY em falta");
    return false;
  }
  const pub = normKey(pubRaw);
  const priv = normKey(privRaw);
  if (pub.length < 80 || priv.length < 40) {
    console.warn("[push] VAPID keys com comprimento inválido", { pubLen: pub.length, privLen: priv.length });
    return false;
  }
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contato@lk-aluguel.ao", pub, priv);
    ready = true;
    return true;
  } catch (e) {
    console.error("[push] VAPID setup falhou", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!setup()) return { ok: false, motivo: "sem-vapid" } as const;
  const db = requireDb();
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  if (subs.length === 0) return { ok: true, enviadas: 0 } as const;
  let enviadas = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      enviadas += 1;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      const body = (e as { body?: string })?.body ?? (e instanceof Error ? e.message : String(e));
      // 410/404 = subscrição expirada, 403 = VAPID inválido/mismatch -> limpa para forçar nova subscrição
      if (status === 410 || status === 404 || status === 403) {
        console.warn(`[push] limpar sub ${status}: ${s.endpoint.slice(0, 40)}`);
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint)).catch(() => {});
      } else {
        console.warn(`[push] falhou ${status ?? "?"}: ${String(body).slice(0, 200)}`);
      }
    }
  }
  return { ok: true, enviadas } as const;
}
