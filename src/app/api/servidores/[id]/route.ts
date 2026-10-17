import { eq } from "drizzle-orm";
import { db } from "@/db";
import { servidores } from "@/db/schema";
import { obterServidor, registrarAuditoria } from "@/lib/consultas";
import { apenasDigitos, nomeDeBusca, titulo } from "@/lib/planilha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const detalhe = await obterServidor(Number(id));
  if (!detalhe) return Response.json({ erro: "Servidor não encontrado." }, { status: 404 });
  return Response.json({ ok: true, ...detalhe });
}

export async function PATCH(request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const servidorId = Number(id);
  const corpo = (await request.json()) as Record<string, string | null>;

  const atual = await db.select().from(servidores).where(eq(servidores.id, servidorId)).limit(1);
  if (atual.length === 0) return Response.json({ erro: "Servidor não encontrado." }, { status: 404 });

  const nome = corpo.nome ? titulo(corpo.nome.toString().trim()) : atual[0].nome;
  const alteracoes: Record<string, string> = {};

  Object.entries(corpo).forEach(([campo, valor]) => {
    if (valor === null || valor === undefined) return;
    if (campo === "cpf") {
      const digitos = apenasDigitos(valor.toString());
      alteracoes.cpf = digitos || "—";
      return;
    }
    const anterior = (atual[0] as unknown as Record<string, string | null>)[campo];
    if (anterior !== valor && campo !== "nome") {
      alteracoes[campo] = `${anterior ?? "vazio"} → ${valor}`;
    }
  });

  const pendencias = (atual[0].pendencias ?? []).filter((pendencia) => {
    if (pendencia.includes("CPF") && corpo.cpf) return false;
    if (pendencia.includes("DI") && corpo.di) return false;
    if (pendencia.includes("Cargo") && corpo.cargo) return false;
    if (pendencia.includes("Lotação") && corpo.lotacao) return false;
    if (pendencia.includes("Situação") && corpo.situacao) return false;
    if (pendencia.includes("nascimento") && corpo.dtnasc) return false;
    if (pendencia.includes("Jornada") && corpo.jornada) return false;
    if (pendencia.includes("Categoria") && corpo.categoria) return false;
    return true;
  });

  const [atualizado] = await db
    .update(servidores)
    .set({
      nome,
      nomeBusca: nomeDeBusca(nome),
      cpf: corpo.cpf !== undefined ? (apenasDigitos(corpo.cpf ?? "") || null) : atual[0].cpf,
      rgcin: corpo.rgcin !== undefined ? corpo.rgcin : atual[0].rgcin,
      di: corpo.di !== undefined ? corpo.di : atual[0].di,
      dtnasc: corpo.dtnasc !== undefined ? corpo.dtnasc : atual[0].dtnasc,
      tel: corpo.tel !== undefined ? apenasDigitos(corpo.tel ?? "") || null : atual[0].tel,
      email: corpo.email !== undefined ? corpo.email : atual[0].email,
      classe: corpo.classe !== undefined ? corpo.classe : atual[0].classe,
      cargo: corpo.cargo !== undefined ? corpo.cargo : atual[0].cargo,
      categoria: corpo.categoria !== undefined ? corpo.categoria : atual[0].categoria,
      jornada: corpo.jornada !== undefined ? corpo.jornada : atual[0].jornada,
      lotacao: corpo.lotacao !== undefined ? corpo.lotacao : atual[0].lotacao,
      situacao: corpo.situacao !== undefined && corpo.situacao ? corpo.situacao : atual[0].situacao,
      pendencias,
      atualizadoEm: new Date(),
    })
    .where(eq(servidores.id, servidorId))
    .returning();

  await registrarAuditoria({
    entidade: "servidor",
    entidadeId: servidorId,
    acao: "Cadastro atualizado",
    detalhe: Object.keys(alteracoes).length
      ? Object.entries(alteracoes)
          .map(([campo, valor]) => `${campo}: ${valor}`)
          .join(" | ")
      : "Ajuste de cadastro sem alteração de valores.",
  });

  return Response.json({ ok: true, servidor: atualizado });
}

export async function DELETE(_request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const servidorId = Number(id);
  const removido = await db
    .delete(servidores)
    .where(eq(servidores.id, servidorId))
    .returning({ nome: servidores.nome });
  if (removido.length === 0) {
    return Response.json({ erro: "Servidor não encontrado." }, { status: 404 });
  }
  await registrarAuditoria({
    entidade: "servidor",
    entidadeId: servidorId,
    acao: "Cadastro excluído",
    detalhe: `${removido[0].nome} removido da base (incluindo quinquênios vinculados).`,
  });
  return Response.json({ ok: true });
}
