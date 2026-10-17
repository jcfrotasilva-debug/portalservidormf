import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atsQuinquenios, servidores } from "@/db/schema";
import { registrarAuditoria, resumirAts } from "@/lib/consultas";
import { DIAS_QUINQUENIO, projetarProximoQuinquenio, rotuloQuinquenio } from "@/lib/ats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const registroId = Number(id);
  const corpo = (await request.json()) as {
    tipo?: number;
    dataVigencia?: string;
    dataDoe?: string | null;
    observacao?: string | null;
  };

  const [atual] = await db.select().from(atsQuinquenios).where(eq(atsQuinquenios.id, registroId)).limit(1);
  if (!atual) return Response.json({ erro: "Lançamento de ATS não encontrado." }, { status: 404 });

  const dataVigencia = corpo.dataVigencia ?? atual.dataVigencia;
  const projeccao = projetarProximoQuinquenio(dataVigencia);

  const [atualizado] = await db
    .update(atsQuinquenios)
    .set({
      tipo: corpo.tipo ?? atual.tipo,
      dataVigencia,
      dataDoe: corpo.dataDoe !== undefined ? corpo.dataDoe : atual.dataDoe,
      dataProximoProjetada: projeccao,
      observacao: corpo.observacao !== undefined ? corpo.observacao : atual.observacao,
    })
    .where(eq(atsQuinquenios.id, registroId))
    .returning();

  const [servidor] = await db
    .select({ nome: servidores.nome })
    .from(servidores)
    .where(eq(servidores.id, atual.servidorId))
    .limit(1);

  await registrarAuditoria({
    entidade: "ats",
    entidadeId: atual.servidorId,
    acao: "ATS corrigido",
    detalhe: `#${atual.servidorId} ${servidor?.nome ?? ""} · ${rotuloQuinquenio(atualizado.tipo)} · vigência ${atual.dataVigencia} → ${dataVigencia} · projeção ${projeccao} (+${DIAS_QUINQUENIO} dias).`,
  });

  const todos = await db
    .select()
    .from(atsQuinquenios)
    .where(eq(atsQuinquenios.servidorId, atual.servidorId));

  return Response.json({ ok: true, quinquenio: atualizado, resumo: resumirAts(todos) });
}

export async function DELETE(_request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const registroId = Number(id);
  const [removido] = await db
    .delete(atsQuinquenios)
    .where(eq(atsQuinquenios.id, registroId))
    .returning();
  if (!removido) return Response.json({ erro: "Lançamento de ATS não encontrado." }, { status: 404 });

  await registrarAuditoria({
    entidade: "ats",
    entidadeId: removido.servidorId,
    acao: "ATS excluído",
    detalhe: `#${removido.servidorId} · ${rotuloQuinquenio(removido.tipo)} (vigência ${removido.dataVigencia}) excluído.`,
  });

  const todos = await db
    .select()
    .from(atsQuinquenios)
    .where(eq(atsQuinquenios.servidorId, removido.servidorId));

  return Response.json({ ok: true, resumo: resumirAts(todos) });
}
