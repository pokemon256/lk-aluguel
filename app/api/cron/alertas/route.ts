import { NextResponse } from "next/server";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { customers, rentals } from "@/lib/schema";
import { notifyAllUsers } from "@/lib/notify";
import { formatData } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function dia(d: Date) {
  return d.toISOString().slice(0, 10);
}

function inicioDoDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function autorizado(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sem secret configurado, permite (dev); em prod configura CRON_SECRET
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// Cron diário (Vercel free: 1x/dia): D-1/D0 levantamento, devolução hoje/amanhã, atraso novo.
export async function GET(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = requireDb();
  const hoje = inicioDoDia(new Date());
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const depoisAmanha = new Date(hoje);
  depoisAmanha.setDate(depoisAmanha.getDate() + 2);
  const hojeISO = dia(hoje);

  // 1) Primeiro garante que atrasados estão marcados (reusa a regra do painel).
  await db.execute(
    sql`update rentals set status='ATRASADO' where data_devolucao_real is null and status in ('PENDENTE','ATIVO') and data_devolucao_prevista <= now()`,
  );

  // 2) Levantamentos: amanhã (D-1) e hoje (D0), ainda PENDENTE.
  const levAmanha = await db
    .select({ rental: rentals, customer: customers })
    .from(rentals)
    .leftJoin(customers, eq(customers.id, rentals.customerId))
    .where(
      and(
        eq(rentals.status, "PENDENTE"),
        gte(rentals.dataLevantamento, amanha),
        lt(rentals.dataLevantamento, depoisAmanha),
      ),
    )
    .limit(50);
  const fimHoje = new Date(amanha);
  const levHoje = await db
    .select({ rental: rentals, customer: customers })
    .from(rentals)
    .leftJoin(customers, eq(customers.id, rentals.customerId))
    .where(
      and(eq(rentals.status, "PENDENTE"), gte(rentals.dataLevantamento, hoje), lt(rentals.dataLevantamento, fimHoje)),
    )
    .limit(50);

  // 3) Devoluções previstas hoje e amanhã (ainda não devolvidos).
  const devHoje = await db
    .select({ rental: rentals, customer: customers })
    .from(rentals)
    .leftJoin(customers, eq(customers.id, rentals.customerId))
    .where(
      and(
        inArray(rentals.status, ["ATIVO", "ATRASADO", "PENDENTE"]),
        gte(rentals.dataDevolucaoPrevista, hoje),
        lt(rentals.dataDevolucaoPrevista, amanha),
      ),
    )
    .limit(50);
  const devAmanha = await db
    .select({ rental: rentals, customer: customers })
    .from(rentals)
    .leftJoin(customers, eq(customers.id, rentals.customerId))
    .where(
      and(
        inArray(rentals.status, ["ATIVO", "PENDENTE"]),
        gte(rentals.dataDevolucaoPrevista, amanha),
        lt(rentals.dataDevolucaoPrevista, depoisAmanha),
      ),
    )
    .limit(50);

  // 4) Atrasados (para o push de "atraso novo" — dedupeKey diária evita repetir todos os dias o mesmo).
  const atrasados = await db
    .select({ rental: rentals, customer: customers })
    .from(rentals)
    .leftJoin(customers, eq(customers.id, rentals.customerId))
    .where(eq(rentals.status, "ATRASADO"))
    .limit(50);

  let gerados = 0;
  const push = async (p: Parameters<typeof notifyAllUsers>[0]) => {
    await notifyAllUsers(p);
    gerados += 1;
  };

  for (const { rental: r, customer: c } of levAmanha) {
    await push({
      titulo: `Levantamento amanhã — ${c?.nome ?? "cliente"}`,
      corpo: `Preparar material. Levantamento ${formatData(r.dataLevantamento)}${c?.telefone ? ` · ${c.telefone}` : ""}.`,
      url: `/alugueres/${r.id}`,
      tipo: "levantamento-amanha",
      rentalId: r.id,
      dedupeKeyPrefix: `${r.id}:levantamento-amanha:${hojeISO}`,
    });
  }
  for (const { rental: r, customer: c } of levHoje) {
    await push({
      titulo: `Levantamento hoje — ${c?.nome ?? "cliente"}`,
      corpo: `O material sai hoje (${formatData(r.dataLevantamento)})${c?.telefone ? ` · ${c.telefone}` : ""}.`,
      url: `/alugueres/${r.id}`,
      tipo: "levantamento-hoje",
      rentalId: r.id,
      dedupeKeyPrefix: `${r.id}:levantamento-hoje:${hojeISO}`,
    });
  }
  for (const { rental: r, customer: c } of devAmanha) {
    await push({
      titulo: `Devolução amanhã — ${c?.nome ?? "cliente"}`,
      corpo: `Lembrar o cliente. Devolução prevista ${formatData(r.dataDevolucaoPrevista)}.`,
      url: `/alugueres/${r.id}`,
      tipo: "devolucao-amanha",
      rentalId: r.id,
      dedupeKeyPrefix: `${r.id}:devolucao-amanha:${hojeISO}`,
    });
  }
  for (const { rental: r, customer: c } of devHoje) {
    await push({
      titulo: `Devolução hoje — ${c?.nome ?? "cliente"}`,
      corpo: `Confirmar entrada do material ainda hoje${c?.telefone ? ` · ligar ${c.telefone}` : ""}.`,
      url: `/alugueres/${r.id}`,
      tipo: "devolucao-hoje",
      rentalId: r.id,
      dedupeKeyPrefix: `${r.id}:devolucao-hoje:${hojeISO}`,
    });
  }
  for (const { rental: r, customer: c } of atrasados) {
    await push({
      titulo: `Em atraso — ${c?.nome ?? "cliente"}`,
      corpo: `Devolução prevista era ${formatData(r.dataDevolucaoPrevista)}${c?.telefone ? ` · ligar ${c.telefone}` : ""}.`,
      url: `/alugueres/${r.id}`,
      tipo: "atraso",
      rentalId: r.id,
      dedupeKeyPrefix: `${r.id}:atraso:${hojeISO}`,
    });
  }

  return NextResponse.json({
    ok: true,
    gerados,
    resumo: {
      levAmanha: levAmanha.length,
      levHoje: levHoje.length,
      devHoje: devHoje.length,
      devAmanha: devAmanha.length,
      atrasados: atrasados.length,
    },
  });
}
