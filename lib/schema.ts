import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const rentalStatusEnum = pgEnum("rental_status", [
  "PENDENTE",
  "ATIVO",
  "CONCLUIDO",
  "ATRASADO",
  "COM_PROBLEMA",
  "CANCELADO",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDENTE",
  "PARCIAL",
  "PAGO",
]);

export const materialOrigemEnum = pgEnum("material_origem", [
  "PROPRIO",
  "TERCEIRIZADO",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nome: text("nome").notNull().default("Administradora"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull().default("Geral"),
  quantidadeTotal: integer("quantidade_total").notNull().default(0),
  precoUnitario: integer("preco_unitario").notNull().default(0), // Kz
  icone: text("icone"), // chave do catálogo em lib/material-icons.ts
  origem: materialOrigemEnum("origem").notNull().default("PROPRIO"),
  fornecedorNome: text("fornecedor_nome"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull().unique(),
  bi: text("bi"),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rentals = pgTable("rentals", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  dataLevantamento: timestamp("data_levantamento", { withTimezone: true }).notNull(),
  dataEvento: timestamp("data_evento", { withTimezone: true }).notNull(),
  dataDevolucaoPrevista: timestamp("data_devolucao_prevista", {
    withTimezone: true,
  }).notNull(),
  dataDevolucaoReal: timestamp("data_devolucao_real", { withTimezone: true }),
  status: rentalStatusEnum("status").notNull().default("PENDENTE"),
  valorTotal: integer("valor_total").notNull().default(0), // Kz
  valorPago: integer("valor_pago").notNull().default(0), // Kz
  valorCaucao: integer("valor_caucao").notNull().default(0), // Kz
  statusPagamento: paymentStatusEnum("status_pagamento")
    .notNull()
    .default("PENDENTE"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rentalItems = pgTable("rental_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  rentalId: uuid("rental_id")
    .notNull()
    .references(() => rentals.id, { onDelete: "cascade" }),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id),
  quantidade: integer("quantidade").notNull(),
  precoAcordado: integer("preco_acordado").notNull(), // Kz unitário neste evento
});

export const customersRelations = relations(customers, ({ many }) => ({
  rentals: many(rentals),
}));

export const rentalsRelations = relations(rentals, ({ one, many }) => ({
  customer: one(customers, {
    fields: [rentals.customerId],
    references: [customers.id],
  }),
  items: many(rentalItems),
}));

export const rentalItemsRelations = relations(rentalItems, ({ one }) => ({
  rental: one(rentals, {
    fields: [rentalItems.rentalId],
    references: [rentals.id],
  }),
  material: one(materials, {
    fields: [rentalItems.materialId],
    references: [materials.id],
  }),
}));

export type Material = typeof materials.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Rental = typeof rentals.$inferSelect;
export type RentalItem = typeof rentalItems.$inferSelect;
export type RentalStatus = (typeof rentalStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
