import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { evolucoes, servidores } from "@/db/schema";
import { registrarAuditoria, resumirEvolucao } from "@/lib/consultas";
import { projetarProximaEvolucao, regraPorTipo, rotuloTipoEvolucao } from "@/lib/evolucao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const registroId = Number(id);
  const corpo = (await request.json()) as {
    tipo?: number;
    quadro?: string;
    dataVigencia?: string;
    dataDoe?: string | null;
    dataProxima?: string | null;
    pontuacaoComprovada?: number | null;
    observacao?: string | null;
  };

  const [atual] = await db.select().from(evolucoes).where(eq(evolucoes.id, registroId)).limit(1);
  if (!atual) return Response.json({ erro: "Registro de evolução não encontrado." }, { status: 404 });

  const quadro = (corpo.quadro === "suporte" ? "suporte" : corpo.quadro === "docente" ? "docente" : atual.quadro) as
    | "docente"
    | "suporte";
  const tipo = corpo.tipo ?? atual.tipo;
  const regra = regraPorTipo(quadro, tipo);
  const dataVigencia = corpo.dataVigencia ?? atual.dataVigencia;
  const dataProxima =
    corpo.dataProxima && /^\d{4}-\d{2}-\d{2}$/.test(corpo.dataProxima)
      ? corpo.dataProxima
      : projetarProximaEvolucao(dataVigencia, regra.intersticioAnos);

  if (dataProxima <= dataVigencia) {
    return Response.json(
      { erro: "A data da próxima evolução deve ser posterior à data de vigência." },
      { status: 400 },
    );
  }

  const [atualizado] = await db
    .update(evolucoes)
    .set({
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
        corpo.pontuacaoComprovada === undefined ? atual.pontuacaoComprovada : corpo.pontuacaoComprovada,
      dataVigencia,
      dataDoe: corpo.dataDoe !== undefined ? corpo.dataDoe : atual.dataDoe,
      dataProxima,
      observacao: corpo.observacao !== undefined ? corpo.observacao : atual.observacao,
    })
    .where(eq(evolucoes.id, registroId))
    .returning();

  const [servidor] = await db
    .select({ nome: servidores.nome })
    .from(servidores)
    .where(eq(servidores.id, atual.servidorId))
    .limit(1);

  await registrarAuditoria({
    entidade: "evolucao",
    entidadeId: atual.servidorId,
    acao: "Evolução funcional corrigida",
    detalhe: `#${atual.servidorId} ${servidor?.nome ?? ""} · ${rotuloTipoEvolucao(tipo)} · Nível ${regra.origem} → ${regra.destino} · vigência ${dataVigencia} · próxima ${dataProxima}.`,
  });

  const todos = await db
    .select()
    .from(evolucoes)
    .where(eq(evolucoes.servidorId, atual.servidorId))
    .orderBy(asc(evolucoes.tipo));

  return Response.json({ ok: true, evolucao: atualizado, resumo: resumirEvolucao(todos) });
}

export async function DELETE(_request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const [removido] = await db
    .delete(evolucoes)
    .where(eq(evolucoes.id, Number(id)))
    .returning();
  if (!removido) return Response.json({ erro: "Registro de evolução não encontrado." }, { status: 404 });

  await registrarAuditoria({
    entidade: "evolucao",
    entidadeId: removido.servidorId,
    acao: "Evolução funcional excluída",
    detalhe: `#${removido.servidorId} · ${rotuloTipoEvolucao(removido.tipo)} (vigência ${removido.dataVigencia}) excluída.`,
  });

  const todos = await db
    .select()
    .from(evolucoes)
    .where(eq(evolucoes.servidorId, removido.servidorId))
    .orderBy(asc(evolucoes.tipo));

  return Response.json({ ok: true, resumo: resumirEvolucao(todos) });
}
