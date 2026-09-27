import { NextResponse } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { notifications, rentals } from "@/lib/schema";
import { requireUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// Polling leve do sino + contadores do painel (poupa Neon/Vercel free).
// Cliente envia ?since= + If-None-Match; sem mudanças -> 304 sem bater pesado.
export async function GET(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = requireDb();

  const url = new URL(req.url);
  const since = Number(url.searchParams.get("since") ?? 0);

  const [[un], [atr], [pend], list] = await Promise.all([
    db
      .select({ n: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.lida, false))),
    db.select({ n: count() }).from(rentals).where(eq(rentals.status, "ATRASADO")),
    db.select({ n: count() }).from(rentals).where(eq(rentals.status, "PENDENTE")),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(10),
  ]);

  const unread = Number(un.n);
  const newest = list.length > 0 ? new Date(list[0].createdAt).getTime() : 0;
  const updatedAt = newest;
  const etag = `${unread}:${newest}:${atr.n}:${pend.n}`;
  const ifNoneMatch = req.headers.get("if-none-match");

  if ((since && updatedAt <= since) || (ifNoneMatch && ifNoneMatch === etag)) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    {
      ok: true,
      updatedAt,
      unread,
      list,
      contadores: { atrasados: Number(atr.n), pendentes: Number(pend.n) },
    },
    { headers: { ETag: etag, "Cache-Control": "no-store" } },
  );
}
