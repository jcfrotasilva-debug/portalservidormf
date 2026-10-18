CREATE TABLE "requerimento_anexos" (
	"id" serial PRIMARY KEY NOT NULL,
	"requerimento_id" integer NOT NULL,
	"nome" text NOT NULL,
	"mime" text NOT NULL,
	"tamanho" integer NOT NULL,
	"conteudo" text NOT NULL,
	"origem" text NOT NULL,
	"autor" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requerimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"servidor_id" integer NOT NULL,
	"protocolo" text NOT NULL,
	"tipo" text NOT NULL,
	"assunto" text NOT NULL,
	"descricao" text NOT NULL,
	"status" text DEFAULT 'protocolado' NOT NULL,
	"parecer" text,
	"analisado_por" text,
	"analisado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requerimento_anexos" ADD CONSTRAINT "requerimento_anexos_requerimento_id_requerimentos_id_fk" FOREIGN KEY ("requerimento_id") REFERENCES "public"."requerimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requerimentos" ADD CONSTRAINT "requerimentos_servidor_id_servidores_id_fk" FOREIGN KEY ("servidor_id") REFERENCES "public"."servidores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "requerimento_anexos_req_idx" ON "requerimento_anexos" USING btree ("requerimento_id");--> statement-breakpoint
CREATE UNIQUE INDEX "requerimentos_protocolo_unico" ON "requerimentos" USING btree ("protocolo");--> statement-breakpoint
CREATE INDEX "requerimentos_servidor_idx" ON "requerimentos" USING btree ("servidor_id");--> statement-breakpoint
CREATE INDEX "requerimentos_status_idx" ON "requerimentos" USING btree ("status");