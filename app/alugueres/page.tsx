import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { loadRentals } from "@/lib/data";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { formatData, formatKz } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default async function AlugueresPage() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const dados = await loadRentals();
  if (!dados) return <Card>Falta <code>DATABASE_URL</code>.</Card>;
  const { lista, nomes } = dados;
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Alugueres"
        subtitle={`${lista.length} registos`}
        action={
          <Link href="/alugueres/novo">
            <Button>
              <Plus className="size-4" /> Novo aluguer
            </Button>
          </Link>
        }
      />
      {lista.length === 0 ? (
        <EmptyState title="Sem alugueres" hint="Cria o primeiro aluguer para começar." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {lista.map((r, i) => {
            const d = new Date(r.dataEvento);
            const dia = new Intl.DateTimeFormat("pt-AO", { day: "2-digit" }).format(d);
            const mes = new Intl.DateTimeFormat("pt-AO", { month: "short" }).format(d).replace(".", "");
            return (
              <Link key={r.id} href={`/alugueres/${r.id}`}>
                <Card
                  className="flex items-center gap-3.5 !p-4 transition-all hover:-translate-y-px hover:shadow-lg animate-rise"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <span className="grid w-12 shrink-0 place-items-center rounded-2xl bg-ink-900 py-1.5 leading-tight text-cream-50">
                    <span className="font-display text-lg font-bold">{dia}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-300">{mes}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink-950">
                      {nomes.get(r.customerId) ?? "Cliente"}
                    </span>
                    <span className="block truncate text-xs text-ink-700/60">
                      Lev. {formatData(r.dataLevantamento)} · {formatKz(r.valorTotal)} ·{" "}
                      {r.statusPagamento === "PAGO" ? "Pago" : r.statusPagamento === "PARCIAL" ? "Parcial" : "Por pagar"}
                    </span>
                  </span>
                  <StatusBadge value={r.status} />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
