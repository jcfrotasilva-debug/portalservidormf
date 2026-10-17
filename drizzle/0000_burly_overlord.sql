CREATE TABLE "ats_quinquenios" (
	"id" serial PRIMARY KEY NOT NULL,
	"servidor_id" integer NOT NULL,
	"tipo" integer NOT NULL,
	"data_vigencia" date NOT NULL,
	"data_doe" date,
	"data_proximo_projetada" date NOT NULL,
	"observacao" text,
	"criado_por" text DEFAULT 'Gestor' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" integer,
	"acao" text NOT NULL,
	"detalhe" text,
	"autor" text DEFAULT 'Gestor' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evolucoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"servidor_id" integer NOT NULL,
	"tipo" integer NOT NULL,
	"quadro" text NOT NULL,
	"nivel_origem" text NOT NULL,
	"nivel_destino" text NOT NULL,
	"intersticio_anos" integer NOT NULL,
	"pontuacao_minima" integer NOT NULL,
	"peso_atualizacao" integer NOT NULL,
	"peso_aperfeicoamento" integer NOT NULL,
	"peso_producao" integer NOT NULL,
	"pontuacao_comprovada" integer,
	"data_vigencia" date NOT NULL,
	"data_doe" date,
	"data_proxima" date NOT NULL,
	"observacao" text,
	"criado_por" text DEFAULT 'Gestor' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "importacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"arquivo" text NOT NULL,
	"formato" text DEFAULT 'xlsx' NOT NULL,
	"total_linhas" integer DEFAULT 0 NOT NULL,
	"novas" integer DEFAULT 0 NOT NULL,
	"atualizadas" integer DEFAULT 0 NOT NULL,
	"ignoradas" integer DEFAULT 0 NOT NULL,
	"com_pendencias" integer DEFAULT 0 NOT NULL,
	"celulas_vazias_tratadas" integer DEFAULT 0 NOT NULL,
	"criado_por" text DEFAULT 'Gestor' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licenca_certidoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"servidor_id" integer NOT NULL,
	"numero" text NOT NULL,
	"ano" integer NOT NULL,
	"periodo_inicial" date NOT NULL,
	"periodo_final" date NOT NULL,
	"data_doe" date,
	"dias_concedidos" integer DEFAULT 90 NOT NULL,
	"observacao" text,
	"criado_por" text DEFAULT 'Gestor' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licenca_fruicoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"certidao_id" integer NOT NULL,
	"servidor_id" integer NOT NULL,
	"tipo" text DEFAULT 'gozo' NOT NULL,
	"dias" integer NOT NULL,
	"data_inicio" date,
	"data_fim" date,
	"data_doe_autorizacao" date,
	"ano" integer,
	"data_doe_pecunia" date,
	"observacao" text,
	"criado_por" text DEFAULT 'Gestor' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servidores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"nome_busca" text NOT NULL,
	"cpf" text,
	"rgcin" text,
	"di" date,
	"dtnasc" date,
	"tel" text,
	"email" text,
	"classe" text,
	"cargo" text,
	"categoria" text,
	"jornada" text,
	"lotacao" text,
	"situacao" text DEFAULT 'Ativo' NOT NULL,
	"pendencias" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"campos_vazios" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"origem" text DEFAULT 'importacao' NOT NULL,
	"importacao_id" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ats_quinquenios" ADD CONSTRAINT "ats_quinquenios_servidor_id_servidores_id_fk" FOREIGN KEY ("servidor_id") REFERENCES "public"."servidores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evolucoes" ADD CONSTRAINT "evolucoes_servidor_id_servidores_id_fk" FOREIGN KEY ("servidor_id") REFERENCES "public"."servidores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenca_certidoes" ADD CONSTRAINT "licenca_certidoes_servidor_id_servidores_id_fk" FOREIGN KEY ("servidor_id") REFERENCES "public"."servidores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenca_fruicoes" ADD CONSTRAINT "licenca_fruicoes_certidao_id_licenca_certidoes_id_fk" FOREIGN KEY ("certidao_id") REFERENCES "public"."licenca_certidoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenca_fruicoes" ADD CONSTRAINT "licenca_fruicoes_servidor_id_servidores_id_fk" FOREIGN KEY ("servidor_id") REFERENCES "public"."servidores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ats_servidor_tipo_unico" ON "ats_quinquenios" USING btree ("servidor_id","tipo");--> statement-breakpoint
CREATE INDEX "ats_servidor_idx" ON "ats_quinquenios" USING btree ("servidor_id");--> statement-breakpoint
CREATE INDEX "auditoria_entidade_idx" ON "auditoria" USING btree ("entidade","entidade_id");--> statement-breakpoint
CREATE UNIQUE INDEX "evolucoes_servidor_tipo_unico" ON "evolucoes" USING btree ("servidor_id","tipo");--> statement-breakpoint
CREATE INDEX "evolucoes_servidor_idx" ON "evolucoes" USING btree ("servidor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "licenca_certidoes_numero_unico" ON "licenca_certidoes" USING btree ("servidor_id","numero","ano");--> statement-breakpoint
CREATE INDEX "licenca_certidoes_servidor_idx" ON "licenca_certidoes" USING btree ("servidor_id");--> statement-breakpoint
CREATE INDEX "licenca_fruicoes_certidao_idx" ON "licenca_fruicoes" USING btree ("certidao_id");--> statement-breakpoint
CREATE INDEX "licenca_fruicoes_servidor_idx" ON "licenca_fruicoes" USING btree ("servidor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "servidores_cpf_unico" ON "servidores" USING btree ("cpf");--> statement-breakpoint
CREATE INDEX "servidores_nome_busca_idx" ON "servidores" USING btree ("nome_busca");