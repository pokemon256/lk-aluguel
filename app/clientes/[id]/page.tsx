import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CalendarCheck, ChevronLeft, CircleDollarSign, Phone, Plus, Wallet } from "lucide-react";
import { loadCustomerDetail } from "@/lib/data";
import { ClientEditButton } from "@/components/client-form";
import { Card, EmptyState, StatusBadge } from "@/components/ui/primitives";
import { formatData, formatKz } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export default async function ClienteDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const { id } = await params;
  const dados = await loadCustomerDetail(id);
  if (!dados) return <Card>Falta <code>DATABASE_URL</code>.</Card>;
  if ("missing" in dados)
    return (
      <Card>
        Cliente não encontrado.{" "}
        <Link className="font-semibold text-brand-700 underline" href="/clientes">
          Voltar
        </Link>
      </Card>
    );
  const { customer: c, rentals, items } = dados;
  const validos = rentals.filter((r) => r.status !== "CANCELADO");
  const total = validos.reduce((t, r) => t + r.valorTotal, 0);
  const pago = validos.reduce((t, r) => t + r.valorPago, 0);
  const itensPorAluguer = new Map<string, number>();
  for (const it of items) itensPorAluguer.set(it.rentalId, (itensPorAluguer.get(it.rentalId) ?? 0) + it.quantidade);

  const stats = [
    { label: "Eventos", value: String(validos.length), icon: CalendarCheck, tint: "bg-brand-100 text-brand-700" },
    { label: "Total contratado", value: formatKz(total), icon: CircleDollarSign, tint: "bg-gold-100 text-gold-600" },
    { label: "Já pago", value: formatKz(pago), icon: Wallet, tint: "bg-emerald-100 text-emerald-700" },
    {
      label: "Em dívida",
      value: formatKz(total - pago),
      icon: Wallet,
      tint: total - pago > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/clientes" className="flex w-fit items-center gap-1 text-sm font-medium text-ink-700/70 hover:text-ink-900">
        <ChevronLeft className="size-4" /> Todos os clientes
      </Link>

      <Card className="animate-rise">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-2xl font-bold text-white">
            {iniciais(c.nome)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-ink-950 md:text-3xl">
              {c.nome}
            </h1>
            <a
              href={`tel:${c.telefone.replace(/\s/g, "")}`}
              className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-600"
            >
              <Phone className="size-4" /> {c.telefone}
            </a>
            <p className="mt-0.5 text-xs text-ink-700/60">
              {c.bi ? `BI ${c.bi}` : "BI não registado"}{c.notas ? ` · ${c.notas}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/alugueres/novo?cliente=${c.id}`}>
              <Button>
                <Plus className="size-4" /> Novo aluguer
              </Button>
            </Link>
            <ClientEditButton customer={c} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((st, i) => (
          <Card key={st.label} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
            <span className={cn("grid size-10 place-items-center rounded-2xl", st.tint)}>
              <st.icon className="size-5" />
            </span>
            <p className="mt-3 font-display text-[1.6rem] font-semibold leading-none tracking-tight text-ink-950">
              {st.value}
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink-700/60">{st.label}</p>
          </Card>
        ))}
      </div>

      <Card className="animate-rise">
        <h2 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink-950">
          Alugueres deste cliente
        </h2>
        {rentals.length === 0 ? (
          <EmptyState title="Sem alugueres" hint="Cria o primeiro aluguer para este cliente." />
        ) : (
          <div className="flex flex-col">
            {rentals.map((r) => {
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
                      {formatKz(r.valorTotal)} · {itensPorAluguer.get(r.id) ?? 0} peças
                    </span>
                    <span className="block truncate text-xs text-ink-700/60">
                      Evento {formatData(r.dataEvento)} · Pago {formatKz(r.valorPago)}
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
