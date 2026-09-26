import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAvailableQuantities } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const s = await auth();
  if (!s?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const exclude = searchParams.get("exclude") ?? undefined;
  if (!inicio || !fim) return NextResponse.json({ error: "inicio/fim em falta" }, { status: 400 });
  try {
    const dados = await getAvailableQuantities(new Date(inicio), new Date(fim), exclude);
    return NextResponse.json(dados);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
