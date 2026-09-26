import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// NOTA: lê process.env de forma preguiçosa (dentro das funções) para que
// scripts fora do Next (tsx/drizzle-kit) possam carregar o .env primeiro.
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Permite `next build` sem BD; rotas que usam a BD lançam erro claro em runtime.
    return null;
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

let cached: ReturnType<typeof createDb> | undefined;

export function requireDb() {
  if (cached === undefined) cached = createDb();
  if (!cached)
    throw new Error("DATABASE_URL em falta. Cria um ficheiro .env (ver .env.example) com a URL do Neon.");
  return cached;
}

// Compat: código antigo que importe { db } continua a funcionar dentro do Next.
// Fora do Next (seed), prefere requireDb() depois de carregar o dotenv.
export const db = typeof process.env.DATABASE_URL === "string" ? createDb() : null;
