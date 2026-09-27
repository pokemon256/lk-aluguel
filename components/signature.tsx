import { formatDataHora } from "@/lib/format";
import type { AuditLog } from "@/lib/schema";

export const ACAO_LABEL: Record<string, string> = {
  "material.criar": "criou o material",
  "material.editar": "editou o material",
  "material.apagar": "apagou o material",
  "cliente.criar": "registou o cliente",
  "cliente.editar": "editou o cliente",
  "cliente.apagar": "apagou o cliente",
  "aluguer.criar": "criou o aluguer",
  "aluguer.editar": "editou a marcação",
  "aluguer.pagamento": "registou pagamento",
  "aluguer.ativar": "marcou levantado",
  "aluguer.concluir": "marcou devolvido",
  "aluguer.cancelar": "cancelou",
  "aluguer.problema": "marcou problema/quebra",
  "aluguer.pagar_total": "liquidou o total",
  "user.criar": "criou o utilizador",
  "user.editar": "editou o utilizador",
  "user.apagar": "apagou o utilizador",
  "user.password": "redefiniu a palavra-passe",
};

/** Linha discreta "Criado por X · Editado por Y em …" */
export function Assinatura({
  createdBy,
  updatedBy,
  updatedAt,
}: {
  createdBy?: string | null;
  updatedBy?: string | null;
  updatedAt?: Date | null;
}) {
  if (!createdBy && !updatedBy) return null;
  return (
    <p className="mt-1 text-[11px] text-ink-700/55">
      {createdBy ? `Registado por ${createdBy}` : null}
      {createdBy && updatedBy && updatedBy !== createdBy ? ` · editado por ${updatedBy}` : null}
      {!createdBy && updatedBy ? `Editado por ${updatedBy}` : null}
      {updatedAt ? ` · ${formatDataHora(updatedAt)}` : null}
    </p>
  );
}

/** Histórico completo (pagamentos, estados, edições) com o autor de cada ato. */
export function Historico({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) return null;
  return (
    <div className="rounded-3xl border border-ink-900/10 bg-white p-5 shadow-[0_1px_2px_rgba(23,15,12,0.05),0_12px_32px_-16px_rgba(23,15,12,0.18)] animate-rise">
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
        Histórico
      </h2>
      <ol className="mt-3 flex flex-col gap-2.5">
        {logs.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-ink-950">
                {l.actorEmail ?? "Sistema"}{" "}
                <span className="font-normal text-ink-700/60">
                  {ACAO_LABEL[l.acao] ?? l.acao}
                </span>
              </p>
              {l.acao === "aluguer.pagamento" && (
                <p className="text-xs text-ink-700/60">
                  Recebido {(l.detalhe as { recebido?: number } | null)?.recebido} Kz
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs text-ink-700/55">{formatDataHora(l.at)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
