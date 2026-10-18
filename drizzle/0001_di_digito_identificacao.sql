CREATE TABLE "configs" (
	"chave" text PRIMARY KEY NOT NULL,
	"valor" text NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "servidores_cpf_unico";--> statement-breakpoint
ALTER TABLE "servidores" ALTER COLUMN "di" SET DATA TYPE text;--> statement-breakpoint
CREATE UNIQUE INDEX "servidores_cpf_di_unico" ON "servidores" USING btree ("cpf","di");