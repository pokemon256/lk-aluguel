import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { requireDb } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { Card } from "@/components/ui/primitives";
import { PushToggle } from "@/components/push-toggle";
import { MarcarLidas } from "./marcar-lidas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  const s = await auth();
  if (!s?.user?.id) redirect("/login");
  const db = requireDb();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, s.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
    .catch(() => []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950">Notificações</h1>
          <p className="text-sm text-ink-700/60">Levantamentos, devoluções e atrasos.</p>
        </div>
        <MarcarLidas />
      </div>

      <Card>
        <p className="mb-2 text-[13px] font-semibold text-ink-800">Push neste aparelho</p>
        <PushToggle />
      </Card>

      {rows.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-ink-700/60">Sem novidades. Levantamentos e atrasos aparecem aqui.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((n) => (
            <Card key={n.id} className={cn(!n.lida && "ring-2 ring-brand-600/30")}>
              {n.url ? (
                <Link href={n.url} className="block">
                  <p className="text-sm font-semibold text-ink-950">{n.titulo}</p>
                  <p className="mt-0.5 text-[13px] text-ink-700/70">{n.corpo}</p>
                </Link>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-ink-950">{n.titulo}</p>
                  <p className="mt-0.5 text-[13px] text-ink-700/70">{n.corpo}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
