import { requireDb } from "./db";
import { auditLogs, customers, materials, rentalItems, rentals, users } from "./schema";
import { desc, eq } from "drizzle-orm";

/** Loaders que devolvem null quando a BD falha (a causa real vai para os logs do servidor). */
export async function loadMaterials() {
  try {
    return await requireDb().select().from(materials).orderBy(materials.nome);
  } catch (e) {
    console.error("[data] loadMaterials falhou:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function loadCustomers() {
  try {
    return await requireDb().select().from(customers).orderBy(customers.nome);
  } catch {
    return null;
  }
}

export async function loadRentals(limit = 50) {
  try {
    const db = requireDb();
    const lista = await db.select().from(rentals).orderBy(desc(rentals.dataEvento)).limit(limit);
    const cs = await db.select().from(customers);
    return { lista, nomes: new Map(cs.map((c) => [c.id, c.nome])) };
  } catch {
    return null;
  }
}

export async function loadCalendar() {
  try {
    const db = requireDb();
    const rs = await db.select().from(rentals).limit(200);
    const cs = await db.select().from(customers);
    return { rs, nomes: new Map(cs.map((c) => [c.id, c.nome])) };
  } catch {
    return null;
  }
}

/** Mapa id → nome para assinar "criado por / editado por" sem N+1 nas páginas. */
export async function loadUserNames(): Promise<Map<string, string>> {
  try {
    const us = await requireDb().select({ id: users.id, nome: users.nome }).from(users);
    return new Map(us.map((u) => [u.id, u.nome]));
  } catch {
    return new Map();
  }
}

/** Histórico de auditoria de uma entidade (ex: rentals + id). */
export async function loadAudit(entidade: string, entidadeId: string, limit = 20) {
  try {
    const db = requireDb();
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entidade, entidade))
      .orderBy(desc(auditLogs.at))
      .limit(200)
      .then((rows) => rows.filter((r) => r.entidadeId === entidadeId).slice(0, limit));
  } catch {
    return [];
  }
}
/** Tudo o que Análises e Finanças precisam (volumes pequenos nesta fase do negócio). */
export async function loadAnalyticsData() {
  try {
    const db = requireDb();
    const [rs, items, mats, cs] = await Promise.all([
      db.select().from(rentals),
      db.select().from(rentalItems),
      db.select().from(materials),
      db.select().from(customers),
    ]);
    return { rentals: rs, items, materials: mats, customers: cs };
  } catch {
    return null;
  }
}

export async function loadCustomerDetail(id: string) {
  try {
    const db = requireDb();
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    if (!c) return { missing: true as const };
    const rs = await db
      .select()
      .from(rentals)
      .where(eq(rentals.customerId, id))
      .orderBy(desc(rentals.dataEvento));
    const items = await db.select().from(rentalItems);
    return { customer: c, rentals: rs, items };
  } catch {
    return null;
  }
}
