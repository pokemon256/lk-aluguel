import { NextResponse } from "next/server";
import { marcarAtrasados } from "@/lib/actions";

export async function GET() {
  try {
    await marcarAtrasados();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
