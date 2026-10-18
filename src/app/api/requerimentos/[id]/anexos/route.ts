import { eq } from "drizzle-orm";
import { db } from "@/db";
import { requerimentoAnexos, requerimentos } from "@/db/schema";
import { registrarAuditoria } from "@/lib/consultas";
import { gestorDaSessao, servidorDaSessao } from "@/lib/sessao";
import { MAX_ANEXOS, validarArquivo } from "@/lib/requerimentos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

/** POST — anexa documentos ao requerimento (servidor dono ou gestor). */
export async function POST(request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const requerimentoId = Number(id);

  const gestor = await gestorDaSessao();
  const servidor = gestor ? null : await servidorDaSessao();
  if (!gestor && !servidor) {
    return Response.json({ erro: "Acesso não autorizado." }, { status: 401 });
  }

  const [requerimento] = await db
    .select()
    .from(requerimentos)
    .where(eq(requerimentos.id, requerimentoId))
    .limit(1);
  if (!requerimento) {
    return Response.json({ erro: "Requerimento não encontrado." }, { status: 404 });
  }
  if (servidor && requerimento.servidorId !== servidor.id) {
    return Response.json({ erro: "Este requerimento não pertence a você." }, { status: 403 });
  }

  const existentes = await db
    .select({ id: requerimentoAnexos.id })
    .from(requerimentoAnexos)
    .where(eq(requerimentoAnexos.requerimentoId, requerimentoId));

  const form = await request.formData();
  const arquivos = form.getAll("anexos").filter((item): item is File => item instanceof File);
  if (arquivos.length === 0) {
    return Response.json({ erro: "Selecione ao menos um arquivo." }, { status: 400 });
  }
  if (existentes.length + arquivos.length > MAX_ANEXOS) {
    return Response.json(
      { erro: `Limite de ${MAX_ANEXOS} anexos por requerimento já atingido.` },
      { status: 400 },
    );
  }
  for (const arquivo of arquivos) {
    const erro = validarArquivo(arquivo.name, arquivo.type, arquivo.size);
    if (erro) return Response.json({ erro }, { status: 400 });
  }

  const autor = gestor ? gestor.nome : (servidor?.nome ?? "Servidor");
  const origem = gestor ? "gestor" : "servidor";

  for (const arquivo of arquivos) {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    await db.insert(requerimentoAnexos).values({
      requerimentoId,
      nome: arquivo.name,
      mime: arquivo.type,
      tamanho: buffer.byteLength,
      conteudo: buffer.toString("base64"),
      origem,
      autor,
    });
  }

  await db
    .update(requerimentos)
    .set({ atualizadoEm: new Date() })
    .where(eq(requerimentos.id, requerimentoId));

  await registrarAuditoria({
    entidade: "requerimento",
    entidadeId: requerimentoId,
    acao: "Documento anexado",
    detalhe: `${requerimento.protocolo} · ${arquivos.length} arquivo(s) enviados pelo ${origem}.`,
    autor,
  });

  return Response.json({ ok: true, enviados: arquivos.length }, { status: 201 });
}
