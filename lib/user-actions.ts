"use server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { userCreateSchema, userUpdateSchema } from "@/lib/validators";
import { registarAuditoria, requireAdmin } from "@/lib/auth-helpers";

export async function criarUtilizador(fd: FormData) {
  const actor = await requireAdmin();
  const v = userCreateSchema.parse({
    nome: fd.get("nome"),
    email: String(fd.get("email") ?? "").toLowerCase(),
    password: fd.get("password"),
    role: fd.get("role") ?? "OPERADOR",
  });
  const db = requireDb();
  const [exists] = await db.select().from(users).where(eq(users.email, v.email));
  if (exists) throw new Error("Este email já está registado.");
  const [u] = await db
    .insert(users)
    .values({
      nome: v.nome,
      email: v.email,
      role: v.role,
      ativo: true,
      createdById: actor.id,
      updatedById: actor.id,
      passwordHash: await bcrypt.hash(v.password, 10),
    })
    .returning({ id: users.id });
  await registarAuditoria({
    actor,
    acao: "user.criar",
    entidade: "users",
    entidadeId: u.id,
    detalhe: { email: v.email, nome: v.nome, role: v.role },
  });
  revalidatePath("/utilizadores");
}

export async function editarUtilizador(id: string, fd: FormData) {
  const actor = await requireAdmin();
  const ativoRaw = fd.get("ativo");
  const v = userUpdateSchema.parse({
    nome: fd.get("nome"),
    role: fd.get("role"),
    ativo: ativoRaw === "on" || ativoRaw === "true",
  });
  const db = requireDb();
  const [alvo] = await db.select().from(users).where(eq(users.id, id));
  if (!alvo) throw new Error("Utilizador não encontrado.");
  // Nunca desativar/despromover o último ADMIN nem a si próprio dessa forma.
  if (alvo.role === "ADMIN" && (v.role !== "ADMIN" || !v.ativo)) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(users)
      .where(eq(users.role, "ADMIN"));
    // Conta apenas admins ativos para a regra do último admin:
    const admins = await db.select().from(users).where(eq(users.role, "ADMIN"));
    const adminsAtivos = admins.filter((a) => a.ativo && (a.id !== id || v.ativo));
    if (adminsAtivos.length === 0 && Number(n) > 0)
      throw new Error("Não podes desativar/despromover o último ADMIN.");
    if (alvo.id === actor.id && !v.ativo)
      throw new Error("Não podes desativar a tua própria conta.");
  }
  await db
    .update(users)
    .set({ nome: v.nome, role: v.role, ativo: v.ativo, updatedById: actor.id })
    .where(eq(users.id, id));
  await registarAuditoria({
    actor,
    acao: "user.editar",
    entidade: "users",
    entidadeId: id,
    detalhe: { antes: { nome: alvo.nome, role: alvo.role, ativo: alvo.ativo }, depois: v },
  });
  revalidatePath("/utilizadores");
}

export async function apagarUtilizador(id: string) {
  const actor = await requireAdmin();
  if (id === actor.id) throw new Error("Não podes apagar a tua própria conta.");
  const db = requireDb();
  const [alvo] = await db.select().from(users).where(eq(users.id, id));
  if (!alvo) throw new Error("Utilizador não encontrado.");
  if (alvo.role === "ADMIN") {
    const admins = await db.select().from(users).where(eq(users.role, "ADMIN"));
    if (admins.length <= 1) throw new Error("Não podes apagar o último ADMIN.");
  }
  await db.delete(users).where(eq(users.id, id));
  await registarAuditoria({
    actor,
    acao: "user.apagar",
    entidade: "users",
    entidadeId: id,
    detalhe: { email: alvo.email, nome: alvo.nome, role: alvo.role },
  });
  revalidatePath("/utilizadores");
}
