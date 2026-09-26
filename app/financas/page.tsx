import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  HandCoins,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { loadAnalyticsData } from "@/lib/data";
import { monthWindow } from "@/lib/stats";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { FinanceAreaChart } from "@/components/charts/revenue-area-chart";
import { formatData, formatKz } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function FinancasPage() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const dados = await loadAnalyticsData();
  if (!dados) return <Card>Falta <code>DATABASE_URL</code>.</Card>;
  const { rentals, customers } = dados;
  const nomes = new Map(customers.map((c) => [c.id, c.nome]));

  const validos = rentals.filter((r) => r.status !== "CANCELADO");
  const faturado = validos.reduce((t, r) => t + r.valorTotal, 0);
  const recebido = validos.reduce((t, r) => t + r.valorPago, 0);
  const aReceber = faturado - recebido;
  const caucoes = rentals
    .filter((r) => ["PENDENTE", "ATIVO", "ATRASADO"].includes(r.status))
    .reduce((t, r) => t + r.valorCaucao, 0);
  const taxa = faturado ? Math.round((recebido / faturado) * 100) : 0;

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const recebidoMes = validos
    .filter((r) => new Date(r.dataEvento) >= inicioMes)
    .reduce((t, r) => t + r.valorPago, 0);
  const aReceberVencido = validos
    .filter((r) => r.status === "ATRASADO")
    .reduce((t, r) => t + (r.valorTotal - r.valorPago), 0);

  // Fluxo por mês: termina no mês atual ou no da última reserva (o que for mais à frente)
  const meses: { key: string; label: string; faturado: number; recebido: number }[] = monthWindow(
    validos.map((r) => new Date(r.dataEvento))
  ).map((m) => ({ ...m, faturado: 0, recebido: 0 }));
  const mesByKey = new Map(meses.map((m) => [m.key, m]));
  for (const r of validos) {
    const d = new Date(r.dataEvento);
    const m = mesByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (m) {
      m.faturado += r.valorTotal;
      m.recebido += r.valorPago;
    }
  }

  // Dívidas: saldo em aberto, mais antigas primeiro
  const dividas = validos
    .filter((r) => r.valorTotal - r.valorPago > 0)
    .sort((a, b) => +new Date(a.dataEvento) - +new Date(b.dataEvento))
    .slice(0, 15);

  const kpis = [
    { label: "Recebido (total)", value: formatKz(recebido), icon: Banknote, tint: "bg-emerald-100 text-emerald-700" },
    { label: "Recebido · mês", value: formatKz(recebidoMes), icon: HandCoins, tint: "bg-emerald-100 text-emerald-700" },
    { label: "A receber", value: formatKz(aReceber), icon: Wallet, tint: "bg-sky-100 text-sky-700" },
    { label: "Em atraso", value: formatKz(aReceberVencido), icon: AlertTriangle, tint: "bg-red-100 text-red-600" },
    { label: "Cauções em curso", value: formatKz(caucoes), icon: PiggyBank, tint: "bg-gold-100 text-gold-600" },
    { label: "Taxa de cobrança", value: `${taxa}%`, icon: TrendingUp, tint: "bg-brand-100 text-brand-700" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Finanças" subtitle="Saúde financeira: o que entrou, o que falta entrar e onde está preso." />

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

      <Card className="animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
            Faturado vs recebido
          </h2>
          <div className="flex gap-3 text-xs font-semibold text-ink-700/70">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-ink-800" /> Faturado</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500" /> Recebido</span>
          </div>
        </div>
        <div className="mt-2">
          {meses.every((m) => m.faturado === 0) ? (
            <EmptyState title="Sem movimento no período" hint="O faturado e o recebido aparecem aqui por mês do evento." />
          ) : (
            <FinanceAreaChart data={meses.map((m) => ({ label: m.label, faturado: m.faturado, recebido: m.recebido }))} />
          )}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-700/55">
          <CircleDollarSign className="size-3.5" />
          O recebido é aproximado ao mês do evento (os pagamentos não têm data própria).
        </p>
      </Card>

      <Card className="animate-rise">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
          Valores a receber
        </h2>
        {dividas.length === 0 ? (
          <EmptyState title="Nada por receber" hint="Todos os alugueres estão liquidados. Bom trabalho." />
        ) : (
          <div className="mt-1 flex flex-col">
            {dividas.map((r) => {
              const falta = r.valorTotal - r.valorPago;
              return (
                <Link
                  key={r.id}
                  href={`/alugueres/${r.id}`}
                  className="flex items-center gap-3 border-b border-ink-900/8 py-3 last:border-0 hover:bg-cream-50/70"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-950">
                      {nomes.get(r.customerId) ?? "Cliente"}
                    </span>
                    <span className="block truncate text-xs text-ink-700/60">
                      Evento {formatData(r.dataEvento)} · Pago {formatKz(r.valorPago)} de {formatKz(r.valorTotal)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-base font-semibold text-red-600">{formatKz(falta)}</span>
                    <StatusBadge value={r.status} className="mt-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
