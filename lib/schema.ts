import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "OPERADOR"]);

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
  role: userRoleEnum("role").notNull().default("OPERADOR"),
  ativo: boolean("ativo").notNull().default(true),
  // Sem FK inline (auto-referência quebra a inferência de tipos do Drizzle);
  // a integridade é garantida pela aplicação (requireAdmin / audit).
  createdById: uuid("created_by_id"),
  updatedById: uuid("updated_by_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
  updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull().unique(),
  bi: text("bi"),
  notas: text("notas"),
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
  updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
  updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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

// Centro de notificações (sino + push): 1 linha por utilizador por evento.
// dedupeKey evita spam nos alertas temporais do cron (ex: rentalId:levantamento-amanha:2026-09-28).
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rentalId: uuid("rental_id").references(() => rentals.id, { onDelete: "set null" }),
  titulo: text("titulo").notNull(),
  corpo: text("corpo").notNull(),
  url: text("url"),
  lida: boolean("lida").notNull().default(false),
  tipo: text("tipo"),
  dedupeKey: text("dedupe_key").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Subscrições Web Push por aparelho (upsert por endpoint: reinstall reativa sem duplicar).
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorEmail: text("actor_email"),
  acao: text("acao").notNull(),
  entidade: text("entidade").notNull(),
  entidadeId: text("entidade_id"),
  detalhe: jsonb("detalhe"),
});

export type Material = typeof materials.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Rental = typeof rentals.$inferSelect;
export type RentalItem = typeof rentalItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type RentalStatus = (typeof rentalStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
