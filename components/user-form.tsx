"use client";
import { useState } from "react";
import {
  ChevronRight,
  KeyRound,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { AuditLog, User } from "@/lib/schema";
import {
  apagarUtilizador,
  criarUtilizador,
  editarUtilizador,
  redefinirPassword,
} from "@/lib/user-actions";
import { Button } from "@/components/ui/button";
import { Badge, Input, Label, Select } from "@/components/ui/primitives";
import { PasswordInput } from "@/components/ui/password-input";
import { Modal } from "@/components/modal";
import { RightSheet } from "@/components/sheet";
import { ACAO_LABEL } from "@/components/signature";
import { formatDataHora } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Atividade = {
  materiais: number;
  clientes: number;
  alugueres: number;
  acoes: AuditLog[];
};

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      className={
        role === "ADMIN"
          ? "bg-ink-950 text-cream-50 ring-ink-950"
          : "bg-sky-50 text-sky-800 ring-sky-600/25"
      }
    >
      <ShieldCheck className="size-3" />
      {role}
    </Badge>
  );
}

function EstadoBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge
      className={
        ativo
          ? "bg-emerald-50 text-emerald-800 ring-emerald-600/25"
          : "bg-stone-100 text-stone-500 ring-stone-500/20"
      }
    >
      <span className={cn("size-1.5 rounded-full", ativo ? "bg-emerald-500" : "bg-stone-400")} />
      {ativo ? "Ativo" : "Desativado"}
    </Badge>
  );
}

/* ————————— Criar: modal ————————— */

export function UserCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Novo utilizador
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo utilizador"
        subtitle="O acesso é imediato após a criação."
      >
        <form
          action={criarUtilizador}
          onSubmit={() => setOpen(false)}
          className="grid gap-3 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <Label htmlFor="u-nome">Nome</Label>
            <Input id="u-nome" name="nome" required minLength={2} placeholder="Ex: Ana Paulo" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="u-email">Email</Label>
            <Input
              id="u-email"
              name="email"
              type="email"
              required
              placeholder="nome@lk-aluguel.ao"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="u-pass">Palavra-passe (mín. 8)</Label>
            <PasswordInput
              id="u-pass"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="u-role">Papel</Label>
            <Select id="u-role" name="role" defaultValue="OPERADOR">
              <option value="OPERADOR">OPERADOR — operação diária</option>
              <option value="ADMIN">ADMIN — gestão total</option>
            </Select>
          </div>
          <div className="mt-1 md:col-span-2">
            <Button type="submit" size="lg" className="w-full">
              Criar utilizador
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ————————— Sheet de detalhes ————————— */

function UserSheet({
  user,
  meId,
  criadoPor,
  atividade,
  onClose,
}: {
  user: User;
  meId: string;
  criadoPor: string;
  atividade: Atividade;
  onClose: () => void;
}) {
  const [aConfirmar, setAConfirmar] = useState(false);
  const [aEditar, setAEditar] = useState(false);
  const isSelf = user.id === meId;

  return (
    <RightSheet open onClose={onClose} title={user.nome} subtitle={user.email}>
      <div className="flex flex-col gap-5">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3.5">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-xl font-bold text-white">
            {iniciais(user.nome)}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <RoleBadge role={user.role} />
              <EstadoBadge ativo={user.ativo} />
              {isSelf && (
                <span className="text-xs font-medium text-ink-700/60">(és tu)</span>
              )}
            </p>
            <p className="mt-1.5 text-xs text-ink-700/60">
              Criado por {criadoPor} · {formatDataHora(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Editar / Eliminar */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setAEditar(true)}>
            <Pencil className="size-4" /> Editar
          </Button>
          {!isSelf && !aConfirmar ? (
            <Button
              variant="outline"
              onClick={() => setAConfirmar(true)}
              className="!border-red-600/30 !text-red-700 hover:!bg-red-600/10"
            >
              <Trash2 className="size-4" /> Eliminar
            </Button>
          ) : !isSelf ? (
            <form action={apagarUtilizador.bind(null, user.id)} className="col-span-2 rounded-2xl border border-red-600/25 bg-red-50/60 p-3">
              <p className="text-[13px] text-red-800">
                Apagar <strong>{user.nome}</strong>? O histórico assinado por ele é
                preservado (autor passa a vazio).
              </p>
              <div className="mt-2 flex gap-2">
                <Button type="submit" variant="danger" className="flex-1">
                  Sim, apagar
                </Button>
                <Button type="button" variant="secondary" onClick={() => setAConfirmar(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : null}
        </div>

        {/* Dados do utilizador */}
        <section className="rounded-2xl border border-ink-900/10 bg-white p-4">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/55">
            Dados do utilizador
          </h4>
          <dl className="mt-2.5 flex flex-col gap-2 text-sm">
            {[
              { label: "Nome", value: user.nome },
              { label: "Email", value: user.email },
              { label: "Papel", value: user.role === "ADMIN" ? "ADMIN — gestão total" : "OPERADOR — operação diária" },
              { label: "Estado", value: user.ativo ? "Ativo" : "Desativado" },
              { label: "Criado por", value: `${criadoPor} · ${formatDataHora(user.createdAt)}` },
            ].map((l) => (
              <div key={l.label} className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-ink-700/60">{l.label}</dt>
                <dd className="text-right font-medium break-all text-ink-950">{l.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Atividade */}
        <section className="rounded-2xl border border-ink-900/10 bg-white p-4">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/55">
            Atividade
          </h4>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Materiais", value: atividade.materiais },
              { label: "Clientes", value: atividade.clientes },
              { label: "Alugueres", value: atividade.alugueres },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-cream-50 px-2 py-2.5 ring-1 ring-inset ring-ink-900/5">
                <p className="font-display text-xl font-semibold text-ink-950">{s.value}</p>
                <p className="text-[11px] font-medium text-ink-700/60">{s.label}</p>
              </div>
            ))}
          </div>
          {atividade.acoes.length > 0 && (
            <ol className="mt-3 flex flex-col gap-2 border-t border-ink-900/8 pt-3">
              {atividade.acoes.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 text-[13px]">
                  <span className="text-ink-900">
                    {ACAO_LABEL[l.acao] ?? l.acao}
                    {l.acao === "aluguer.pagamento" && (
                      <span className="text-ink-700/60">
                        {" "}
                        · {(l.detalhe as { recebido?: number } | null)?.recebido} Kz
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-ink-700/55">
                    {formatDataHora(l.at)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Modal de edição */}
      <Modal
        open={aEditar}
        onClose={() => setAEditar(false)}
        title="Editar utilizador"
        subtitle={user.email}
      >
        <div className="flex flex-col gap-5">
          <form
            action={editarUtilizador.bind(null, user.id)}
            onSubmit={() => setAEditar(false)}
            className="grid gap-3"
          >
            <div>
              <Label>Nome</Label>
              <Input name="nome" defaultValue={user.nome} required minLength={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Papel</Label>
                <Select name="role" defaultValue={user.role}>
                  <option value="OPERADOR">OPERADOR</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-ink-900/15 px-3 text-sm text-ink-900">
                  <input
                    type="checkbox"
                    name="ativo"
                    defaultChecked={user.ativo}
                    className="size-4 accent-brand-600"
                  />
                  Ativo
                </label>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Guardar alterações
            </Button>
          </form>
          <div className="border-t border-ink-900/10 pt-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/55">
              <KeyRound className="size-3.5" /> Nova palavra-passe
            </h4>
            <form
              action={redefinirPassword.bind(null, user.id)}
              onSubmit={() => setAEditar(false)}
              className="mt-3 flex items-end gap-2"
            >
              <div className="flex-1">
                <PasswordInput
                  name="password"
                  required
                  minLength={8}
                  placeholder="Mín. 8 caracteres"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" variant="secondary">
                Definir
              </Button>
            </form>
          </div>
        </div>
      </Modal>
    </RightSheet>
  );
}

/* ————————— Lista ————————— */

export function UsersClient({
  users,
  meId,
  names,
  atividade,
}: {
  users: User[];
  meId: string;
  names: Record<string, string>;
  atividade: Record<string, Atividade>;
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const selecionado = users.find((u) => u.id === aberto) ?? null;

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {users.map((u, i) => (
          <button
            key={u.id}
            onClick={() => setAberto(u.id)}
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            className="flex items-center gap-3.5 rounded-3xl border border-ink-900/10 bg-white p-5 text-left shadow-[0_1px_2px_rgba(23,15,12,0.05),0_12px_32px_-16px_rgba(23,15,12,0.18)] transition-all animate-rise hover:border-brand-500/40 hover:shadow-lg cursor-pointer"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-base font-bold text-white">
              {iniciais(u.nome)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-semibold text-ink-950">{u.nome}</span>
                {u.id === meId && (
                  <span className="shrink-0 text-xs font-normal text-ink-700/60">(és tu)</span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-[13px] text-ink-700/65">
                {u.email}
              </span>
              <span className="mt-1.5 flex flex-wrap gap-1.5">
                <RoleBadge role={u.role} />
                <EstadoBadge ativo={u.ativo} />
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-ink-700/30" />
          </button>
        ))}
      </div>

      {selecionado && (
        <UserSheet
          user={selecionado}
          meId={meId}
          criadoPor={
            selecionado.createdById
              ? (names[selecionado.createdById] ?? "—")
              : "bootstrap/sistema"
          }
          atividade={
            atividade[selecionado.id] ?? { materiais: 0, clientes: 0, alugueres: 0, acoes: [] }
          }
          onClose={() => setAberto(null)}
        />
      )}
    </>
  );
}
