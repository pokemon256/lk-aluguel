import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CalendarCheck, CircleDollarSign, Package, TrendingUp, UserRound, Wallet } from "lucide-react";
import { loadAnalyticsData } from "@/lib/data";
import { monthWindow } from "@/lib/stats";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart";
import { formatKz } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_BAR: Record<string, string> = {
  PENDENTE: "bg-amber-500",
  ATIVO: "bg-sky-500",
  CONCLUIDO: "bg-emerald-500",
  ATRASADO: "bg-red-500",
  COM_PROBLEMA: "bg-orange-500",
  CANCELADO: "bg-stone-300",
};

const STATUS_PT: Record<string, string> = {
  PENDENTE: "Pendentes",
  ATIVO: "Em evento",
  CONCLUIDO: "Concluídos",
  ATRASADO: "Atrasados",
  COM_PROBLEMA: "Com problema",
  CANCELADO: "Cancelados",
};

function Bar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-900/8">
      <div className={cn("h-full rounded-full", className)} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
    </div>
  );
}

export default async function AnalisesPage() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const dados = await loadAnalyticsData();
  if (!dados) return <Card>Falta <code>DATABASE_URL</code>.</Card>;
  const { rentals, items, materials, customers } = dados;

  const validos = rentals.filter((r) => r.status !== "CANCELADO");
  const receita = validos.reduce((t, r) => t + r.valorTotal, 0);
  const recebido = validos.reduce((t, r) => t + r.valorPago, 0);
  const ticketMedio = validos.length ? Math.round(receita / validos.length) : 0;
  const clientesAtivos = new Set(validos.map((r) => r.customerId)).size;

  // Top materiais (só alugueres válidos)
  const validIds = new Set(validos.map((r) => r.id));
  const porMaterial = new Map<string, { qtd: number; receita: number }>();
  for (const it of items) {
    if (!validIds.has(it.rentalId)) continue;
    const cur = porMaterial.get(it.materialId) ?? { qtd: 0, receita: 0 };
    cur.qtd += it.quantidade;
    cur.receita += it.quantidade * it.precoAcordado;
    porMaterial.set(it.materialId, cur);
  }
  const nomeMat = new Map(materials.map((m) => [m.id, m]));
  const topMateriais = [...porMaterial.entries()]
    .sort((a, b) => b[1].receita - a[1].receita)
    .slice(0, 5);
  const maxMat = topMateriais[0]?.[1].receita ?? 1;

  // Top clientes por receita
  const porCliente = new Map<string, { n: number; receita: number; pago: number }>();
  for (const r of validos) {
    const cur = porCliente.get(r.customerId) ?? { n: 0, receita: 0, pago: 0 };
    cur.n += 1;
    cur.receita += r.valorTotal;
    cur.pago += r.valorPago;
    porCliente.set(r.customerId, cur);
  }
  const nomeCli = new Map(customers.map((c) => [c.id, c]));
  const topClientes = [...porCliente.entries()].sort((a, b) => b[1].receita - a[1].receita).slice(0, 5);
  const maxCli = topClientes[0]?.[1].receita ?? 1;

  // Janela mensal: termina no mês atual ou no da última reserva (o que for mais à frente)
  const meses: { key: string; label: string; n: number; receita: number }[] = monthWindow(
    validos.map((r) => new Date(r.dataEvento))
  ).map((m) => ({ ...m, n: 0, receita: 0 }));
  const mesByKey = new Map(meses.map((m) => [m.key, m]));
  for (const r of validos) {
    const d = new Date(r.dataEvento);
    const m = mesByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (m) {
      m.n += 1;
      m.receita += r.valorTotal;
    }
  }

  // Distribuição por estado
  const porEstado = new Map<string, number>();
  for (const r of rentals) porEstado.set(r.status, (porEstado.get(r.status) ?? 0) + 1);
  const maxEstado = Math.max(1, ...porEstado.values());

  const kpis = [
    { label: "Alugueres", value: String(validos.length), icon: CalendarCheck, tint: "bg-brand-100 text-brand-700" },
    { label: "Receita total", value: formatKz(receita), icon: CircleDollarSign, tint: "bg-gold-100 text-gold-600" },
    { label: "Ticket médio", value: formatKz(ticketMedio), icon: TrendingUp, tint: "bg-sky-100 text-sky-700" },
    { label: "Clientes com eventos", value: String(clientesAtivos), icon: UserRound, tint: "bg-violet-100 text-violet-700" },
    { label: "Taxa de cobrança", value: receita ? `${Math.round((recebido / receita) * 100)}%` : "—", icon: Wallet, tint: "bg-emerald-100 text-emerald-700" },
    { label: "Artigos no inventário", value: String(materials.reduce((t, m) => t + m.quantidadeTotal, 0)), icon: Package, tint: "bg-pink-100 text-pink-700" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Análises" subtitle="Materiais, períodos e clientes — o que mexe o negócio." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <Card key={k.label} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
            <span className={cn("grid size-10 place-items-center rounded-2xl", k.tint)}>
              <k.icon className="size-5" />
            </span>
            <p className="mt-3 font-display text-[1.45rem] font-semibold leading-none tracking-tight text-ink-950">
              {k.value}
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink-700/60">{k.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="animate-rise">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">Materiais que mais rendem</h2>
          {topMateriais.length === 0 ? (
            <EmptyState title="Sem dados ainda" hint="Os materiais mais alugados aparecem aqui." />
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {topMateriais.map(([id, v]) => (
                <div key={id}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-semibold text-ink-950">
                      {nomeMat.get(id)?.nome ?? "Material"} <span className="font-normal text-ink-700/55">× {v.qtd}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-ink-900">{formatKz(v.receita)}</span>
                  </div>
                  <Bar pct={(v.receita / maxMat) * 100} className="mt-1.5 bg-gradient-to-r from-brand-500 to-gold-400" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="animate-rise">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">Melhores clientes</h2>
          {topClientes.length === 0 ? (
            <EmptyState title="Sem dados ainda" hint="Os clientes que mais contratam aparecem aqui." />
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {topClientes.map(([id, v]) => (
                <Link key={id} href={`/clientes/${id}`} className="group">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-semibold text-ink-950 group-hover:text-brand-700">
                      {nomeCli.get(id)?.nome ?? "Cliente"} <span className="font-normal text-ink-700/55">· {v.n} {v.n === 1 ? "evento" : "eventos"}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-ink-900">{formatKz(v.receita)}</span>
                  </div>
                  <Bar pct={(v.receita / maxCli) * 100} className="mt-1.5 bg-gradient-to-r from-ink-800 to-brand-500" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="animate-rise">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">Receita por mês</h2>
        <p className="mt-0.5 text-xs text-ink-700/55">Evolução mensal, até ao mês da última reserva.</p>
        {meses.every((m) => m.receita === 0) ? (
          <EmptyState title="Sem receita no período" hint="As receitas aparecem aqui por mês do evento." />
        ) : (
          <div className="mt-2">
            <RevenueAreaChart data={meses.map((m) => ({ label: m.label, receita: m.receita }))} />
          </div>
        )}
      </Card>

      <Card className="animate-rise">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">Alugueres por estado</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {[...porEstado.entries()].map(([estado, n]) => (
            <div key={estado} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 font-medium text-ink-800">{STATUS_PT[estado] ?? estado}</span>
              <Bar pct={(n / maxEstado) * 100} className={STATUS_BAR[estado] ?? "bg-stone-400"} />
              <span className="w-8 shrink-0 text-right font-bold tabular-nums text-ink-950">{n}</span>
            </div>
          ))}
          {porEstado.size === 0 && <EmptyState title="Sem alugueres" hint="Cria o primeiro aluguer." />}
        </div>
      </Card>
    </div>
  );
}
