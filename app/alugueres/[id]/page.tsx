import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { customers, materials, rentalItems, rentals } from "@/lib/schema";
import { mudarStatusAluguer, registarPagamento } from "@/lib/actions";
import { Card, Input, Label, StatusBadge } from "@/components/ui/primitives";
import { formatDataHora, formatKz } from "@/lib/format";
import { Button } from "@/components/ui/button";

const HERO_TINT: Record<string, string> = {
  PENDENTE: "from-amber-500 to-amber-600",
  ATIVO: "from-sky-500 to-sky-600",
  CONCLUIDO: "from-emerald-500 to-emerald-600",
  ATRASADO: "from-red-500 to-red-600",
  COM_PROBLEMA: "from-orange-500 to-orange-600",
  CANCELADO: "from-stone-400 to-stone-500",
};

export default async function AluguerDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const { id } = await params;
  const db = requireDb();
  const [r] = await db.select().from(rentals).where(eq(rentals.id, id));
  if (!r)
    return (
      <Card>
        Aluguer não encontrado.{" "}
        <Link className="font-semibold text-brand-700 underline" href="/alugueres">
          Voltar
        </Link>
      </Card>
    );
  const [c] = await db.select().from(customers).where(eq(customers.id, r.customerId));
  const items = await db.select().from(rentalItems).where(eq(rentalItems.rentalId, id));
  const mats = await db.select().from(materials);
  const nomeMat = new Map(mats.map((m) => [m.id, m.nome]));

  return (
    <div className="flex flex-col gap-5">
      <Link href="/alugueres" className="flex w-fit items-center gap-1 text-sm font-medium text-ink-700/70 hover:text-ink-900">
        <ChevronLeft className="size-4" /> Todos os alugueres
      </Link>

      <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-white shadow-xl md:p-8 animate-rise ${HERO_TINT[r.status] ?? "from-ink-800 to-ink-950"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              {c?.telefone}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {c?.nome}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Levantamento {formatDataHora(r.dataLevantamento)}
              <span className="mx-1.5 text-white/40">·</span>
              Evento {formatDataHora(r.dataEvento)}
              <span className="mx-1.5 text-white/40">·</span>
              Devolução {formatDataHora(r.dataDevolucaoPrevista)}
            </p>
          </div>
          <StatusBadge value={r.status} className="border border-white/25 bg-white/15 !text-white backdrop-blur" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: formatKz(r.valorTotal) },
            { label: "Já pago", value: formatKz(r.valorPago) },
            { label: "Caução", value: formatKz(r.valorCaucao) },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">{m.label}</p>
              <p className="mt-0.5 font-display text-xl font-semibold">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
          Pagamento: <StatusBadge value={r.statusPagamento} className="border border-white/25 bg-white/15 !text-white" />
        </div>
        {r.observacoes && <p className="mt-3 text-sm text-white/75">Obs: {r.observacoes}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {r.status === "PENDENTE" && (
            <Link href={`/alugueres/${r.id}/editar`}>
              <Button type="button" className="!bg-white !text-ink-950 hover:!bg-cream-100 !shadow-none">
                <Pencil className="size-4" /> Editar marcação
              </Button>
            </Link>
          )}
          {r.status === "PENDENTE" && (
            <form action={mudarStatusAluguer.bind(null, r.id, "ATIVAR")}>
              <Button type="submit" variant="outline" className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10">
                Marcar levantado
              </Button>
            </form>
          )}
          {(r.status === "ATIVO" || r.status === "ATRASADO") && (
            <form action={mudarStatusAluguer.bind(null, r.id, "CONCLUIR")}>
              <Button type="submit" className="!bg-white !text-ink-950 hover:!bg-cream-100 !shadow-none">
                Marcar devolvido
              </Button>
            </form>
          )}
          {(r.status === "PENDENTE" || r.status === "ATIVO") && (
            <form action={mudarStatusAluguer.bind(null, r.id, "PROBLEMA")}>
              <Button type="submit" variant="outline" className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10">
                Com problema / quebra
              </Button>
            </form>
          )}
          {r.status === "PENDENTE" && (
            <form action={mudarStatusAluguer.bind(null, r.id, "CANCELAR")}>
              <Button type="submit" variant="ghost" className="!text-white/80 hover:!bg-white/10 hover:!text-white">
                Cancelar
              </Button>
            </form>
          )}
        </div>
      </div>

      {r.statusPagamento !== "PAGO" && (
        <Card className="animate-rise">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
            Registar pagamento
          </h2>
          <p className="mt-0.5 text-sm text-ink-700/60">
            Faltam <strong className="text-ink-900">{formatKz(r.valorTotal - r.valorPago)}</strong> para liquidar.
          </p>
          <form action={registarPagamento.bind(null, r.id)} className="mt-3 flex items-end gap-2">
            <div className="max-w-56 flex-1">
              <Label>Valor recebido (Kz)</Label>
              <Input name="valor" type="number" min={1} max={r.valorTotal - r.valorPago} defaultValue={r.valorTotal - r.valorPago} required />
            </div>
            <Button type="submit">Registar</Button>
          </form>
        </Card>
      )}

      <Card className="animate-rise">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">Materiais</h2>
        <div className="mt-2">
          {items.map((it) => (
            <p key={it.id} className="flex items-center justify-between gap-3 border-b border-ink-900/8 py-2.5 text-sm last:border-0">
              <span className="font-medium text-ink-950">
                {nomeMat.get(it.materialId) ?? "Material"} <span className="text-ink-700/55">× {it.quantidade}</span>
              </span>
              <span className="shrink-0 text-ink-700/70">
                {formatKz(it.precoAcordado)} un. · <strong className="text-ink-950">{formatKz(it.quantidade * it.precoAcordado)}</strong>
              </span>
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
