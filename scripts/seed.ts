import { config } from "dotenv";
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { requireDb } from "../lib/db";
import { customers, materials, users } from "../lib/schema";

async function main() {
  const db = requireDb();
  const email = (process.env.ADMIN_EMAIL ?? "mae@lk-aluguel.ao").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "lk123456";
  const nome = process.env.ADMIN_NOME ?? "LK Aluguel";

  const [exists] = await db.select().from(users).where(eq(users.email, email));
  if (!exists) {
    await db.insert(users).values({
      email,
      nome,
      passwordHash: await bcrypt.hash(password, 10),
    });
    console.log(`✔ Admin criado: ${email}`);
  } else {
    console.log(`✔ Admin já existe: ${email}`);
  }

  const mats = await db.select().from(materials);
  if (mats.length === 0) {
    await db.insert(materials).values([
      { nome: "Cadeira Tiffany branca", categoria: "Mobiliário", quantidadeTotal: 100, precoUnitario: 500 },
      { nome: "Mesa redonda 8 lugares", categoria: "Mobiliário", quantidadeTotal: 15, precoUnitario: 5000 },
      { nome: "Toalha branca", categoria: "Têxteis", quantidadeTotal: 60, precoUnitario: 800 },
      { nome: "Jarra de vidro", categoria: "Louças", quantidadeTotal: 40, precoUnitario: 1000 },
      { nome: "Painel ripado 2m", categoria: "Painéis", quantidadeTotal: 4, precoUnitario: 15000 },
      { nome: "Arco de flores", categoria: "Decoração", quantidadeTotal: 2, precoUnitario: 20000 },
      { nome: "Copo de vidro", categoria: "Louças", quantidadeTotal: 200, precoUnitario: 200 },
      { nome: "Tenda 5x5m", categoria: "Estruturas", quantidadeTotal: 3, precoUnitario: 35000, origem: "TERCEIRIZADO", fornecedorNome: "Parceiro Viana" },
    ]);
    console.log("✔ Materiais demo criados");
  }

  const custs = await db.select().from(customers);
  if (custs.length === 0) {
    await db.insert(customers).values([
      { nome: "Maria dos Santos", telefone: "923000001", bi: "001234567LA041", notas: "Casamento Benfica" },
      { nome: "Ana Paulo", telefone: "923000002", notas: "Aniversário Cazenga" },
      { nome: "Joana Manuel", telefone: "923000003" },
    ]);
    console.log("✔ Clientes demo criados");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
