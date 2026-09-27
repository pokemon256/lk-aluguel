import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";
import { requireUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const subSchema = z.object({
  endpoint: z.string().url().max(500),
  p256dh: z.string().min(10).max(300),
  auth: z.string().min(10).max(300),
  userAgent: z.string().max(300).optional().nullable(),
});

function nomeDispositivo(endpoint: string) {
  if (endpoint.includes("fcm.googleapis.com")) return "Android / Chrome";
  if (endpoint.includes("updates.push.services.mozilla.com")) return "Firefox";
  if (endpoint.includes("web.push.apple.com")) return "Apple";
  if (endpoint.includes("windows.com")) return "Windows";
  return "Navegador";
}

// Meus aparelhos ligados.
export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = requireDb();
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id)).limit(20);
  return NextResponse.json({
    ok: true,
    devices: subs.map((s) => ({ nome: nomeDispositivo(s.endpoint), desde: s.createdAt })),
  });
}

// Liga este aparelho aos alertas (upsert: reinstall reativa sem duplicar).
export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const p = subSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  const db = requireDb();
  const [ex] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, p.data.endpoint)).limit(1);
  if (!ex) {
    await db.insert(pushSubscriptions).values({
      userId: user.id,
      endpoint: p.data.endpoint,
      p256dh: p.data.p256dh,
      auth: p.data.auth,
      userAgent: p.data.userAgent ?? null,
      lastSeenAt: new Date(),
    });
  } else {
    await db
      .update(pushSubscriptions)
      .set({
        userId: user.id,
        p256dh: p.data.p256dh,
        auth: p.data.auth,
        userAgent: p.data.userAgent ?? ex.userAgent,
        lastSeenAt: new Date(),
      })
      .where(eq(pushSubscriptions.endpoint, p.data.endpoint));
  }
  return NextResponse.json({ ok: true });
}

// Desliga este aparelho.
export async function DELETE(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (endpoint) {
    const db = requireDb();
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint)));
  }
  return NextResponse.json({ ok: true });
}
