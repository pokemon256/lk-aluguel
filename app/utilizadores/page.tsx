import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { apagarUtilizador, criarUtilizador, editarUtilizador } from "@/lib/user-actions";
import { Badge, Card, Input, Label, PageHeader, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function UtilizadoresPage() {
  let me;
  try {
    me = await requireAdmin();
  } catch {
    redirect("/");
  }
  const db = requireDb();
  const lista = await db.select().from(users).orderBy(desc(users.createdAt));
  const nomes = new Map(lista.map((u) => [u.id, u.nome]));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Utilizadores"
        subtitle="Só ADMIN. Quem cria, edita ou desativa fica registado na auditoria."
      />

      <Card className="animate-rise">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
          Novo utilizador
        </h2>
        <form action={criarUtilizador} className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required minLength={2} placeholder="Ex: Ana Paulo" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="nome@lk-aluguel.ao" />
          </div>
          <div>
            <Label htmlFor="password">Palavra-passe (mín. 8)</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <div>
            <Label htmlFor="role">Papel</Label>
            <Select id="role" name="role" defaultValue="OPERADOR">
              <option value="OPERADOR">OPERADOR — operação diária</option>
              <option value="ADMIN">ADMIN — gestão total + users</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Criar utilizador</Button>
          </div>
        </form>
      </Card>

      <Card className="animate-rise">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
          Equipa ({lista.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {lista.map((u) => (
            <form
              key={u.id}
              action={editarUtilizador.bind(null, u.id)}
              className="rounded-2xl border border-ink-900/10 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-950">
                    {u.nome}{" "}
                    {u.id === me.id && (
                      <span className="text-xs font-normal text-ink-700/60">(és tu)</span>
                    )}
                  </p>
                  <p className="text-sm text-ink-700/65">{u.email}</p>
                  <p className="mt-1 text-xs text-ink-700/55">
                    Criado por {u.createdById ? (nomes.get(u.createdById) ?? "—") : "bootstrap/sistema"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    className={
                      u.role === "ADMIN"
                        ? "bg-ink-950 text-cream-50 ring-ink-950"
                        : "bg-sky-50 text-sky-800 ring-sky-600/25"
                    }
                  >
                    {u.role}
                  </Badge>
                  <Badge
                    className={
                      u.ativo
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-600/25"
                        : "bg-stone-100 text-stone-500 ring-stone-500/20"
                    }
                  >
                    {u.ativo ? "Ativo" : "Desativado"}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label>Nome</Label>
                  <Input name="nome" defaultValue={u.nome} required minLength={2} />
                </div>
                <div>
                  <Label>Papel</Label>
                  <Select name="role" defaultValue={u.role}>
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex h-11 items-center gap-2 rounded-xl border border-ink-900/15 px-3 text-sm">
                    <input
                      type="checkbox"
                      name="ativo"
                      defaultChecked={u.ativo}
                      className="size-4 accent-current"
                    />
                    Ativo
                  </label>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button type="submit" variant="outline">
                  Guardar
                </Button>
                {u.id !== me.id && (
                  <Button
                    type="submit"
                    variant="ghost"
                    formAction={apagarUtilizador.bind(null, u.id)}
                    className="text-red-700 hover:text-red-800"
                  >
                    Apagar
                  </Button>
                )}
              </div>
            </form>
          ))}
        </div>
      </Card>
    </div>
  );
}
