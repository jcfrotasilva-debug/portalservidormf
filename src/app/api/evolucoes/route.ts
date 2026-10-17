import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { evolucoes, servidores } from "@/db/schema";
import { registrarAuditoria, resumirEvolucao } from "@/lib/consultas";
import {
  QUADROS,
  TIPO_EVOLUCAO_MAX,
  ehQuadro,
  projetarProximaEvolucao,
  regraPorTipo,
  rotuloTipoEvolucao,
} from "@/lib/evolucao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Corpo = {
  servidorId?: number;
  tipo?: number;
  quadro?: string;
  dataVigencia?: string;
  dataDoe?: string | null;
  dataProxima?: string | null;
  pontuacaoComprovada?: number | null;
  observacao?: string | null;
  criadoPor?: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const servidorId = Number(url.searchParams.get("servidorId"));
  if (!servidorId) return Response.json({ erro: "Informe o servidorId." }, { status: 400 });

  const registros = await db
    .select()
    .from(evolucoes)
    .where(eq(evolucoes.servidorId, servidorId))
    .orderBy(asc(evolucoes.tipo));

  return Response.json({
    ok: true,
    evolucoes: registros,
    resumo: resumirEvolucao(registros),
  });
}

export async function POST(request: Request) {
  try {
    const corpo = (await request.json()) as Corpo;
    const servidorId = Number(corpo.servidorId);
    const tipo = Number(corpo.tipo);
    const quadroBruto = (corpo.quadro ?? "").toString();
    const erros: string[] = [];

    if (!servidorId) erros.push("Selecione o servidor.");
    if (!Number.isInteger(tipo) || tipo < 1 || tipo > TIPO_EVOLUCAO_MAX) {
      erros.push(`Tipo deve estar entre 1ª e ${TIPO_EVOLUCAO_MAX}ª evolução.`);
    }
    if (!ehQuadro(quadroBruto)) erros.push("Selecione o quadro (Docentes ou Suporte Pedagógico).");
    if (!corpo.dataVigencia || !ISO.test(corpo.dataVigencia)) {
      erros.push("Informe a data de vigência.");
    }
    if (corpo.dataDoe && !ISO.test(corpo.dataDoe)) erros.push("Data do DOE inválida.");
    if (corpo.dataDoe && corpo.dataVigencia && corpo.dataDoe < corpo.dataVigencia) {
      erros.push("A data do DOE não pode ser anterior à data de vigência.");
    }
    if (erros.length) return Response.json({ erro: erros.join(" ") }, { status: 400 });

    const quadro = quadroBruto as "docente" | "suporte";
    const regra = regraPorTipo(quadro, tipo);
    const dataVigencia = corpo.dataVigencia as string;
    const dataProxima = corpo.dataProxima && ISO.test(corpo.dataProxima)
      ? corpo.dataProxima
      : projetarProximaEvolucao(dataVigencia, regra.intersticioAnos);

    if (dataProxima <= dataVigencia) {
      return Response.json(
        { erro: "A data da próxima evolução deve ser posterior à data de vigência." },
        { status: 400 },
      );
    }

    const [servidor] = await db.select().from(servidores).where(eq(servidores.id, servidorId)).limit(1);
    if (!servidor) return Response.json({ erro: "Servidor não encontrado." }, { status: 404 });

    const existente = await db
      .select()
      .from(evolucoes)
      .where(and(eq(evolucoes.servidorId, servidorId), eq(evolucoes.tipo, tipo)))
      .limit(1);

    const dados = {
      servidorId,
      tipo,
      quadro,
      nivelOrigem: regra.origem,
      nivelDestino: regra.destino,
      intersticioAnos: regra.intersticioAnos,
      pontuacaoMinima: regra.pontuacaoMinima,
      pesoAtualizacao: regra.pesos.atualizacao,
      pesoAperfeicoamento: regra.pesos.aperfeicoamento,
      pesoProducao: regra.pesos.producao,
      pontuacaoComprovada:
        corpo.pontuacaoComprovada === null || corpo.pontuacaoComprovada === undefined
          ? null
          : Number(corpo.pontuacaoComprovada),
      dataVigencia,
      dataDoe: corpo.dataDoe ?? null,
      dataProxima,
      observacao: corpo.observacao ?? null,
      criadoPor: corpo.criadoPor ?? "Gestor RH",
    };

    const [registro] = existente.length
      ? await db.update(evolucoes).set(dados).where(eq(evolucoes.id, existente[0].id)).returning()
      : await db.insert(evolucoes).values(dados).returning();

    await registrarAuditoria({
      entidade: "evolucao",
      entidadeId: servidorId,
      acao: existente.length ? "Evolução funcional atualizada" : "Evolução funcional concedida",
      detalhe: `#${servidorId} ${servidor.nome} · ${rotuloTipoEvolucao(tipo)} · ${QUADROS[quadro].curto} · Nível ${regra.origem} → ${regra.destino} · vigência ${dataVigencia} · DOE ${corpo.dataDoe ?? "não informado"} · próxima ${dataProxima} (interstício ${regra.intersticioAnos} anos).`,
      autor: corpo.criadoPor ?? "Gestor RH",
    });

    const todos = await db
      .select()
      .from(evolucoes)
      .where(eq(evolucoes.servidorId, servidorId))
      .orderBy(asc(evolucoes.tipo));

    return Response.json(
      {
        ok: true,
        evolucao: registro,
        evolucoes: todos,
        resumo: resumirEvolucao(todos),
        atualizado: existente.length > 0,
      },
      { status: existente.length ? 200 : 201 },
    );
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Não foi possível registrar a evolução: ${mensagem}` }, { status: 500 });
  }
}
