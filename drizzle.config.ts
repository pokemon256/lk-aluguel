import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit corre fora do Next, por isso carregamos o env manualmente.
// Ordem: .env.local tem prioridade sobre .env (igual ao Next.js).
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/lk",
  },
} satisfies Config;
