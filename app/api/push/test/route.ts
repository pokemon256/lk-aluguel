import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// Diagnóstico: envia push de teste para o próprio utilizador.
export async function POST() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const r = await sendPushToUser(user.id, {
    title: "LK Aluguel — teste",
    body: "Se estás a ler isto, o push está a funcionar!",
    url: "/",
  });
  return NextResponse.json({ ok: true, resultado: r });
}
