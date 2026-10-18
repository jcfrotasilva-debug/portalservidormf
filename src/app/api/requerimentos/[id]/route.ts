import { eq } from "drizzle-orm";
import { db } from "@/db";
import { requerimentos } from "@/db/schema";
import { registrarAuditoria } from "@/lib/consultas";
import { gestorDaSessao } from "@/lib/sessao";
import { ehStatus, STATUS_ROTULO } from "@/lib/requerimentos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

/** PATCH — gestor defere, indefere ou coloca em análise, com parecer. */
export async function PATCH(request: Request, contexto: Contexto) {
  const gestor = await gestorDaSessao();
  if (!gestor) {
    return Response.json({ erro: "Apenas o gestor pode analisar requerimentos." }, { status: 403 });
  }

  const { id } = await contexto.params;
  const requerimentoId = Number(id);
  const corpo = (await request.json().catch(() => ({}))) as { status?: string; parecer?: string };

  const status = (corpo.status ?? "").toString();
  if (!ehStatus(status)) {
    return Response.json({ erro: "Status inválido." }, { status: 400 });
  }

  const parecer = (corpo.parecer ?? "").toString().trim();
  if ((status === "deferido" || status === "indeferido") && parecer.length < 5) {
    return Response.json(
      { erro: "Informe o parecer/justificativa da decisão (mínimo 5 caracteres)." },
      { status: 400 },
    );
  }

  const [atual] = await db
    .select()
    .from(requerimentos)
    .where(eq(requerimentos.id, requerimentoId))
    .limit(1);
  if (!atual) return Response.json({ erro: "Requerimento não encontrado." }, { status: 404 });

  const finaliza = status === "deferido" || status === "indeferido";
  const [atualizado] = await db
    .update(requerimentos)
    .set({
      status,
      parecer: parecer || atual.parecer,
      analisadoPor: finaliza ? gestor.nome : atual.analisadoPor,
      analisadoEm: finaliza ? new Date() : atual.analisadoEm,
      atualizadoEm: new Date(),
    })
    .where(eq(requerimentos.id, requerimentoId))
    .returning();

  await registrarAuditoria({
    entidade: "requerimento",
    entidadeId: requerimentoId,
    acao: `Requerimento ${STATUS_ROTULO[status].toLowerCase()}`,
    detalhe: `${atual.protocolo} · ${STATUS_ROTULO[atual.status]} → ${STATUS_ROTULO[status]}${
      parecer ? ` · parecer: ${parecer.slice(0, 160)}` : ""
    }`,
    autor: gestor.nome,
  });

  return Response.json({ ok: true, requerimento: atualizado });
}
