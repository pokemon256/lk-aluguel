import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { loadMaterials, loadUserNames } from "@/lib/data";
import { materialIcon } from "@/lib/material-icons";
import { MaterialCreateButton, MaterialEditButton } from "@/components/material-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { formatKz } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATEGORY_TINT: Record<string, string> = {
  Mobiliário: "bg-brand-100 text-brand-700",
  Têxteis: "bg-violet-100 text-violet-700",
  Louças: "bg-sky-100 text-sky-700",
  Painéis: "bg-gold-100 text-gold-600",
  Decoração: "bg-pink-100 text-pink-700",
  Estruturas: "bg-emerald-100 text-emerald-700",
};

export default async function MateriaisPage() {
  const s = await auth();
  if (!s?.user) redirect("/login");
  const lista = await loadMaterials();
  if (!lista)
    return (
      <Card>
        Falta <code>DATABASE_URL</code>. Ver <code>.env.example</code>.
      </Card>
    );
  const nomes = await loadUserNames();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Materiais"
        subtitle={`${lista.length} artigos no inventário`}
        action={<MaterialCreateButton />}
      />

      {lista.length === 0 ? (
        <EmptyState title="Ainda sem materiais" hint="Adiciona o primeiro artigo no formulário acima." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lista.map((m, i) => {
            const Icon = materialIcon(m.icone);
            return (
              <Card key={m.id} className="flex items-center gap-3.5 animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", CATEGORY_TINT[m.categoria] ?? "bg-cream-100 text-ink-700")}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-950">{m.nome}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-700/60">
                    <Badge className="bg-cream-100 text-ink-700 ring-ink-900/10">{m.categoria}</Badge>
                    {m.origem === "TERCEIRIZADO" && (
                      <Badge className="bg-gold-100 text-gold-600 ring-gold-500/30">
                        Terceiro{m.fornecedorNome ? ` · ${m.fornecedorNome}` : ""}
                      </Badge>
                    )}
                    <span>Stock: <strong className="text-ink-900">{m.quantidadeTotal}</strong></span>
                    {m.createdById && (
                      <span>· por {nomes.get(m.createdById) ?? "—"}</span>
                    )}
                  </p>
                </div>
                <p className="shrink-0 font-display text-lg font-semibold text-ink-950">
                  {formatKz(m.precoUnitario)}
                </p>
                <MaterialEditButton material={m} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
