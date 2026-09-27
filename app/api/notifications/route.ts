import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { requireUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// Sino: não lidas + últimas 10.
export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = requireDb();
  const [[c], list] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.lida, false))),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(10),
  ]);
  return NextResponse.json({ ok: true, unread: c.n, list }, { headers: { "Cache-Control": "no-store" } });
}

// Marcar lidas (all=true ou ids).
export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = requireDb();
  if (body?.all) {
    await db.update(notifications).set({ lida: true }).where(eq(notifications.userId, user.id));
  } else if (Array.isArray(body?.ids) && body.ids.length > 0) {
    for (const nid of body.ids.slice(0, 50)) {
      await db
        .update(notifications)
        .set({ lida: true })
        .where(and(eq(notifications.userId, user.id), eq(notifications.id, String(nid))));
    }
  }
  return NextResponse.json({ ok: true });
}
