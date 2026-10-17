import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
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
import { regraPorNivel, resumoVazio, type ResumoEvolucao } from "@/lib/evolucao";
import { resumirLicenca } from "@/lib/licenca";
import {
  diasEntre,
  hojeISO,
  PERCENTUAL_POR_QUINQUENIO,
  projetarProximoQuinquenio,
  somarDias,
} from "@/lib/ats";
import { nomeDeBusca } from "@/lib/planilha";
import type {
  AtsQuinquenio,
  AtividadeRecente,
  Evolucao,
  MetricasBase,
  ResumoAts,
  Servidor,
  ServidorComAts,
} from "@/lib/tipos";

export function resumirAts(registros: AtsQuinquenio[]): ResumoAts {
  if (registros.length === 0) {
    return {
      quantidade: 0,
      percentual: 0,
      ultimaVigencia: null,
      ultimaVigenciaTipo: null,
      proximaProjetada: null,
      diasParaProxima: null,
      proximoTipo: null,
      temAts: false,
    };
  }

  const ordenados = [...registros].sort((a, b) => a.dataVigencia.localeCompare(b.dataVigencia));
  const ultimo = ordenados[ordenados.length - 1];
  const maiorTipo = Math.max(...registros.map((registro) => registro.tipo));
  return {
    quantidade: registros.length,
    percentual: maiorTipo * PERCENTUAL_POR_QUINQUENIO,
    ultimaVigencia: ultimo.dataVigencia,
    ultimaVigenciaTipo: ultimo.tipo,
    proximaProjetada: ultimo.dataProximoProjetada,
    diasParaProxima: diasEntre(hojeISO(), ultimo.dataProximoProjetada),
    proximoTipo: Math.min(maiorTipo + 1, 10),
    temAts: true,
  };
}

export function resumirEvolucao(registros: Evolucao[]): ResumoEvolucao {
  if (registros.length === 0) return resumoVazio();

  const ordenados = [...registros].sort((a, b) => a.tipo - b.tipo);
  const ultimo = ordenados[ordenados.length - 1];
  const quadro = (ultimo.quadro === "suporte" ? "suporte" : "docente") as "docente" | "suporte";
  const proximaRegra = regraPorNivel(quadro, ultimo.nivelDestino);
  const temProxima = Boolean(proximaRegra);

  return {
    quantidade: registros.length,
    temEvolucao: true,
    nivelAtual: ultimo.nivelDestino,
    nivelAtualRotulo: `Nível ${ultimo.nivelDestino}`,
    quadro,
    quadroLabel: QUADRO_LABEL[quadro],
    ultimaVigencia: ultimo.dataVigencia,
    dataProxima: ultimo.dataProxima,
    diasParaProxima: diasEntre(hojeISO(), ultimo.dataProxima),
    proximoTipo: Math.min(ultimo.tipo + 1, 15),
    proximaRegra: temProxima ? proximaRegra : null,
  };
}

const QUADRO_LABEL: Record<"docente" | "suporte", string> = {
  docente: "Classe Docentes (PEB-I e PEB-II)",
  suporte: "Classe de Suporte Pedagógico",
};

export async function listarServidoresComAts(filtros: {
  busca?: string;
  situacao?: string;
  somenteAts?: boolean;
  limite?: number;
}): Promise<ServidorComAts[]> {
  const condicoes = [];
  const busca = filtros.busca?.trim();
  if (busca) {
    const termo = nomeDeBusca(busca);
    const digitos = busca.replace(/\D/g, "");
    condicoes.push(
      or(
        ilike(servidores.nomeBusca, `%${termo}%`),
        digitos.length >= 3 ? ilike(servidores.cpf, `%${digitos}%`) : undefined,
        ilike(servidores.cargo, `%${termo}%`),
        ilike(servidores.lotacao, `%${termo}%`),
      ),
    );
  }
  if (filtros.situacao && filtros.situacao !== "todas") {
    condicoes.push(eq(servidores.situacao, filtros.situacao));
  }

  const lista = await db
    .select()
    .from(servidores)
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(asc(servidores.nome))
    .limit(filtros.limite ?? 3000);

  if (lista.length === 0) return [];

  const ids = lista.map((item) => item.id);
  const ats = await db
    .select()
    .from(atsQuinquenios)
    .where(inArray(atsQuinquenios.servidorId, ids))
    .orderBy(asc(atsQuinquenios.tipo));

  const porServidor = new Map<number, AtsQuinquenio[]>();
  for (const registro of ats) {
    const atual = porServidor.get(registro.servidorId) ?? [];
    atual.push(registro);
    porServidor.set(registro.servidorId, atual);
  }

  const evolucoesLista = await db
    .select()
    .from(evolucoes)
    .where(inArray(evolucoes.servidorId, ids))
    .orderBy(asc(evolucoes.tipo));

  const evolucaoPorServidor = new Map<number, Evolucao[]>();
  for (const registro of evolucoesLista) {
    const atual = evolucaoPorServidor.get(registro.servidorId) ?? [];
    atual.push(registro);
    evolucaoPorServidor.set(registro.servidorId, atual);
  }

  const certidoesLista = await db
    .select()
    .from(licencaCertidoes)
    .where(inArray(licencaCertidoes.servidorId, ids));
  const fruicoesLista = await db
    .select()
    .from(licencaFruicoes)
    .where(inArray(licencaFruicoes.servidorId, ids));

  const comAts = lista.map((item) => ({
    ...item,
    ats: resumirAts(porServidor.get(item.id) ?? []),
    evolucao: resumirEvolucao(evolucaoPorServidor.get(item.id) ?? []),
    licenca: resumirLicenca(
      certidoesLista.filter((certidao) => certidao.servidorId === item.id),
      fruicoesLista.filter((fruicao) => fruicao.servidorId === item.id),
    ),
  }));
  return filtros.somenteAts ? comAts.filter((item) => item.ats.temAts) : comAts;
}

export async function obterServidor(id: number) {
  const [servidor] = await db.select().from(servidores).where(eq(servidores.id, id)).limit(1);
  if (!servidor) return null;

  const quinquenios = await db
    .select()
    .from(atsQuinquenios)
    .where(eq(atsQuinquenios.servidorId, id))
    .orderBy(asc(atsQuinquenios.tipo));

  const historico = await db
    .select()
    .from(auditoria)
    .where(and(eq(auditoria.entidade, "servidor"), eq(auditoria.entidadeId, id)))
    .orderBy(desc(auditoria.criadoEm))
    .limit(20);

  const atsHistorico = await db
    .select()
    .from(auditoria)
    .where(and(eq(auditoria.entidade, "ats"), sql`${auditoria.detalhe} is not null`))
    .orderBy(desc(auditoria.criadoEm))
    .limit(50);

  const evolucoesLista = await db
    .select()
    .from(evolucoes)
    .where(eq(evolucoes.servidorId, id))
    .orderBy(asc(evolucoes.tipo));

  const certidoesLista = await db
    .select()
    .from(licencaCertidoes)
    .where(eq(licencaCertidoes.servidorId, id))
    .orderBy(desc(licencaCertidoes.ano), desc(licencaCertidoes.numero));
  const fruicoesLista = await db
    .select()
    .from(licencaFruicoes)
    .where(eq(licencaFruicoes.servidorId, id))
    .orderBy(asc(licencaFruicoes.dataInicio));

  return {
    servidor,
    quinquenios,
    evolucoes: evolucoesLista,
    certidoes: certidoesLista,
    fruicoes: fruicoesLista,
    resumo: resumirAts(quinquenios),
    resumoEvolucao: resumirEvolucao(evolucoesLista),
    resumoLicenca: resumirLicenca(certidoesLista, fruicoesLista),
    historico: historico.map((item) => ({
      id: item.id,
      acao: item.acao,
      detalhe: item.detalhe,
      autor: item.autor,
      criadoEm: item.criadoEm.toISOString(),
    })),
    historicoAts: atsHistorico
      .filter((item) => item.detalhe?.includes(`#${id}`))
      .map((item) => ({
        id: item.id,
        acao: item.acao,
        detalhe: item.detalhe,
        autor: item.autor,
        criadoEm: item.criadoEm.toISOString(),
      })),
  };
}

export async function obterMetricas(): Promise<MetricasBase> {
  const [totais] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      comPendencias: sql<number>`count(*) filter (where jsonb_array_length(${servidores.pendencias}) > 0)`.mapWith(
        Number,
      ),
      semCpf: sql<number>`count(*) filter (where ${servidores.cpf} is null)`.mapWith(Number),
      semDi: sql<number>`count(*) filter (where ${servidores.di} is null)`.mapWith(Number),
      ativos: sql<number>`count(*) filter (where ${servidores.situacao} = 'Ativo')`.mapWith(Number),
    })
    .from(servidores);

  const porSituacao = await db
    .select({ situacao: servidores.situacao, total: sql<number>`count(*)`.mapWith(Number) })
    .from(servidores)
    .groupBy(servidores.situacao)
    .orderBy(desc(sql`count(*)`));

  const porLotacao = await db
    .select({ lotacao: sql<string>`coalesce(${servidores.lotacao}, 'Não informada')`, total: sql<number>`count(*)`.mapWith(Number) })
    .from(servidores)
    .groupBy(sql`coalesce(${servidores.lotacao}, 'Não informada')`)
    .orderBy(desc(sql`count(*)`))
    .limit(8);

  const [atsTotais] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      media: sql<number>`coalesce(avg(${atsQuinquenios.tipo}) * ${PERCENTUAL_POR_QUINQUENIO}, 0)`.mapWith(Number),
    })
    .from(atsQuinquenios);

  const limite = somarDias(hojeISO(), 365);
  const [proximos] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(atsQuinquenios)
    .where(
      and(
        gte(atsQuinquenios.dataProximoProjetada, hojeISO()),
        sql`${atsQuinquenios.dataProximoProjetada} <= ${limite}`,
      ),
    );

  const [evolucaoTotais] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(evolucoes);

  const [evolucoesProximas] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(evolucoes)
    .where(
      and(
        gte(evolucoes.dataProxima, hojeISO()),
        sql`${evolucoes.dataProxima} <= ${limite}`,
      ),
    );

  const todasCertidoes = await db.select().from(licencaCertidoes);
  const todasFruicoes = await db.select().from(licencaFruicoes);
  const resumoLicencaGlobal = resumirLicenca(todasCertidoes, todasFruicoes);

  return {
    totalCertidoes: resumoLicencaGlobal.certidoes,
    saldoLicencaTotal: resumoLicencaGlobal.saldo,
    diasGozoTotal: resumoLicencaGlobal.diasGozo,
    diasPecuniaTotal: resumoLicencaGlobal.diasPecunia,
    totalServidores: totais?.total ?? 0,
    ativos: totais?.ativos ?? 0,
    comPendencias: totais?.comPendencias ?? 0,
    semCpf: totais?.semCpf ?? 0,
    semDi: totais?.semDi ?? 0,
    totalQuinquenios: atsTotais?.total ?? 0,
    percentualMedioAts: Math.round(atsTotais?.media ?? 0),
    proximos12Meses: proximos?.total ?? 0,
    totalEvolucoes: evolucaoTotais?.total ?? 0,
    evolucoesProximas12Meses: evolucoesProximas?.total ?? 0,
    porSituacao,
    porLotacao,
  };
}

export async function atividadesRecentes(limite = 8): Promise<AtividadeRecente[]> {
  const linhas = await db
    .select({
      id: atsQuinquenios.id,
      servidorId: atsQuinquenios.servidorId,
      nome: servidores.nome,
      tipo: atsQuinquenios.tipo,
      dataVigencia: atsQuinquenios.dataVigencia,
      dataDoe: atsQuinquenios.dataDoe,
      dataProximoProjetada: atsQuinquenios.dataProximoProjetada,
      criadoPor: atsQuinquenios.criadoPor,
      criadoEm: atsQuinquenios.criadoEm,
    })
    .from(atsQuinquenios)
    .innerJoin(servidores, eq(servidores.id, atsQuinquenios.servidorId))
    .orderBy(desc(atsQuinquenios.criadoEm))
    .limit(limite);

  return linhas.map((linha) => ({ ...linha, criadoEm: linha.criadoEm.toISOString() }));
}

export async function listarImportacoes(limite = 10) {
  const linhas = await db
    .select()
    .from(importacoes)
    .orderBy(desc(importacoes.criadoEm))
    .limit(limite);
  return linhas.map((linha) => ({ ...linha, criadoEm: linha.criadoEm.toISOString() }));
}

export async function registrarAuditoria(entrada: {
  entidade: string;
  entidadeId?: number | null;
  acao: string;
  detalhe?: string;
  autor?: string;
}) {
  await db.insert(auditoria).values({
    entidade: entrada.entidade,
    entidadeId: entrada.entidadeId ?? null,
    acao: entrada.acao,
    detalhe: entrada.detalhe,
    autor: entrada.autor ?? "Gestor RH",
  });
}

export function validarServidor(payload: Partial<Servidor>) {
  const erros: string[] = [];
  if (!payload.nome || payload.nome.trim().length < 3) erros.push("Informe o nome completo do servidor.");
  if (payload.cpf && payload.cpf.replace(/\D/g, "").length !== 11) erros.push("CPF deve ter 11 dígitos.");
  return erros;
}

export { projetarProximoQuinquenio };
