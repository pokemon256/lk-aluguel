import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { CalendarCheck, CircleDollarSign, Users, Wallet } from "lucide-react";
import { requireDb } from "@/lib/db";
import { auditLogs, rentals } from "@/lib/schema";
import { loadCustomers, loadUserNames } from "@/lib/data";
import { ClientCreateButton } from "@/components/client-form";
import { ClientsClient, type ResumoCliente } from "@/components/client-details";
import type { AuditLog } from "@/lib/schema";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { formatKz } from "@/lib/format";

export default async function ClientesPage() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const lista = await loadCustomers();
  if (!lista)
    return (
      <Card>
        Falta <code>DATABASE_URL</code>. Ver <code>.env.example</code>.
      </Card>
    );
  const db = requireDb();
  const [nomesMap, rents, logs] = await Promise.all([
    loadUserNames(),
    db.select().from(rentals),
    db.select().from(auditLogs).orderBy(desc(auditLogs.at)).limit(300),
  ]);
  const names: Record<string, string> = Object.fromEntries(nomesMap);

  const porCliente = new Map<string, typeof rents>();
  for (const r of rents) {
    const arr = porCliente.get(r.customerId) ?? [];
    arr.push(r);
    porCliente.set(r.customerId, arr);
  }

  const resumos: Record<string, ResumoCliente> = Object.fromEntries(
    lista.map((c) => {
      const rs = (porCliente.get(c.id) ?? [])
        .filter((r) => r.status !== "CANCELADO")
        .sort((a, b) => +b.dataEvento - +a.dataEvento);
      const total = rs.reduce((t, r) => t + r.valorTotal, 0);
      const pago = rs.reduce((t, r) => t + r.valorPago, 0);
      return [
        c.id,
        {
          eventos: rs.length,
          total,
          emDivida: total - pago,
          temAtivos: rs.some((r) =>
            ["PENDENTE", "ATIVO", "ATRASADO"].includes(r.status)
          ),
          recentes: rs.slice(0, 5).map((r) => ({
            id: r.id,
            data: r.dataEvento,
            status: r.status,
            total: r.valorTotal,
          })),
        },
      ];
    })
  );

  const historicos: Record<string, AuditLog[]> = Object.fromEntries(
    lista.map((c) => [c.id, logs.filter((l) => l.entidade === "customers" && l.entidadeId === c.id).slice(0, 10)])
  );

  const comAtivos = lista.filter((c) => resumos[c.id]?.temAtivos).length;
  const divida = Object.values(resumos).reduce((t, r) => t + r.emDivida, 0);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const novos = lista.filter((c) => c.createdAt >= inicioMes).length;
  const stats = [
    { icon: Users, label: "Clientes", value: String(lista.length), tint: "bg-brand-100 text-brand-700" },
    { icon: CalendarCheck, label: "Com eventos ativos", value: String(comAtivos), tint: "bg-sky-100 text-sky-700" },
    { icon: Wallet, label: "Por receber", value: formatKz(divida), tint: "bg-gold-100 text-gold-600" },
    { icon: CircleDollarSign, label: "Novos este mês", value: String(novos), tint: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Clientes"
        subtitle="Clica num cliente para ver resumo, histórico, editar ou apagar."
        action={<ClientCreateButton />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((st, i) => (
          <Card
            key={st.label}
            className="flex items-center gap-3 animate-rise"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${st.tint}`}>
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
        <EmptyState title="Ainda sem clientes" hint="Carrega em «Novo cliente» para registar o primeiro." />
      ) : (
        <ClientsClient lista={lista} names={names} resumos={resumos} historicos={historicos} />
      )}
    </div>
  );
}
