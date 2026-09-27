"use server";
import { revalidatePath } from "next/cache";
import { and, eq, gte, lte } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { customers, materials, rentalItems, rentals } from "@/lib/schema";
import { customerSchema, materialSchema, rentalSchema } from "@/lib/validators";
import { MATERIAL_ICONS } from "@/lib/material-icons";
import { assertAvailability, paymentStatusFor } from "@/lib/availability";
import { devolucaoPrevista, formatData, formatKz } from "@/lib/format";
import { registarAuditoria, requireUser } from "@/lib/auth-helpers";
import { notifyAllUsers } from "@/lib/notify";

export async function criarMaterial(fd: FormData) {
  const actor = await requireUser();
  const v = materialSchema.parse(Object.fromEntries(fd));
  const db = requireDb();
  const [m] = await db
    .insert(materials)
    .values({
      ...v,
      fornecedorNome: v.fornecedorNome || null,
      icone: v.icone && v.icone in MATERIAL_ICONS ? v.icone : null,
      createdById: actor.id,
      updatedById: actor.id,
    })
    .returning({ id: materials.id });
  await registarAuditoria({
    actor,
    acao: "material.criar",
    entidade: "materials",
    entidadeId: m.id,
    detalhe: { nome: v.nome },
  });
  revalidatePath("/materiais");
}

export async function editarMaterial(id: string, fd: FormData) {
  const actor = await requireUser();
  const v = materialSchema.parse(Object.fromEntries(fd));
  const db = requireDb();
  await db
    .update(materials)
    .set({
      ...v,
      fornecedorNome: v.fornecedorNome || null,
      icone: v.icone && v.icone in MATERIAL_ICONS ? v.icone : null,
      updatedById: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(materials.id, id));
  await registarAuditoria({
    actor,
    acao: "material.editar",
    entidade: "materials",
    entidadeId: id,
    detalhe: { nome: v.nome },
  });
  revalidatePath("/materiais");
}

export async function criarCliente(fd: FormData) {
  const actor = await requireUser();
  const v = customerSchema.parse(Object.fromEntries(fd));
  const db = requireDb();
  const [c] = await db
    .insert(customers)
    .values({
      nome: v.nome,
      telefone: v.telefone,
      bi: v.bi || null,
      notas: v.notas || null,
      createdById: actor.id,
      updatedById: actor.id,
    })
    .returning({ id: customers.id });
  await registarAuditoria({
    actor,
    acao: "cliente.criar",
    entidade: "customers",
    entidadeId: c.id,
    detalhe: { nome: v.nome, telefone: v.telefone },
  });
  revalidatePath("/clientes");
}

export async function editarCliente(id: string, fd: FormData) {
  const actor = await requireUser();
  const v = customerSchema.parse(Object.fromEntries(fd));
  const db = requireDb();
  await db
    .update(customers)
    .set({
      nome: v.nome,
      telefone: v.telefone,
      bi: v.bi || null,
      notas: v.notas || null,
      updatedById: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id));
  await registarAuditoria({
    actor,
    acao: "cliente.editar",
    entidade: "customers",
    entidadeId: id,
    detalhe: { nome: v.nome },
  });
  revalidatePath("/clientes");
}

/** Criação rápida usada no wizard de aluguer: devolve o cliente criado. */
export async function criarClienteRapido(input: unknown) {
  const actor = await requireUser();
  const v = customerSchema.parse(input);
  const db = requireDb();
  try {
    const [c] = await db
      .insert(customers)
      .values({
        nome: v.nome,
        telefone: v.telefone,
        bi: v.bi || null,
        notas: v.notas || null,
        createdById: actor.id,
        updatedById: actor.id,
      })
      .returning();
    await registarAuditoria({
      actor,
      acao: "cliente.criar",
      entidade: "customers",
      entidadeId: c.id,
      detalhe: { nome: v.nome, via: "wizard" },
    });
    revalidatePath("/clientes");
    return c;
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "23505") {
      throw new Error("Este telefone já está registado. Escolhe o cliente na lista.");
    }
    throw e;
  }
}

export async function criarAluguer(input: unknown) {
  const actor = await requireUser();
  const v = rentalSchema.parse(input);
  const devPrev = devolucaoPrevista(new Date(v.dataEvento));
  await assertAvailability(v.items, new Date(v.dataLevantamento), devPrev);
  const total = v.items.reduce((s, i) => s + i.quantidade * i.precoAcordado, 0);
  const db = requireDb();
  const [r] = await db
    .insert(rentals)
    .values({
      customerId: v.customerId,
      dataLevantamento: new Date(v.dataLevantamento),
      dataEvento: new Date(v.dataEvento),
      dataDevolucaoPrevista: devPrev,
      valorTotal: total,
      valorPago: v.valorPago,
      valorCaucao: v.valorCaucao,
      statusPagamento: paymentStatusFor(total, v.valorPago),
      observacoes: v.observacoes || null,
      createdById: actor.id,
      updatedById: actor.id,
    })
    .returning({ id: rentals.id });
  await db.insert(rentalItems).values(
    v.items.map((i) => ({ rentalId: r.id, ...i }))
  );
  await registarAuditoria({
    actor,
    acao: "aluguer.criar",
    entidade: "rentals",
    entidadeId: r.id,
    detalhe: { customerId: v.customerId, total, items: v.items.length },
  });
  const [cli] = await db.select().from(customers).where(eq(customers.id, v.customerId));
  await notifyAllUsers({
    titulo: `Nova reserva — ${cli?.nome ?? "cliente"}`,
    corpo: `Evento ${formatData(v.dataEvento)} · ${formatKz(total)} · levantamento ${formatData(v.dataLevantamento)}.`,
    url: `/alugueres/${r.id}`,
    tipo: "nova-reserva",
    rentalId: r.id,
    exceptId: actor.id,
  });
  revalidatePath("/alugueres");
  revalidatePath("/");
  return r.id as string;
}

/**
 * Edição da marcação — SÓ antes do levantamento (status PENDENTE).
 * Depois de ATIVO não há volta: o material já saiu da loja.
 */
export async function editarAluguer(id: string, input: unknown) {
  const actor = await requireUser();
  const v = rentalSchema.parse(input);
  const db = requireDb();
  const [atual] = await db.select().from(rentals).where(eq(rentals.id, id));
  if (!atual) throw new Error("Aluguer não encontrado.");
  if (atual.status !== "PENDENTE")
    throw new Error("Só é possível editar antes do levantamento. Este aluguer já saiu da loja.");
  const devPrev = devolucaoPrevista(new Date(v.dataEvento));
  await assertAvailability(v.items, new Date(v.dataLevantamento), devPrev, id);
  const total = v.items.reduce((s, i) => s + i.quantidade * i.precoAcordado, 0);
  const pago = Math.min(v.valorPago, total);
  // Sequencial (neon-http não suporta transações): tudo já validado acima.
  await db
    .update(rentals)
    .set({
      customerId: v.customerId,
      dataLevantamento: new Date(v.dataLevantamento),
      dataEvento: new Date(v.dataEvento),
      dataDevolucaoPrevista: devPrev,
      valorTotal: total,
      valorPago: pago,
      valorCaucao: v.valorCaucao,
      statusPagamento: paymentStatusFor(total, pago),
      observacoes: v.observacoes || null,
      updatedById: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(rentals.id, id));
  await db.delete(rentalItems).where(eq(rentalItems.rentalId, id));
  await db.insert(rentalItems).values(v.items.map((i) => ({ rentalId: id, ...i })));
  await registarAuditoria({
    actor,
    acao: "aluguer.editar",
    entidade: "rentals",
    entidadeId: id,
    detalhe: { total, totalAntes: atual.valorTotal },
  });
  revalidatePath("/alugueres");
  revalidatePath(`/alugueres/${id}`);
  revalidatePath("/");
  revalidatePath("/calendario");
  return id;
}

/** Regista um recebimento (parcial ou total). O valor pago nunca passa do total. */
export async function registarPagamento(id: string, fd: FormData) {
  const actor = await requireUser();
  const valor = Math.max(0, Math.floor(Number(fd.get("valor")) || 0));
  if (valor <= 0) throw new Error("Indica um valor maior que zero.");
  const db = requireDb();
  const [r] = await db.select().from(rentals).where(eq(rentals.id, id));
  if (!r) throw new Error("Aluguer não encontrado.");
  const novoPago = Math.min(r.valorTotal, r.valorPago + valor);
  const [cliPag] = await db.select().from(customers).where(eq(customers.id, r.customerId));
  await db
    .update(rentals)
    .set({
      valorPago: novoPago,
      statusPagamento: paymentStatusFor(r.valorTotal, novoPago),
      updatedById: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(rentals.id, id));
  await notifyAllUsers({
    titulo: `Pagamento ${formatKz(valor)} — ${cliPag?.nome ?? "cliente"}`,
    corpo: novoPago >= r.valorTotal ? "Aluguer totalmente pago." : `Em falta ${formatKz(r.valorTotal - novoPago)}.`,
    url: `/alugueres/${id}`,
    tipo: "pagamento",
    rentalId: id,
    exceptId: actor.id,
  });
  await registarAuditoria({
    actor,
    acao: "aluguer.pagamento",
    entidade: "rentals",
    entidadeId: id,
    detalhe: { recebido: valor, pagoAntes: r.valorPago, pagoDepois: novoPago },
  });
  revalidatePath(`/alugueres/${id}`);
  revalidatePath("/alugueres");
  revalidatePath("/");
}

export async function mudarStatusAluguer(id: string, acao: "ATIVAR" | "CONCLUIR" | "CANCELAR" | "PROBLEMA" | "PAGAR_TOTAL") {
  const actor = await requireUser();
  const db = requireDb();
  const [antes] = await db.select().from(rentals).where(eq(rentals.id, id));
  if (acao === "ATIVAR") await db.update(rentals).set({ status: "ATIVO", updatedById: actor.id, updatedAt: new Date() }).where(eq(rentals.id, id));
  if (acao === "CONCLUIR")
    await db.update(rentals).set({ status: "CONCLUIDO", dataDevolucaoReal: new Date(), updatedById: actor.id, updatedAt: new Date() }).where(eq(rentals.id, id));
  if (acao === "CANCELAR") await db.update(rentals).set({ status: "CANCELADO", updatedById: actor.id, updatedAt: new Date() }).where(eq(rentals.id, id));
  if (acao === "PROBLEMA") await db.update(rentals).set({ status: "COM_PROBLEMA", updatedById: actor.id, updatedAt: new Date() }).where(eq(rentals.id, id));
  if (acao === "PAGAR_TOTAL") {
    const [r] = await db.select().from(rentals).where(eq(rentals.id, id));
    if (r) await db.update(rentals).set({ valorPago: r.valorTotal, statusPagamento: "PAGO", updatedById: actor.id, updatedAt: new Date() }).where(eq(rentals.id, id));
  }
  await registarAuditoria({
    actor,
    acao: `aluguer.${acao.toLowerCase()}`,
    entidade: "rentals",
    entidadeId: id,
    detalhe: { de: antes?.status ?? null },
  });
  const MSG: Record<string, string> = {
    ATIVAR: "Levantamento registado",
    CONCLUIR: "Devolução concluída",
    CANCELAR: "Reserva cancelada",
    PROBLEMA: "Problema reportado (quebra/perda)",
    PAGAR_TOTAL: "Aluguer pago na totalidade",
  };
  if (MSG[acao] && antes) {
    const [cliSt] = await db.select().from(customers).where(eq(customers.id, antes.customerId));
    await notifyAllUsers({
      titulo: `${MSG[acao]} — ${cliSt?.nome ?? "cliente"}`,
      corpo: `Aluguer do evento ${formatData(antes.dataEvento)}.`,
      url: `/alugueres/${id}`,
      tipo: `aluguer-${acao.toLowerCase()}`,
      rentalId: id,
      exceptId: actor.id,
    });
  }
  revalidatePath("/alugueres");
  revalidatePath("/");
}

export async function marcarAtrasados() {
  const db = requireDb();
  const agora = new Date();
  await db
    .update(rentals)
    .set({ status: "ATRASADO" })
    .where(
      and(
        lte(rentals.dataDevolucaoPrevista, agora),
        gte(rentals.status, "PENDENTE" as never) // placeholder p/ tipagem
      )
    );
  // Query real (evita comparação de enum via gte): atualiza PENDENTE/ATIVO expirados
  await db.execute(
    `update rentals set status='ATRASADO' where data_devolucao_real is null and status in ('PENDENTE','ATIVO') and data_devolucao_prevista <= now()`
  );
  await registarAuditoria({
    actor: null,
    actorEmail: "sistema",
    acao: "aluguer.cron-atrasados",
    entidade: "rentals",
    detalhe: {},
  });
}
