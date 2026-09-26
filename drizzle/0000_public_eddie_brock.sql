CREATE TYPE "public"."material_origem" AS ENUM('PROPRIO', 'TERCEIRIZADO');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDENTE', 'PARCIAL', 'PAGO');--> statement-breakpoint
CREATE TYPE "public"."rental_status" AS ENUM('PENDENTE', 'ATIVO', 'CONCLUIDO', 'ATRASADO', 'COM_PROBLEMA', 'CANCELADO');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"bi" text,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_telefone_unique" UNIQUE("telefone")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"categoria" text DEFAULT 'Geral' NOT NULL,
	"quantidade_total" integer DEFAULT 0 NOT NULL,
	"preco_unitario" integer DEFAULT 0 NOT NULL,
	"origem" "material_origem" DEFAULT 'PROPRIO' NOT NULL,
	"fornecedor_nome" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_acordado" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"data_levantamento" timestamp with time zone NOT NULL,
	"data_evento" timestamp with time zone NOT NULL,
	"data_devolucao_prevista" timestamp with time zone NOT NULL,
	"data_devolucao_real" timestamp with time zone,
	"status" "rental_status" DEFAULT 'PENDENTE' NOT NULL,
	"valor_total" integer DEFAULT 0 NOT NULL,
	"valor_pago" integer DEFAULT 0 NOT NULL,
	"valor_caucao" integer DEFAULT 0 NOT NULL,
	"status_pagamento" "payment_status" DEFAULT 'PENDENTE' NOT NULL,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"nome" text DEFAULT 'Administradora' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;