import { z } from "zod";

export const materialSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  categoria: z.string().min(1).default("Geral"),
  quantidadeTotal: z.coerce.number().int().min(0),
  precoUnitario: z.coerce.number().int().min(0),
  origem: z.enum(["PROPRIO", "TERCEIRIZADO"]).default("PROPRIO"),
  fornecedorNome: z.string().optional().nullable(),
  icone: z.string().max(40).optional().nullable(),
});

export const customerSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  telefone: z.string().min(9, "Telefone inválido"),
  bi: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const rentalItemInput = z.object({
  materialId: z.string().uuid(),
  quantidade: z.coerce.number().int().min(1),
  precoAcordado: z.coerce.number().int().min(0),
});

export const rentalSchema = z
  .object({
    customerId: z.string().uuid("Escolhe um cliente"),
    dataLevantamento: z.coerce.date(),
    dataEvento: z.coerce.date(),
    valorCaucao: z.coerce.number().int().min(0).default(0),
    valorPago: z.coerce.number().int().min(0).default(0),
    observacoes: z.string().optional().nullable(),
    items: z.array(rentalItemInput).min(1, "Adiciona pelo menos 1 material"),
  })
  .refine((v) => v.dataLevantamento <= v.dataEvento, {
    message: "Levantamento deve ser antes ou no dia do evento",
    path: ["dataLevantamento"],
  });

export const userCreateSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["ADMIN", "OPERADOR"]).default("OPERADOR"),
});

export const userUpdateSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  role: z.enum(["ADMIN", "OPERADOR"]),
  ativo: z.coerce.boolean(),
});

export const userPasswordSchema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type RentalInput = z.infer<typeof rentalSchema>;
