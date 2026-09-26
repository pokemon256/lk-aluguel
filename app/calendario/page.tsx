import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { loadCalendar } from "@/lib/data";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { CalendarView } from "@/components/calendar-view";
import { formatData, formatKz } from "@/lib/format";

const legend = [
  { color: "bg-amber-500", label: "Reserva" },
  { color: "bg-emerald-500", label: "Em evento" },
  { color: "bg-red-500", label: "Atraso" },
];

const ATIVOS = ["PENDENTE", "ATIVO", "ATRASADO"];

export default async function CalendarioPage() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const dados = await loadCalendar();
  if (!dados) return <Card>Falta <code>DATABASE_URL</code>.</Card>;
  const { rs, nomes } = dados;

  const proximas = rs
    .filter((r) => ATIVOS.includes(r.status))
    .sort((a, b) => +new Date(a.dataEvento) - +new Date(b.dataEvento));

  // Abre no mês da próxima reserva futura; se houver algo no mês atual, abre hoje.
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${hoje.getMonth()}`;
  const temNoMesAtual = proximas.some((r) => {
    const d = new Date(r.dataEvento);
    return `${d.getFullYear()}-${d.getMonth()}` === mesAtual;
  });
  const proximaFutura = proximas.find((r) => new Date(r.dataDevolucaoPrevista) >= hoje);
  const initialDate =
    !temNoMesAtual && proximaFutura
      ? new Date(proximaFutura.dataEvento).toISOString().slice(0, 10)
      : undefined;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Calendário"
        subtitle="Cada bloco é o período com o material fora de loja (levantamento → devolução). Toca para abrir o aluguer."
      />
      <Card className="animate-rise">
        <div className="mb-4 flex flex-wrap gap-3">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs font-semibold text-ink-700/70">
              <span className={`size-2.5 rounded-full ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
        <CalendarView
          initialDate={initialDate}
          events={rs.map((r) => ({
            id: r.id,
            title: nomes.get(r.customerId) ?? "Cliente",
            start: new Date(r.dataLevantamento).toISOString(),
            end: new Date(r.dataDevolucaoPrevista).toISOString(),
            status: r.status,
            detalhe: `${nomes.get(r.customerId) ?? "Cliente"} · Levantamento ${formatData(r.dataLevantamento)} → Devolução ${formatData(r.dataDevolucaoPrevista)} · ${formatKz(r.valorTotal)}`,
          }))}
        />
      </Card>

      <Card className="animate-rise">
        <h2 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink-950">
          Próximas reservas
        </h2>
        {proximas.length === 0 ? (
          <EmptyState title="Sem reservas ativas" hint="Cria um aluguer e ele aparece aqui e no calendário." />
        ) : (
          <div className="flex flex-col">
            {proximas.slice(0, 10).map((r) => {
              const d = new Date(r.dataEvento);
              const dia = new Intl.DateTimeFormat("pt-AO", { day: "2-digit" }).format(d);
              const mes = new Intl.DateTimeFormat("pt-AO", { month: "short" }).format(d).replace(".", "");
              return (
                <Link
                  key={r.id}
                  href={`/alugueres/${r.id}`}
                  className="flex items-center gap-3.5 border-b border-ink-900/8 py-3 last:border-0 hover:bg-cream-50/70"
                >
                  <span className="grid w-12 shrink-0 place-items-center rounded-2xl bg-cream-100 py-1.5 leading-tight">
                    <span className="font-display text-lg font-bold text-ink-950">{dia}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{mes}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-950">
                      {nomes.get(r.customerId) ?? "Cliente"} · {formatKz(r.valorTotal)}
                    </span>
                    <span className="block truncate text-xs text-ink-700/60">
                      Evento {formatData(r.dataEvento)} · Devolução {formatData(r.dataDevolucaoPrevista)}
                    </span>
                  </span>
                  <StatusBadge value={r.status} />
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
