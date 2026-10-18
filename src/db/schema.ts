import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Cadastro funcional do servidor.
 * Todas as colunas do pré-cadastro em planilha (NOME, CPF, RGCIN, DI, DTNASC,
 * TEL, E-MAIL, CLASSE, CARGO, CATEGORIA, JORNADA, LOTACAO, SITUACAO) são
 * representadas aqui. Campos de texto permanecem anuláveis quando a célula
 * vier vazia na planilha, e a pendência fica registrada em `pendencias`.
 */
export const servidores = pgTable(
  "servidores",
  {
    id: serial("id").primaryKey(),
    nome: text("nome").notNull(),
    nomeBusca: text("nome_busca").notNull(),
    cpf: text("cpf"),
    rgcin: text("rgcin"),
    /** DI = Dígito de Identificação do cargo/vínculo (ex.: "1", "2", "ACT-F").
     *  Diferencia vínculos distintos do MESMO servidor. Não é data. */
    di: text("di"),
    dtnasc: date("dtnasc"),
    tel: text("tel"),
    email: text("email"),
    classe: text("classe"),
    cargo: text("cargo"),
    categoria: text("categoria"),
    jornada: text("jornada"),
    lotacao: text("lotacao"),
    situacao: text("situacao").notNull().default("Ativo"),
    pendencias: jsonb("pendencias").$type<string[]>().notNull().default([]),
    camposVazios: jsonb("campos_vazios").$type<string[]>().notNull().default([]),
    origem: text("origem").notNull().default("importacao"),
    importacaoId: integer("importacao_id"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Mesmo CPF pode ter mais de um vínculo, diferenciado pelo DI.
    uniqueIndex("servidores_cpf_di_unico").on(table.cpf, table.di),
    index("servidores_nome_busca_idx").on(table.nomeBusca),
  ],
);

/**
 * ATS — Adicional por Tempo de Serviço (quinquênio).
 * A projeção da data do próximo quinquênio é sempre
 * `data_vigencia + 1825 dias`, calculada pela aplicação.
 */
export const atsQuinquenios = pgTable(
  "ats_quinquenios",
  {
    id: serial("id").primaryKey(),
    servidorId: integer("servidor_id")
      .notNull()
      .references(() => servidores.id, { onDelete: "cascade" }),
    tipo: integer("tipo").notNull(),
    dataVigencia: date("data_vigencia").notNull(),
    dataDoe: date("data_doe"),
    dataProximoProjetada: date("data_proximo_projetada").notNull(),
    observacao: text("observacao"),
    criadoPor: text("criado_por").notNull().default("Gestor"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ats_servidor_tipo_unico").on(table.servidorId, table.tipo),
    index("ats_servidor_idx").on(table.servidorId),
  ],
);

/**
 * Evolução Funcional — concessões já publicadas.
 * O gestor registra apenas o ato publicado (tipo, vigência, DOE e próxima data).
 * O interstício, a pontuação mínima e os pesos por fator vêm da tabela do
 * quadro funcional (Docentes PEB-I/PEB-II ou Suporte Pedagógico).
 */
export const evolucoes = pgTable(
  "evolucoes",
  {
    id: serial("id").primaryKey(),
    servidorId: integer("servidor_id")
      .notNull()
      .references(() => servidores.id, { onDelete: "cascade" }),
    tipo: integer("tipo").notNull(),
    quadro: text("quadro").notNull(),
    nivelOrigem: text("nivel_origem").notNull(),
    nivelDestino: text("nivel_destino").notNull(),
    intersticioAnos: integer("intersticio_anos").notNull(),
    pontuacaoMinima: integer("pontuacao_minima").notNull(),
    pesoAtualizacao: integer("peso_atualizacao").notNull(),
    pesoAperfeicoamento: integer("peso_aperfeicoamento").notNull(),
    pesoProducao: integer("peso_producao").notNull(),
    pontuacaoComprovada: integer("pontuacao_comprovada"),
    dataVigencia: date("data_vigencia").notNull(),
    dataDoe: date("data_doe"),
    dataProxima: date("data_proxima").notNull(),
    observacao: text("observacao"),
    criadoPor: text("criado_por").notNull().default("Gestor"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("evolucoes_servidor_tipo_unico").on(table.servidorId, table.tipo),
    index("evolucoes_servidor_idx").on(table.servidorId),
  ],
);

/**
 * Licença-Prêmio — certidões concedidas.
 * Cada certidão nasce com saldo positivo de 90 dias.
 */
export const licencaCertidoes = pgTable(
  "licenca_certidoes",
  {
    id: serial("id").primaryKey(),
    servidorId: integer("servidor_id")
      .notNull()
      .references(() => servidores.id, { onDelete: "cascade" }),
    numero: text("numero").notNull(),
    ano: integer("ano").notNull(),
    periodoInicial: date("periodo_inicial").notNull(),
    periodoFinal: date("periodo_final").notNull(),
    dataDoe: date("data_doe"),
    diasConcedidos: integer("dias_concedidos").notNull().default(90),
    observacao: text("observacao"),
    criadoPor: text("criado_por").notNull().default("Gestor"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("licenca_certidoes_numero_unico").on(table.servidorId, table.numero, table.ano),
    index("licenca_certidoes_servidor_idx").on(table.servidorId),
  ],
);

/**
 * Fruições da licença-prêmio: gozo em dias (15 a 90) ou pecúnia (30 dias),
 * sempre vinculadas ao servidor e a uma certidão, debitando o saldo.
 */
export const licencaFruicoes = pgTable(
  "licenca_fruicoes",
  {
    id: serial("id").primaryKey(),
    certidaoId: integer("certidao_id")
      .notNull()
      .references(() => licencaCertidoes.id, { onDelete: "cascade" }),
    servidorId: integer("servidor_id")
      .notNull()
      .references(() => servidores.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull().default("gozo"),
    dias: integer("dias").notNull(),
    dataInicio: date("data_inicio"),
    dataFim: date("data_fim"),
    dataDoeAutorizacao: date("data_doe_autorizacao"),
    ano: integer("ano"),
    dataDoePecunia: date("data_doe_pecunia"),
    observacao: text("observacao"),
    criadoPor: text("criado_por").notNull().default("Gestor"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("licenca_fruicoes_certidao_idx").on(table.certidaoId),
    index("licenca_fruicoes_servidor_idx").on(table.servidorId),
  ],
);

/** Histórico de cargas da planilha de pré-cadastro. */
export const importacoes = pgTable("importacoes", {
  id: serial("id").primaryKey(),
  arquivo: text("arquivo").notNull(),
  formato: text("formato").notNull().default("xlsx"),
  totalLinhas: integer("total_linhas").notNull().default(0),
  novas: integer("novas").notNull().default(0),
  atualizadas: integer("atualizadas").notNull().default(0),
  ignoradas: integer("ignoradas").notNull().default(0),
  comPendencias: integer("com_pendencias").notNull().default(0),
  celulasVaziasTratadas: integer("celulas_vazias_tratadas").notNull().default(0),
  criadoPor: text("criado_por").notNull().default("Gestor"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

/** Configurações internas da plataforma (ex.: senha do gestor). */
export const configs = pgTable("configs", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

/** Trilha de auditoria de tudo que o gestor faz na base. */
export const auditoria = pgTable(
  "auditoria",
  {
    id: serial("id").primaryKey(),
    entidade: text("entidade").notNull(),
    entidadeId: integer("entidade_id"),
    acao: text("acao").notNull(),
    detalhe: text("detalhe"),
    autor: text("autor").notNull().default("Gestor"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("auditoria_entidade_idx").on(table.entidade, table.entidadeId)],
);

export type Servidor = typeof servidores.$inferSelect;
export type Novo_servidor = typeof servidores.$inferInsert;
export type AtsQuinquenio = typeof atsQuinquenios.$inferSelect;
export type NovoAtsQuinquenio = typeof atsQuinquenios.$inferInsert;
export type Importacao = typeof importacoes.$inferSelect;
export type Evolucao = typeof evolucoes.$inferSelect;
export type NovaEvolucao = typeof evolucoes.$inferInsert;
export type LicencaCertidao = typeof licencaCertidoes.$inferSelect;
export type LicencaFruicao = typeof licencaFruicoes.$inferSelect;
