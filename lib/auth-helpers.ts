import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { requireDb } from "@/lib/db";
import { auditLogs, users, type UserRole } from "@/lib/schema";

export type Actor = {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
};

/** Sessão exigida + revogação imediata: recarrega role/ativo do banco. */
export async function requireUser(): Promise<Actor> {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Não autenticado.");
  const db = requireDb();
  const [u] = await db.select().from(users).where(eq(users.id, s.user.id));
  if (!u || !u.ativo) throw new Error("Não autenticado.");
  return { id: u.id, email: u.email, nome: u.nome, role: u.role };
}

export async function requireAdmin(): Promise<Actor> {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new Error("Sem permissão. Apenas ADMIN.");
  return u;
}

export async function registarAuditoria(input: {
  actor?: Actor | null;
  actorEmail?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  detalhe?: unknown;
}) {
  const db = requireDb();
  await db.insert(auditLogs).values({
    actorId: input.actor?.id ?? null,
    actorEmail: input.actor?.email ?? input.actorEmail ?? null,
    acao: input.acao,
    entidade: input.entidade,
    entidadeId: input.entidadeId ?? null,
    detalhe: (input.detalhe ?? null) as never,
  });
}
