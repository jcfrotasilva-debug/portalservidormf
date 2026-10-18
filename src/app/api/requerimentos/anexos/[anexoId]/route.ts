import { eq } from "drizzle-orm";
import { db } from "@/db";
import { requerimentoAnexos, requerimentos } from "@/db/schema";
import { gestorDaSessao, servidorDaSessao } from "@/lib/sessao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ anexoId: string }> };

/** GET — baixa o anexo (apenas o gestor ou o servidor dono do requerimento). */
export async function GET(_request: Request, contexto: Contexto) {
  const { anexoId } = await contexto.params;

  const [anexo] = await db
    .select()
    .from(requerimentoAnexos)
    .where(eq(requerimentoAnexos.id, Number(anexoId)))
    .limit(1);
  if (!anexo) return new Response("Anexo não encontrado.", { status: 404 });

  const [requerimento] = await db
    .select({ servidorId: requerimentos.servidorId })
    .from(requerimentos)
    .where(eq(requerimentos.id, anexo.requerimentoId))
    .limit(1);
  if (!requerimento) return new Response("Requerimento não encontrado.", { status: 404 });

  const gestor = await gestorDaSessao();
  const servidor = gestor ? null : await servidorDaSessao();
  const autorizado = Boolean(gestor) || servidor?.id === requerimento.servidorId;
  if (!autorizado) return new Response("Acesso não autorizado.", { status: 403 });

  const bytes = new Uint8Array(Buffer.from(anexo.conteudo, "base64"));
  return new Response(bytes, {
    headers: {
      "Content-Type": anexo.mime || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(anexo.nome)}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** DELETE — remove anexo (gestor sempre; servidor só os próprios). */
export async function DELETE(_request: Request, contexto: Contexto) {
  const { anexoId } = await contexto.params;

  const [anexo] = await db
    .select()
    .from(requerimentoAnexos)
    .where(eq(requerimentoAnexos.id, Number(anexoId)))
    .limit(1);
  if (!anexo) return Response.json({ erro: "Anexo não encontrado." }, { status: 404 });

  const [requerimento] = await db
    .select({ servidorId: requerimentos.servidorId })
    .from(requerimentos)
    .where(eq(requerimentos.id, anexo.requerimentoId))
    .limit(1);

  const gestor = await gestorDaSessao();
  const servidor = gestor ? null : await servidorDaSessao();
  const donoServidor = servidor && requerimento?.servidorId === servidor.id && anexo.origem === "servidor";

  if (!gestor && !donoServidor) {
    return Response.json({ erro: "Acesso não autorizado." }, { status: 403 });
  }

  await db.delete(requerimentoAnexos).where(eq(requerimentoAnexos.id, anexo.id));
  return Response.json({ ok: true });
}
