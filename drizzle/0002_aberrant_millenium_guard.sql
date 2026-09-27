CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'OPERADOR');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"acao" text NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" text,
	"detalhe" jsonb
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_by_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "updated_by_id" uuid;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "updated_by_id" uuid;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'OPERADOR' NOT NULL;--> statement-breakpoint
-- O primeiro utilizador existente (admin original do seed) é promovido a ADMIN;
-- os restantes mantêm OPERADOR e podem ser ajustados no painel /utilizadores.
UPDATE "users" SET "role"='ADMIN' WHERE "id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ativo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_by_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;