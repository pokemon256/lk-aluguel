import { NextResponse } from "next/server";
import { marcarAtrasados } from "@/lib/actions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && (req.headers.get("authorization") ?? "") !== `Bearer ${secret}`)
    return NextResponse.json({ ok: false }, { status: 401 });
  try {
    await marcarAtrasados();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
