import { eq, ne } from "drizzle-orm";
import { requireDb } from "./db";
import { notifications, users } from "./schema";
import { sendPushToUser } from "./push";

// BACKEND — notifica um utilizador: sino + push. Nunca quebra o fluxo chamador.
export async function notifyUser(input: {
  userId: string;
  rentalId?: string | null;
  titulo: string;
  corpo: string;
  url?: string;
  tipo?: string;
  dedupeKey?: string;
}) {
  try {
    const db = requireDb();
    // Anti-duplicado para alertas temporais do cron.
    if (input.dedupeKey) {
      await db
        .insert(notifications)
        .values({
          userId: input.userId,
          rentalId: input.rentalId ?? null,
          titulo: input.titulo,
          corpo: input.corpo,
          url: input.url ?? null,
          tipo: input.tipo ?? null,
          dedupeKey: input.dedupeKey,
        })
        .onConflictDoNothing({ target: notifications.dedupeKey });
    } else {
      await db.insert(notifications).values({
        userId: input.userId,
        rentalId: input.rentalId ?? null,
        titulo: input.titulo,
        corpo: input.corpo,
        url: input.url ?? null,
        tipo: input.tipo ?? null,
      });
    }
    await sendPushToUser(input.userId, { title: input.titulo, body: input.corpo, url: input.url }).catch(() => {});
  } catch {
    console.warn("[notify] falhou", input.titulo);
  }
}

// Todos os utilizadores ativos (ADMIN + OPERADOR). exceptId = ator que fez a ação.
export async function notifyAllUsers(input: {
  titulo: string;
  corpo: string;
  url?: string;
  tipo?: string;
  rentalId?: string | null;
  dedupeKeyPrefix?: string;
  exceptId?: string;
}) {
  try {
    const db = requireDb();
    const all = await db
      .select({ id: users.id })
      .from(users)
      .where(input.exceptId ? ne(users.id, input.exceptId) : eq(users.ativo, true));
    const ativos = input.exceptId
      ? (await db.select({ id: users.id }).from(users).where(eq(users.ativo, true))).filter((u) => u.id !== input.exceptId)
      : all;
    if (ativos.length === 0) return;
    await Promise.all(
      ativos.map((u) =>
        notifyUser({
          userId: u.id,
          rentalId: input.rentalId,
          titulo: input.titulo,
          corpo: input.corpo,
          url: input.url,
          tipo: input.tipo,
          dedupeKey: input.dedupeKeyPrefix ? `${input.dedupeKeyPrefix}:${u.id}` : undefined,
        }),
      ),
    );
  } catch {
    console.warn("[notify-all] falhou", input.titulo);
  }
}
