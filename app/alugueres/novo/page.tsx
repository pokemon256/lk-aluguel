import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { loadCustomers, loadMaterials } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui/primitives";
import { RentalWizard } from "@/components/rental-wizard";

export default async function NovoAluguerPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const sp = await searchParams;
  const [cs, ms] = await Promise.all([loadCustomers(), loadMaterials()]);
  if (!cs || !ms) return <Card>Falta <code>DATABASE_URL</code>.</Card>;
  const preselected = sp.cliente && cs.some((c) => c.id === sp.cliente) ? sp.cliente : undefined;
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Novo aluguer" subtitle="Escolhe o cliente, as datas e os materiais — o saldo é calculado para essas datas." />
      <RentalWizard customers={cs} materials={ms} initialCustomerId={preselected} />
    </div>
  );
}
