import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  atsQuinquenios,
  auditoria,
  evolucoes,
  importacoes,
  licencaCertidoes,
  licencaFruicoes,
  servidores,
} from "@/db/schema";
import { projetarProximoQuinquenio } from "@/lib/ats";
import { projetarProximaEvolucao, regraPorTipo } from "@/lib/evolucao";

/**
 * Base de demonstração do sandbox.
 * Pode ser recriada a qualquer momento pelo endpoint POST /api/sandbox/reset.
 * Todos os dados são fictícios e servem apenas para testes.
 */

function busca(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

type Semente = {
  nome: string;
  cpf: string | null;
  rgcin: string | null;
  di: string | null;
  dtnasc: string | null;
  tel: string | null;
  email: string | null;
  classe: string | null;
  cargo: string | null;
  categoria: string | null;
  jornada: string | null;
  lotacao: string | null;
  situacao: string;
  pendencias: string[];
  camposVazios: string[];
  origem: string;
  quinquenios: { tipo: number; vigencia: string; doe: string | null; observacao?: string }[];
  evolucoes: {
    tipo: number;
    quadro: "docente" | "suporte";
    vigencia: string;
    doe: string | null;
    pontos: number | null;
    observacao?: string;
  }[];
  licencas: {
    numero: string;
    ano: number;
    periodoInicial: string;
    periodoFinal: string;
    doe: string | null;
    fruicoes: {
      tipo: "gozo" | "pecunia";
      dias: number;
      inicio?: string;
      fim?: string;
      doe?: string | null;
      ano?: number;
      doePecunia?: string | null;
    }[];
  }[];
};

const SEMENTES: Semente[] = [
  {
    nome: "Mariana Alves de Souza",
    cpf: "52998224725",
    rgcin: "12.345.678-9 SSP/SP",
    di: "2013-03-04",
    dtnasc: "1988-07-18",
    tel: "11988776655",
    email: "mariana.souza@orgao.gov.br",
    classe: "Classe B",
    cargo: "Professora de Educação Básica II",
    categoria: "Efetivo",
    jornada: "40h/semana",
    lotacao: "Secretaria de Administração",
    situacao: "Ativo",
    pendencias: [],
    camposVazios: [],
    origem: "importacao",
    quinquenios: [
      { tipo: 1, vigencia: "2018-03-03", doe: "2018-04-02", observacao: "ATO nº 145/2018 publicado no DOE." },
      { tipo: 2, vigencia: "2023-03-02", doe: "2023-03-20", observacao: "ATO nº 302/2023 publicado no DOE." },
    ],
    evolucoes: [
      { tipo: 1, quadro: "docente", vigencia: "2017-03-04", doe: "2017-03-22", pontos: 42, observacao: "Portaria 118/2017 — 1ª evolução." },
      { tipo: 2, quadro: "docente", vigencia: "2021-03-04", doe: "2021-03-25", pontos: 46, observacao: "Portaria 204/2021 — 2ª evolução." },
      { tipo: 3, quadro: "docente", vigencia: "2025-03-04", doe: "2025-03-21", pontos: 58, observacao: "Portaria 066/2025 — 3ª evolução." },
    ],
    licencas: [
      {
        numero: "021",
        ano: 2019,
        periodoInicial: "2013-03-04",
        periodoFinal: "2018-03-03",
        doe: "2019-04-12",
        fruicoes: [
          { tipo: "gozo", dias: 30, inicio: "2019-07-01", fim: "2019-07-30", doe: "2019-06-20" },
          { tipo: "pecunia", dias: 30, ano: 2021, doePecunia: "2021-02-10" },
        ],
      },
      {
        numero: "044",
        ano: 2024,
        periodoInicial: "2018-03-04",
        periodoFinal: "2023-03-03",
        doe: "2024-05-08",
        fruicoes: [{ tipo: "gozo", dias: 15, inicio: "2025-01-06", fim: "2025-01-20", doe: "2024-12-18" }],
      },
    ],
  },
  {
    nome: "João Pedro Ferreira",
    cpf: "11144477735",
    rgcin: "MG-9988776",
    di: "2019-01-10",
    dtnasc: "1990-02-02",
    tel: "31988887777",
    email: "joao.ferreira@orgao.gov.br",
    classe: "Classe A",
    cargo: "Agente Administrativo",
    categoria: "Efetivo",
    jornada: "30h/semana",
    lotacao: "Secretaria de Saúde",
    situacao: "Ativo",
    pendencias: ['Situação não informada — registrado como "Ativo" até revisão do RH.'],
    camposVazios: ["situacao"],
    origem: "importacao",
    quinquenios: [{ tipo: 1, vigencia: "2024-01-09", doe: "2024-01-25", observacao: "Portaria 87/2024 — concessão do 1º quinquênio." }],
    evolucoes: [],
    licencas: [
      {
        numero: "003",
        ano: 2025,
        periodoInicial: "2019-01-10",
        periodoFinal: "2024-01-09",
        doe: "2025-02-11",
        fruicoes: [],
      },
    ],
  },
  {
    nome: "Célia Maria Rocha",
    cpf: "39053344705",
    rgcin: null,
    di: "2008-06-15",
    dtnasc: "1979-09-30",
    tel: "1133445566",
    email: "celia.rocha@orgao.gov.br",
    classe: "Classe C",
    cargo: "Professora de Educação Básica I",
    categoria: "Efetivo",
    jornada: null,
    lotacao: "Secretaria de Educação",
    situacao: "Afastado",
    pendencias: ["RGCIN não informado no pré-cadastro.", "Jornada vazia — informe a carga horária semanal."],
    camposVazios: ["rgcin", "jornada"],
    origem: "importacao",
    quinquenios: [
      { tipo: 1, vigencia: "2013-06-14", doe: "2013-07-01" },
      { tipo: 2, vigencia: "2018-06-13", doe: "2018-06-29" },
    ],
    evolucoes: [{ tipo: 1, quadro: "docente", vigencia: "2025-06-16", doe: "2025-07-02", pontos: 39 }],
    licencas: [
      {
        numero: "007",
        ano: 2023,
        periodoInicial: "2008-06-15",
        periodoFinal: "2013-06-14",
        doe: "2023-08-14",
        fruicoes: [{ tipo: "gozo", dias: 45, inicio: "2024-02-05", fim: "2024-03-20", doe: "2024-01-22" }],
      },
    ],
  },
  {
    nome: "Rafael Teixeira Lima",
    cpf: null,
    rgcin: "1234567-8",
    di: "2016-08-22",
    dtnasc: null,
    tel: null,
    email: null,
    classe: null,
    cargo: "Fiscal de Posturas",
    categoria: null,
    jornada: "40h/semana",
    lotacao: null,
    situacao: "Ativo",
    pendencias: [
      "CPF não informado — complemente o cadastro para habilitar o acesso do servidor.",
      "Data de nascimento vazia — acesso do servidor liberado apenas por CPF.",
      "Cargo não informado — obrigatório para cálculo de vantagens por classe.",
      "Categoria/regime não informado.",
      "Telefone e e-mail não informados no pré-cadastro.",
      "Lotação vazia — aloque o servidor em uma unidade.",
    ],
    camposVazios: ["cpf", "rgcin", "dtnasc", "tel", "email", "classe", "categoria", "lotacao"],
    origem: "importacao",
    quinquenios: [],
    evolucoes: [],
    licencas: [],
  },
  {
    nome: "Antônia da Silva Barros",
    cpf: "15350946056",
    rgcin: "CIN 4455667",
    di: "2001-03-01",
    dtnasc: "1971-11-11",
    tel: "62991112233",
    email: "antonia.barros@orgao.gov.br",
    classe: "Classe D",
    cargo: "Técnica em Enfermagem",
    categoria: "Efetivo",
    jornada: "36h/semana",
    lotacao: "Hospital Municipal",
    situacao: "Licença",
    pendencias: [],
    camposVazios: [],
    origem: "importacao",
    quinquenios: [
      { tipo: 1, vigencia: "2006-02-28", doe: "2006-03-15" },
      { tipo: 2, vigencia: "2011-02-27", doe: "2011-03-18" },
      { tipo: 3, vigencia: "2016-02-26", doe: null, observacao: "Data do DOE pendente de publicação — sinalizado pelo RH." },
    ],
    evolucoes: [],
    licencas: [
      {
        numero: "018",
        ano: 2021,
        periodoInicial: "2001-03-01",
        periodoFinal: "2006-02-28",
        doe: "2021-06-09",
        fruicoes: [{ tipo: "pecunia", dias: 30, ano: 2023, doePecunia: "2023-03-14" }],
      },
    ],
  },
  {
    nome: "Bruno Carvalho Mendes",
    cpf: "25634493005",
    rgcin: "GO-1122334",
    di: "2011-09-12",
    dtnasc: "1985-04-27",
    tel: "62998887766",
    email: "bruno.mendes@orgao.gov.br",
    classe: "Classe B",
    cargo: "Diretor de Escola",
    categoria: "Efetivo",
    jornada: "40h/semana",
    lotacao: "Secretaria da Fazenda",
    situacao: "Ativo",
    pendencias: [],
    camposVazios: [],
    origem: "manual",
    quinquenios: [
      { tipo: 1, vigencia: "2016-09-10", doe: "2016-10-03" },
      { tipo: 2, vigencia: "2021-09-09", doe: "2021-09-30" },
    ],
    evolucoes: [
      { tipo: 1, quadro: "suporte", vigencia: "2023-05-10", doe: "2023-05-26", pontos: null, observacao: "Direção de escola — DOE pendente de anexo." },
    ],
    licencas: [
      {
        numero: "012",
        ano: 2022,
        periodoInicial: "2011-09-12",
        periodoFinal: "2016-09-11",
        doe: "2022-10-19",
        fruicoes: [{ tipo: "gozo", dias: 90, inicio: "2026-01-05", fim: "2026-04-04", doe: "2025-12-15" }],
      },
    ],
  },
  {
    nome: "Luciana Prado Antunes",
    cpf: "66036911005",
    rgcin: "SP-7788990",
    di: "2021-02-01",
    dtnasc: "1994-12-05",
    tel: "11991234567",
    email: "luciana.antunes@orgao.gov.br",
    classe: "Classe A",
    cargo: "Supervisora de Ensino",
    categoria: "Efetivo",
    jornada: "30h/semana",
    lotacao: "Secretaria de Assistência Social",
    situacao: "Ativo",
    pendencias: ["Progressão funcional pendente de avaliação de desempenho."],
    camposVazios: [],
    origem: "importacao",
    quinquenios: [{ tipo: 1, vigencia: "2026-02-01", doe: "2026-02-20", observacao: "Concessão do 1º quinquênio — processo 2026/001189." }],
    evolucoes: [],
    licencas: [
      {
        numero: "002",
        ano: 2026,
        periodoInicial: "2021-02-01",
        periodoFinal: "2026-01-31",
        doe: "2026-03-05",
        fruicoes: [],
      },
    ],
  },
  {
    nome: "Sérgio Nunes Batista",
    cpf: "05317122037",
    rgcin: "RS-5566778",
    di: "2002-08-05",
    dtnasc: "1974-06-19",
    tel: "51991234567",
    email: "sergio.batista@orgao.gov.br",
    classe: "Classe C",
    cargo: "Supervisor de Ensino",
    categoria: "Efetivo",
    jornada: "40h/semana",
    lotacao: "Secretaria de Obras",
    situacao: "Ativo",
    pendencias: [],
    camposVazios: [],
    origem: "importacao",
    quinquenios: [
      { tipo: 1, vigencia: "2007-08-04", doe: "2007-08-21" },
      { tipo: 2, vigencia: "2012-08-03", doe: "2012-08-20" },
      { tipo: 3, vigencia: "2017-08-02", doe: "2017-08-18" },
      { tipo: 4, vigencia: "2022-08-01", doe: "2022-08-17", observacao: "Próximo quinquênio com vencimento no ciclo vigente." },
    ],
    evolucoes: [],
    licencas: [
      {
        numero: "031",
        ano: 2024,
        periodoInicial: "2002-08-05",
        periodoFinal: "2007-08-04",
        doe: "2024-09-10",
        fruicoes: [
          { tipo: "gozo", dias: 60, inicio: "2024-11-04", fim: "2025-01-02", doe: "2024-10-21" },
          { tipo: "gozo", dias: 30, inicio: "2026-07-01", fim: "2026-07-30", doe: "2026-06-12" },
        ],
      },
    ],
  },
];

export type ServidorTeste = {
  id: number;
  nome: string;
  cpf: string | null;
  dtnasc: string | null;
  cargo: string | null;
  lotacao: string | null;
  situacao: string;
  origem: string;
  pendencias: number;
};

export type StatusSandbox = {
  liberado: boolean;
  ambiente: string;
  servidores: number;
  quinquenios: number;
  evolucoes: number;
  importacoes: number;
  certidoes: number;
  fruicoes: number;
  ultimaAtualizacao: string | null;
  credenciais: { nome: string; cpf: string; dtnasc: string; perfil: string }[];
  servidoresLista: ServidorTeste[];
};

export async function obterStatusSandbox(): Promise<StatusSandbox> {
  const lista = await db
    .select({
      id: servidores.id,
      nome: servidores.nome,
      cpf: servidores.cpf,
      dtnasc: servidores.dtnasc,
      cargo: servidores.cargo,
      lotacao: servidores.lotacao,
      situacao: servidores.situacao,
      origem: servidores.origem,
      pendencias: servidores.pendencias,
    })
    .from(servidores)
    .orderBy(asc(servidores.nome));

  const [contagens] = await db
    .select({
      servidores: sql<number>`(select count(*) from ${servidores})`.mapWith(Number),
      quinquenios: sql<number>`(select count(*) from ${atsQuinquenios})`.mapWith(Number),
      evolucoes: sql<number>`(select count(*) from ${evolucoes})`.mapWith(Number),
      importacoes: sql<number>`(select count(*) from ${importacoes})`.mapWith(Number),
      certidoes: sql<number>`(select count(*) from ${licencaCertidoes})`.mapWith(Number),
      fruicoes: sql<number>`(select count(*) from ${licencaFruicoes})`.mapWith(Number),
      ultima: sql<string | null>`(select max(${auditoria.criadoEm})::text from ${auditoria})`,
    })
    .from(sql`(select 1) as t`);

  return {
    liberado: true,
    ambiente: "sandbox público · dados fictícios",
    servidores: contagens?.servidores ?? 0,
    quinquenios: contagens?.quinquenios ?? 0,
    evolucoes: contagens?.evolucoes ?? 0,
    importacoes: contagens?.importacoes ?? 0,
    certidoes: contagens?.certidoes ?? 0,
    fruicoes: contagens?.fruicoes ?? 0,
    ultimaAtualizacao: contagens?.ultima ?? null,
    credenciais: [
      { nome: "Mariana Alves de Souza", cpf: "529.982.247-25", dtnasc: "18/07/1988", perfil: "Nível IV · 2 quinquênios" },
      { nome: "Antônia da Silva Barros", cpf: "153.509.460-56", dtnasc: "11/11/1971", perfil: "3 quinquênios · DOE pendente" },
      { nome: "Sérgio Nunes Batista", cpf: "053.171.220-37", dtnasc: "19/06/1974", perfil: "sem evolução · testar lançamento" },
    ],
    servidoresLista: lista.map((item) => ({
      id: item.id,
      nome: item.nome,
      cpf: item.cpf,
      dtnasc: item.dtnasc,
      cargo: item.cargo,
      lotacao: item.lotacao,
      situacao: item.situacao,
      origem: item.origem,
      pendencias: (item.pendencias ?? []).length,
    })),
  };
}

/** Recria a base de demonstração do zero. Retorna o que foi gerado. */
export async function resetarSandbox() {
  await db.execute(sql`truncate table ${evolucoes}, ${atsQuinquenios}, ${auditoria}, ${importacoes}, ${servidores} restart identity cascade`);

  const [importacaoPrincipal] = await db
    .insert(importacoes)
    .values({
      arquivo: "pre-cadastro-servidores-2026.xlsx",
      formato: "xlsx",
      totalLinhas: 42,
      novas: 31,
      atualizadas: 8,
      ignoradas: 3,
      comPendencias: 12,
      celulasVaziasTratadas: 57,
      criadoPor: "Gestor RH",
      criadoEm: new Date(Date.now() - 6 * 86_400_000),
    })
    .returning();

  await db.insert(importacoes).values({
    arquivo: "pre-cadastro-servidores-complemento.xlsx",
    formato: "xlsx",
    totalLinhas: 12,
    novas: 5,
    atualizadas: 6,
    ignoradas: 1,
    comPendencias: 4,
    celulasVaziasTratadas: 18,
    criadoPor: "Gestor RH",
    criadoEm: new Date(Date.now() - 2 * 86_400_000),
  });

  let totalQuinquenios = 0;
  let totalEvolucoes = 0;
  let totalCertidoes = 0;
  let totalFruicoes = 0;

  for (const semente of SEMENTES) {
    const [servidor] = await db
      .insert(servidores)
      .values({
        nome: semente.nome,
        nomeBusca: busca(semente.nome),
        cpf: semente.cpf,
        rgcin: semente.rgcin,
        di: semente.di,
        dtnasc: semente.dtnasc,
        tel: semente.tel,
        email: semente.email,
        classe: semente.classe,
        cargo: semente.cargo,
        categoria: semente.categoria,
        jornada: semente.jornada,
        lotacao: semente.lotacao,
        situacao: semente.situacao,
        pendencias: semente.pendencias,
        camposVazios: semente.camposVazios,
        origem: semente.origem,
        importacaoId: semente.origem === "importacao" ? importacaoPrincipal.id : null,
      })
      .returning();

    for (const quinquenio of semente.quinquenios) {
      await db.insert(atsQuinquenios).values({
        servidorId: servidor.id,
        tipo: quinquenio.tipo,
        dataVigencia: quinquenio.vigencia,
        dataDoe: quinquenio.doe,
        dataProximoProjetada: projetarProximoQuinquenio(quinquenio.vigencia),
        observacao: quinquenio.observacao ?? null,
        criadoPor: semente.origem === "manual" ? "Gestor RH" : "Motor de regras",
      });
      totalQuinquenios += 1;
    }

    for (const evolucao of semente.evolucoes) {
      const regra = regraPorTipo(evolucao.quadro, evolucao.tipo);
      await db.insert(evolucoes).values({
        servidorId: servidor.id,
        tipo: evolucao.tipo,
        quadro: evolucao.quadro,
        nivelOrigem: regra.origem,
        nivelDestino: regra.destino,
        intersticioAnos: regra.intersticioAnos,
        pontuacaoMinima: regra.pontuacaoMinima,
        pesoAtualizacao: regra.pesos.atualizacao,
        pesoAperfeicoamento: regra.pesos.aperfeicoamento,
        pesoProducao: regra.pesos.producao,
        pontuacaoComprovada: evolucao.pontos,
        dataVigencia: evolucao.vigencia,
        dataDoe: evolucao.doe,
        dataProxima: projetarProximaEvolucao(evolucao.vigencia, regra.intersticioAnos),
        observacao: evolucao.observacao ?? null,
        criadoPor: "Gestor RH",
      });
      totalEvolucoes += 1;
    }

    for (const licenca of semente.licencas) {
      const [certidao] = await db
        .insert(licencaCertidoes)
        .values({
          servidorId: servidor.id,
          numero: licenca.numero,
          ano: licenca.ano,
          periodoInicial: licenca.periodoInicial,
          periodoFinal: licenca.periodoFinal,
          dataDoe: licenca.doe,
          diasConcedidos: 90,
          criadoPor: "Gestor RH",
        })
        .returning();
      totalCertidoes += 1;

      for (const fruicao of licenca.fruicoes) {
        await db.insert(licencaFruicoes).values({
          certidaoId: certidao.id,
          servidorId: servidor.id,
          tipo: fruicao.tipo,
          dias: fruicao.dias,
          dataInicio: fruicao.inicio ?? null,
          dataFim: fruicao.fim ?? null,
          dataDoeAutorizacao: fruicao.tipo === "gozo" ? (fruicao.doe ?? null) : null,
          ano: fruicao.tipo === "pecunia" ? (fruicao.ano ?? null) : null,
          dataDoePecunia: fruicao.tipo === "pecunia" ? (fruicao.doePecunia ?? null) : null,
          criadoPor: "Gestor RH",
        });
        totalFruicoes += 1;
      }
    }
  }

  await db.insert(auditoria).values([
    {
      entidade: "importacao",
      entidadeId: importacaoPrincipal.id,
      acao: "Importação de planilha confirmada",
      detalhe: "pre-cadastro-servidores-2026.xlsx: 31 novos, 8 atualizados, 3 ignorados, 12 com pendências.",
      autor: "Gestor RH",
      criadoEm: new Date(Date.now() - 6 * 86_400_000),
    },
    {
      entidade: "sandbox",
      entidadeId: null,
      acao: "Sandbox reiniciado",
      detalhe: `Base de demonstração recriada: ${SEMENTES.length} servidores, ${totalQuinquenios} quinquênios, ${totalEvolucoes} evoluções, ${totalCertidoes} certidões e ${totalFruicoes} fruições de licença-prêmio.`,
      autor: "Sandbox",
    },
  ]);

  return {
    servidores: SEMENTES.length,
    quinquenios: totalQuinquenios,
    evolucoes: totalEvolucoes,
    certidoes: totalCertidoes,
    fruicoes: totalFruicoes,
  };
}
