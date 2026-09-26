import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Phone } from "lucide-react";
import { loadCustomers } from "@/lib/data";
import { ClientCreateButton, ClientEditButton } from "@/components/client-form";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

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
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Clientes"
        subtitle={`${lista.length} clientes registados`}
        action={<ClientCreateButton />}
      />

      {lista.length === 0 ? (
        <EmptyState title="Ainda sem clientes" hint="Carrega em «Novo cliente» para registar o primeiro." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lista.map((c, i) => (
            <Card key={c.id} className="flex items-center gap-3.5 animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <Link href={`/clientes/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-base font-bold text-white">
                  {iniciais(c.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-950">{c.nome}</p>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-brand-700">
                    <Phone className="size-3.5" /> {c.telefone}
                  </span>
                  {c.notas && <p className="mt-0.5 truncate text-xs text-ink-700/60">{c.notas}</p>}
                </div>
              </Link>
              {c.bi && (
                <span className="hidden shrink-0 rounded-lg bg-cream-100 px-2 py-1 text-[11px] font-semibold text-ink-700 sm:block">
                  BI {c.bi}
                </span>
              )}
              <ClientEditButton customer={c} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
