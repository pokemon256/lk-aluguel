import { config } from "dotenv";
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { requireDb } from "../lib/db";
import { customers, materials, users } from "../lib/schema";

function arg(name: string): string | undefined {
  const p = `--${name}=`;
  return process.argv.find((a) => a.startsWith(p))?.slice(p.length);
}

/**
 * Seed bootstrap: cria o PRIMEIRO admin só via args e só se a tabela users estiver vazia.
 * Uso: npm run db:seed -- --email=mae@lk-aluguel.ao --password='...' --nome='Nome'
 * Depois disso, os restantes users são criados no painel /utilizadores (só ADMIN).
 */
async function main() {
  const db = requireDb();

  const existentes = await db.select({ id: users.id }).from(users).limit(1);
  if (existentes.length === 0) {
    const email = arg("email")?.toLowerCase();
    const password = arg("password");
    const nome = arg("nome") ?? "Administração";
    if (!email || !password) {
      console.error(
        "Sem utilizadores na BD. Corre: npm run db:seed -- --email=EMAIL --password='SENHA_FORTE' [--nome='Nome']"
      );
      process.exit(1);
    }
    if (password.length < 8) {
      console.error("A palavra-passe do bootstrap deve ter pelo menos 8 caracteres.");
      process.exit(1);
    }
    await db.insert(users).values({
      email,
      nome,
      role: "ADMIN",
      ativo: true,
      passwordHash: await bcrypt.hash(password, 10),
    });
    console.log(`✔ Admin bootstrap criado: ${email}`);
  } else {
    console.log("✔ Tabela users já tem utilizadores — bootstrap ignorado.");
    // Permite promover/corrigir via args explícitos sem .env:
    const email = arg("email")?.toLowerCase();
    if (email) {
      const [u] = await db.select().from(users).where(eq(users.email, email));
      if (u) console.log(`ℹ Utilizador já existe: ${email} (${u.role})`);
      else console.log(`ℹ Para criar mais users usa o painel /utilizadores como ADMIN.`);
    }
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
