import { requireDb } from "./db";
import { customers, materials, rentalItems, rentals } from "./schema";
import { desc, eq } from "drizzle-orm";

/** Loaders que devolvem null quando a BD não está configurada (sem try/catch com JSX nas páginas). */
export async function loadMaterials() {
  try {
    return await requireDb().select().from(materials).orderBy(materials.nome);
  } catch {
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
