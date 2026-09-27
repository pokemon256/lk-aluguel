import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { requireDb } from "@/lib/db";
import { auditLogs, customers, materials, rentals, users } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { Card, PageHeader } from "@/components/ui/primitives";
import { UserCreateButton, UsersClient, type Atividade } from "@/components/user-form";

export default async function UtilizadoresPage() {
  let me;
  try {
    me = await requireAdmin();
  } catch {
    redirect("/");
  }
  const db = requireDb();
  const [lista, mats, custs, rents, logs] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(materials),
    db.select().from(customers),
    db.select().from(rentals),
    db.select().from(auditLogs).orderBy(desc(auditLogs.at)).limit(300),
  ]);
  const names: Record<string, string> = Object.fromEntries(
    lista.map((u) => [u.id, u.nome])
  );

  const atividade: Record<string, Atividade> = Object.fromEntries(
    lista.map((u) => {
      const acoes = logs.filter((l) => l.actorId === u.id).slice(0, 8);
      return [
        u.id,
        {
          materiais: mats.filter((m) => m.createdById === u.id).length,
          clientes: custs.filter((c) => c.createdById === u.id).length,
          alugueres: rents.filter((r) => r.createdById === u.id).length,
          acoes,
        },
      ];
    })
  );

  const nAdmin = lista.filter((u) => u.role === "ADMIN").length;
  const nAtivos = lista.filter((u) => u.ativo).length;
  const stats = [
    { icon: Users, label: "Equipa", value: lista.length },
    { icon: ShieldCheck, label: "Admins", value: nAdmin },
    { icon: UserCheck, label: "Ativos", value: nAtivos },
    { icon: UserX, label: "Desativados", value: lista.length - nAtivos },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Utilizadores"
        subtitle="Quem tem acesso à loja. Clica num elemento para ver detalhes, editar ou apagar."
        action={<UserCreateButton />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <Card
            key={s.label}
            className="flex items-center gap-3 animate-rise"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <s.icon className="size-5" />
            </span>
            <span>
              <span className="block font-display text-xl font-semibold text-ink-950">
                {s.value}
              </span>
              <span className="block text-xs font-medium text-ink-700/60">{s.label}</span>
            </span>
          </Card>
        ))}
      </div>

      <UsersClient users={lista} meId={me.id} names={names} atividade={atividade} />

      <p className="text-xs text-ink-700/55">
        Todas as ações (criação, edição, palavra-passe, eliminação) ficam registadas na
        auditoria com o autor. Eliminar nunca apaga o histórico: o autor passa a vazio.
      </p>
    </div>
  );
}
