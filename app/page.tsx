import Link from "next/link";
import { and, count, eq, gte, inArray, ne, sql } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarCheck,
  ChartColumn,
  PartyPopper,
  Plus,
  Wallet,
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireDb } from "@/lib/db";
import { rentals } from "@/lib/schema";
import { marcarAtrasados } from "@/lib/actions";
import { Card, EmptyState, StatusBadge } from "@/components/ui/primitives";
import { formatData, formatKz } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function NoDb() {
  return (
    <Card>
      <h1 className="font-display text-xl font-semibold">Falta configurar a base de dados</h1>
      <p className="mt-1 text-sm text-ink-700/70">
        Cria um projeto no Neon, copia <code>DATABASE_URL</code> para <code>.env.local</code> (ver{" "}
        <code>.env.example</code>), corre <code>npm run db:migrate && npm run db:seed</code> e recarrega.
      </p>
    </Card>
  );
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function Dashboard() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  try {
    await marcarAtrasados();
  } catch {
    // sem BD configurada — cai no NoDb abaixo
  }
  let db: ReturnType<typeof requireDb> | null = null;
  try {
    db = requireDb();
  } catch {
    db = null;
  }
  if (!db) return <NoDb />;

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const [[ativos], [atrasados], [pendentes], [recebido], [aReceber], proximos] = await Promise.all([
    db.select({ n: count() }).from(rentals).where(eq(rentals.status, "ATIVO")),
    db.select({ n: count() }).from(rentals).where(eq(rentals.status, "ATRASADO")),
    db.select({ n: count() }).from(rentals).where(eq(rentals.status, "PENDENTE")),
    // Dinheiro que realmente entrou: soma do pago em eventos deste mês (sem cancelados).
    db
      .select({ total: sql<number>`coalesce(sum(${rentals.valorPago}),0)` })
      .from(rentals)
      .where(and(gte(rentals.dataEvento, inicioMes), ne(rentals.status, "CANCELADO"))),
    // Por receber: total menos pago em todos os alugueres não cancelados.
    db
      .select({ total: sql<number>`coalesce(sum(${rentals.valorTotal} - ${rentals.valorPago}),0)` })
      .from(rentals)
      .where(ne(rentals.status, "CANCELADO")),
    db
      .select()
      .from(rentals)
      .where(inArray(rentals.status, ["PENDENTE", "ATIVO", "ATRASADO"]))
      .orderBy(rentals.dataEvento)
      .limit(8),
  ]);

  const stats = [
    { label: "Em evento", value: String(ativos.n), icon: PartyPopper, tint: "bg-brand-100 text-brand-700" },
    { label: "Reservas", value: String(pendentes.n), icon: CalendarCheck, tint: "bg-gold-100 text-gold-600" },
    { label: "Atrasados", value: String(atrasados.n), icon: AlertTriangle, tint: "bg-red-100 text-red-600" },
    {
      label: "Recebido · mês",
      value: formatKz(Number(recebido.total ?? 0)),
      icon: Banknote,
      tint: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "A receber",
      value: formatKz(Number(aReceber.total ?? 0)),
      icon: Wallet,
      tint: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-ink-950 p-6 text-cream-50 md:p-8 animate-rise">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-16 size-64 rounded-full bg-brand-600/45 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-gold-500/20 blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300">
              {formatData(hoje)}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {saudacao()} — vamos a mais uma festa?
            </h1>
            <p className="mt-1.5 text-sm text-cream-50/65">
              {ativos.n} eventos a decorrer · {pendentes.n} reservas · {atrasados.n} devoluções em atraso
            </p>
          </div>
          <Link href="/alugueres/novo">
            <Button size="lg">
              <Plus className="size-4" /> Novo aluguer
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerta de atrasos */}
      {atrasados.n > 0 && (
        <Link
          href="/alugueres"
          className="flex items-center gap-3 rounded-3xl bg-red-600 px-5 py-4 text-white shadow-lg shadow-red-900/25 transition-transform hover:scale-[1.005] animate-rise"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/15">
            <AlertTriangle className="size-5" />
          </span>
          <span className="flex-1 text-sm">
            <strong className="font-semibold">
              {atrasados.n} {atrasados.n === 1 ? "devolução em atraso" : "devoluções em atraso"}
            </strong>
            <span className="block text-white/75">Toca para ver e ligar aos clientes.</span>
          </span>
          <ArrowRight className="size-5 shrink-0" />
        </Link>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((st, i) => (
          <Card key={st.label} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
            <span className={cn("grid size-10 place-items-center rounded-2xl", st.tint)}>
              <st.icon className="size-5" />
            </span>
            <p className="mt-3 font-display text-[1.7rem] font-semibold leading-none tracking-tight text-ink-950">
              {st.value}
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink-700/60">{st.label}</p>
          </Card>
        ))}
      </div>

      {/* Próximos eventos */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/financas">
          <Card className="flex items-center gap-3.5 transition-all hover:-translate-y-px hover:shadow-lg animate-rise">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Wallet className="size-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold text-ink-950">Finanças</span>
              <span className="block text-xs text-ink-700/60">Recebido, a receber e dívidas</span>
            </span>
            <ArrowRight className="ml-auto size-5 shrink-0 text-ink-700/40" />
          </Card>
        </Link>
        <Link href="/analises">
          <Card className="flex items-center gap-3.5 transition-all hover:-translate-y-px hover:shadow-lg animate-rise">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <ChartColumn className="size-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold text-ink-950">Análises</span>
              <span className="block text-xs text-ink-700/60">Materiais, meses e clientes</span>
            </span>
            <ArrowRight className="ml-auto size-5 shrink-0 text-ink-700/40" />
          </Card>
        </Link>
      </div>
      <Card className="animate-rise">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
            Próximos eventos
          </h2>
          <Link href="/calendario" className="text-[13px] font-semibold text-brand-700 hover:text-brand-600">
            Ver calendário →
          </Link>
        </div>
        {proximos.length === 0 ? (
          <EmptyState title="Sem alugueres pendentes" hint="Cria o primeiro aluguer e ele aparece aqui." />
        ) : (
          <div className="flex flex-col">
            {proximos.map((r) => {
              const d = new Date(r.dataEvento);
              const dia = new Intl.DateTimeFormat("pt-AO", { day: "2-digit" }).format(d);
              const mes = new Intl.DateTimeFormat("pt-AO", { month: "short" })
                .format(d)
                .replace(".", "");
              return (
                <Link
                  key={r.id}
                  href={`/alugueres/${r.id}`}
                  className="flex items-center gap-3.5 border-b border-ink-900/8 py-3 transition-colors last:border-0 hover:bg-cream-50/70"
                >
                  <span className="grid w-12 shrink-0 place-items-center rounded-2xl bg-cream-100 py-1.5 leading-tight">
                    <span className="font-display text-lg font-bold text-ink-950">{dia}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{mes}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-950">
                      Evento · {formatKz(r.valorTotal)}
                    </span>
                    <span className="block truncate text-xs text-ink-700/60">
                      Levantamento {formatData(r.dataLevantamento)} · {r.statusPagamento === "PAGO" ? "Pago" : r.statusPagamento === "PARCIAL" ? "Pagamento parcial" : "Por pagar"}
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
