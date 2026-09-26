import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { customers, materials, rentalItems, rentals } from "@/lib/schema";
import { Card, PageHeader } from "@/components/ui/primitives";
import { RentalEditForm } from "@/components/rental-wizard";

function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default async function EditarAluguerPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (r.status !== "PENDENTE") {
    return (
      <div className="flex flex-col gap-5">
        <Link href={`/alugueres/${id}`} className="flex w-fit items-center gap-1 text-sm font-medium text-ink-700/70 hover:text-ink-900">
          <ChevronLeft className="size-4" /> Voltar ao aluguer
        </Link>
        <Card className="text-center">
          <Lock className="mx-auto size-8 text-ink-700/40" />
          <h1 className="mt-2 font-display text-xl font-semibold text-ink-950">Edição bloqueada</h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-700/65">
            Só é possível editar a marcação antes do levantamento. Este aluguer já saiu da loja
            (estado <strong>{r.status}</strong>) — já não há volta.
          </p>
        </Card>
      </div>
    );
  }

  const [cs, ms, items] = await Promise.all([
    db.select().from(customers).orderBy(customers.nome),
    db.select().from(materials).orderBy(materials.nome),
    db.select().from(rentalItems).where(eq(rentalItems.rentalId, id)),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/alugueres/${id}`} className="flex w-fit items-center gap-1 text-sm font-medium text-ink-700/70 hover:text-ink-900">
        <ChevronLeft className="size-4" /> Voltar ao aluguer
      </Link>
      <PageHeader title="Editar marcação" subtitle="Disponível apenas antes do levantamento." />
      <RentalEditForm
        rentalId={id}
        customers={cs}
        materials={ms}
        initial={{
          customerId: r.customerId,
          levantamento: toLocalInput(new Date(r.dataLevantamento)),
          evento: toLocalInput(new Date(r.dataEvento)),
          caucao: r.valorCaucao,
          pago: r.valorPago,
          obs: r.observacoes ?? "",
          linhas: items.map((i) => ({
            materialId: i.materialId,
            quantidade: i.quantidade,
            precoAcordado: i.precoAcordado,
          })),
        }}
      />
    </div>
  );
}
