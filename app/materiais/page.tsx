import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { Boxes, Layers, PiggyBank, Truck } from "lucide-react";
import { requireDb } from "@/lib/db";
import { auditLogs, customers, rentalItems, rentals } from "@/lib/schema";
import { loadMaterials, loadUserNames } from "@/lib/data";
import { MaterialCreateButton } from "@/components/material-form";
import { MaterialsClient, type UsoMaterial } from "@/components/material-details";
import type { AuditLog } from "@/lib/schema";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { formatKz } from "@/lib/format";

const CATEGORY_TINT: Record<string, string> = {
  Mobiliário: "bg-brand-100 text-brand-700",
  Têxteis: "bg-violet-100 text-violet-700",
  Louças: "bg-sky-100 text-sky-700",
  Painéis: "bg-gold-100 text-gold-600",
  Decoração: "bg-pink-100 text-pink-700",
  Estruturas: "bg-emerald-100 text-emerald-700",
};

export default async function MateriaisPage() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const lista = await loadMaterials();
  if (!lista)
    return (
      <Card>
        Falta <code>DATABASE_URL</code>. Ver <code>.env.example</code>.
      </Card>
    );
  const db = requireDb();
  const [nomesMap, items, rents, custs, logs] = await Promise.all([
    loadUserNames(),
    db.select().from(rentalItems),
    db.select().from(rentals),
    db.select().from(customers),
    db.select().from(auditLogs).orderBy(desc(auditLogs.at)).limit(300),
  ]);
  const names: Record<string, string> = Object.fromEntries(nomesMap);
  const nomeCli = new Map(custs.map((c) => [c.id, c.nome]));
  const rentalById = new Map(rents.map((r) => [r.id, r]));

  const usos: Record<string, UsoMaterial> = Object.fromEntries(
    lista.map((m) => {
      const itemsDoMat = items.filter((i) => i.materialId === m.id);
      const rentalIds = [...new Set(itemsDoMat.map((i) => i.rentalId))];
      const recentes = rentalIds
        .map((id) => rentalById.get(id))
        .filter((r) => r !== undefined)
        .sort((a, b) => +b.dataEvento - +a.dataEvento)
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          cliente: nomeCli.get(r.customerId) ?? "—",
          data: r.dataEvento,
          status: r.status,
        }));
      return [m.id, { total: rentalIds.length, recentes }];
    })
  );

  const historicos: Record<string, AuditLog[]> = Object.fromEntries(
    lista.map((m) => [m.id, logs.filter((l) => l.entidade === "materials" && l.entidadeId === m.id).slice(0, 10)])
  );

  const unidades = lista.reduce((t, m) => t + m.quantidadeTotal, 0);
  const valor = lista.reduce((t, m) => t + m.quantidadeTotal * m.precoUnitario, 0);
  const terceiros = lista.filter((m) => m.origem === "TERCEIRIZADO").length;
  const stats = [
    { icon: Layers, label: "Artigos", value: String(lista.length) },
    { icon: Boxes, label: "Unidades", value: String(unidades) },
    { icon: PiggyBank, label: "Valor em stock", value: formatKz(valor) },
    { icon: Truck, label: "Terceirizados", value: String(terceiros) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Materiais"
        subtitle="Clica num artigo para ver detalhes, stock, histórico, editar ou apagar."
        action={<MaterialCreateButton />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((st, i) => (
          <Card
            key={st.label}
            className="flex items-center gap-3 animate-rise"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <st.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold text-ink-950">
                {st.value}
              </span>
              <span className="block text-xs font-medium text-ink-700/60">{st.label}</span>
            </span>
          </Card>
        ))}
      </div>

      {lista.length === 0 ? (
        <EmptyState title="Ainda sem materiais" hint="Adiciona o primeiro artigo no formulário acima." />
      ) : (
        <MaterialsClient
          lista={lista}
          names={names}
          usos={usos}
          historicos={historicos}
          tints={CATEGORY_TINT}
        />
      )}
    </div>
  );
}
