import { and, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { materials, rentalItems, rentals } from "./schema";
import { requireDb } from "./db";

const ACTIVE = ["PENDENTE", "ATIVO", "ATRASADO"] as const;

/** Soma comprometida por material no intervalo [inicio, fim], excluindo opcionalmente um aluguer (edição). */
export async function committedInRange(
  materialIds: string[],
  inicio: Date,
  fim: Date,
  excludeRentalId?: string
) {
  if (materialIds.length === 0) return new Map<string, number>();
  const db = requireDb();
  const conds = [
    inArray(rentalItems.materialId, materialIds),
    inArray(rentals.status, [...ACTIVE] as ("PENDENTE" | "ATIVO" | "ATRASADO")[]),
    lte(rentals.dataLevantamento, fim),
    gte(rentals.dataDevolucaoPrevista, inicio),
  ];
  if (excludeRentalId) conds.push(ne(rentals.id, excludeRentalId));
  const rows = await db
    .select({
      materialId: rentalItems.materialId,
      total: sql<number>`coalesce(sum(${rentalItems.quantidade}),0)`,
    })
    .from(rentalItems)
    .innerJoin(rentals, eq(rentalItems.rentalId, rentals.id))
    .where(and(...conds))
    .groupBy(rentalItems.materialId);
  return new Map(rows.map((r) => [r.materialId, Number(r.total)]));
}

/** Saldo disponível por material para o intervalo. */
export async function getAvailableQuantities(
  inicio: Date,
  fim: Date,
  excludeRentalId?: string
) {
  const db = requireDb();
  const all = await db.select().from(materials);
  const committed = await committedInRange(
    all.map((m) => m.id),
    inicio,
    fim,
    excludeRentalId
  );
  return all.map((m) => ({
    ...m,
    comprometido: committed.get(m.id) ?? 0,
    disponivel: m.quantidadeTotal - (committed.get(m.id) ?? 0),
  }));
}

/** Valida se os itens cabem no stock do intervalo; lança erro com detalhe. */
export async function assertAvailability(
  items: { materialId: string; quantidade: number }[],
  inicio: Date,
  fim: Date,
  excludeRentalId?: string
) {
  const db = requireDb();
  const ids = [...new Set(items.map((i) => i.materialId))];
  const mats = await db.select().from(materials).where(inArray(materials.id, ids));
  const byId = new Map(mats.map((m) => [m.id, m]));
  const committed = await committedInRange(ids, inicio, fim, excludeRentalId);
  for (const it of items) {
    const m = byId.get(it.materialId);
    if (!m) throw new Error("Material inexistente.");
    const disp = m.quantidadeTotal - (committed.get(it.materialId) ?? 0);
    if (it.quantidade > disp) {
      throw new Error(
        `«${m.nome}»: apenas ${disp} disponíveis para esta data (pediste ${it.quantidade}).`
      );
    }
  }
}

export function paymentStatusFor(total: number, pago: number) {
  if (pago <= 0) return "PENDENTE" as const;
  if (pago >= total) return "PAGO" as const;
  return "PARCIAL" as const;
}
