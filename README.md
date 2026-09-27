# LK Aluguel — Gestão de aluguer de materiais de decoração

Next.js Full Stack (App Router) + Drizzle + Neon Postgres + Auth.js v5 + PWA. UI em PT-AO, valores em Kwanza (AOA).

## Arranque rápido

1. **Base de dados (Neon, grátis):** cria um projeto em https://neon.tech e copia a `DATABASE_URL`.
2. **Env:**
   ```bash
   cp .env.example .env.local
   # preenche DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)
   ```
3. **Migrar + seed (primeiro admin via args):**
   ```bash
   npm install
   npm run db:migrate   # ou: npm run db:push (mais simples em dev)
   npm run db:seed -- --email=mae@lk-aluguel.ao --password='SENHA_FORTE' --nome='Nome'
   npm run dev
   ```
4. Abre http://localhost:3000 → redireciona para `/login`. Entra com o admin bootstrap.
5. **Equipa:** como ADMIN, abre `/utilizadores` e cria os OPERADORes. Depois cria o admin definitivo e apaga o bootstrap.

## Utilizadores e auditoria

- Roles: `ADMIN` (tudo + gerir users em `/utilizadores`) e `OPERADOR` (operação diária).
- Contas desativadas (`ativo=false`) não conseguem entrar.
- Tudo fica assinado: `created_by / updated_by` em materiais, clientes e alugueres + tabela `audit_logs` (quem criou, editou, registou pagamento, mudou estado). O detalhe do aluguer mostra o histórico.

## Regras de negócio implementadas

- **Disponibilidade por intervalo:** `disponível = stock total − soma comprometida` em alugueres `PENDENTE/ATIVO/ATRASADO` com sobreposição `[levantamento, devolução prevista]`. Validado no servidor (`lib/availability.ts`) e com saldo live no wizard (`/api/availability`).
- **Devolução prevista automática:** evento + 24h.
- **Ciclo de vida:** `PENDENTE → ATIVO → CONCLUIDO`, com `ATRASADO` (cron + ao abrir o painel), `COM_PROBLEMA`, `CANCELADO`.
- **Pagamentos:** `valorPago` vs `valorTotal` → `PENDENTE/PARCIAL/PAGO`; caução registada por aluguer.
- **Calendário:** FullCalendar, amarelo=reserva, verde=ativo, vermelho=atraso; clique abre o aluguer.

## Scripts

| Comando | Para quê |
|---|---|
| `npm run dev` | dev (PWA desligado em dev) |
| `npm run build` | build produção (usa `--webpack` por causa do PWA) |
| `npm run db:generate` | gerar SQL a partir do schema |
| `npm run db:migrate` / `db:push` | aplicar à BD |
| `npm run db:seed` | primeiro admin (via args) + dados demo |

## Deploy na Vercel

1. Push para o GitHub, importa na Vercel.
2. Envs: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL=https://<teu-dominio>`.
3. Corre as migrações contra o Neon (`npm run db:migrate` local com a mesma URL).
4. Opcional: cron diário `GET /api/cron/marcar-atrasados` (Vercel Cron) para marcar atrasados.

## Fase 2 (por fazer)

Sub-alugueres de terceiros, módulo de quebras com abate na caução, recibos PDF.
