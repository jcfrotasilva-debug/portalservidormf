import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { requerimentoAnexos, requerimentos, servidores } from "@/db/schema";
import { registrarAuditoria } from "@/lib/consultas";
import { gestorDaSessao, servidorDaSessao } from "@/lib/sessao";
import {
  MAX_ANEXOS,
  montarProtocolo,
  validarArquivo,
  type RequerimentoCompleto,
} from "@/lib/requerimentos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — lista requerimentos.
 *  - servidor autenticado: apenas os próprios
 *  - gestor autenticado: todos (filtros ?status= e ?busca=)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const gestor = await gestorDaSessao();
  const servidor = gestor ? null : await servidorDaSessao();

  if (!gestor && !servidor) {
    return Response.json({ erro: "Acesso não autorizado." }, { status: 401 });
  }

  const condicoes = [];
  if (servidor) condicoes.push(eq(requerimentos.servidorId, servidor.id));
  const status = url.searchParams.get("status");
  if (gestor && status && status !== "todos") {
    condicoes.push(eq(requerimentos.status, status));
  }

  const linhas = await db
    .select({
      requerimento: requerimentos,
      nome: servidores.nome,
      cpf: servidores.cpf,
      di: servidores.di,
      cargo: servidores.cargo,
      lotacao: servidores.lotacao,
    })
    .from(requerimentos)
    .innerJoin(servidores, eq(servidores.id, requerimentos.servidorId))
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(desc(requerimentos.criadoEm))
    .limit(300);

  const ids = linhas.map((linha) => linha.requerimento.id);
  const anexos = ids.length
    ? await db
        .select({
          id: requerimentoAnexos.id,
          requerimentoId: requerimentoAnexos.requerimentoId,
          nome: requerimentoAnexos.nome,
          mime: requerimentoAnexos.mime,
          tamanho: requerimentoAnexos.tamanho,
          origem: requerimentoAnexos.origem,
          autor: requerimentoAnexos.autor,
          criadoEm: requerimentoAnexos.criadoEm,
        })
        .from(requerimentoAnexos)
        .where(inArray(requerimentoAnexos.requerimentoId, ids))
    : [];

  const lista: RequerimentoCompleto[] = linhas.map((linha) => ({
    ...linha.requerimento,
    servidorNome: linha.nome,
    servidorCpf: linha.cpf,
    servidorDi: linha.di,
    servidorCargo: linha.cargo,
    servidorLotacao: linha.lotacao,
    anexos: anexos.filter((anexo) => anexo.requerimentoId === linha.requerimento.id),
  }));

  const [contagem] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      pendentes: sql<number>`count(*) filter (where ${requerimentos.status} in ('protocolado','em_analise'))`.mapWith(
        Number,
      ),
      deferidos: sql<number>`count(*) filter (where ${requerimentos.status} = 'deferido')`.mapWith(Number),
      indeferidos: sql<number>`count(*) filter (where ${requerimentos.status} = 'indeferido')`.mapWith(
        Number,
      ),
    })
    .from(requerimentos)
    .where(servidor ? eq(requerimentos.servidorId, servidor.id) : undefined);

  return Response.json({
    ok: true,
    papel: gestor ? "gestor" : "servidor",
    requerimentos: lista,
    resumo: contagem ?? { total: 0, pendentes: 0, deferidos: 0, indeferidos: 0 },
  });
}

/** POST — servidor abre um novo requerimento (multipart com anexos opcionais). */
export async function POST(request: Request) {
  const servidor = await servidorDaSessao();
  if (!servidor) {
    return Response.json(
      { erro: "Entre na sua área exclusiva para abrir um requerimento." },
      { status: 401 },
    );
  }

  try {
    const form = await request.formData();
    const tipo = (form.get("tipo") ?? "").toString().trim();
    const assunto = (form.get("assunto") ?? "").toString().trim();
    const descricao = (form.get("descricao") ?? "").toString().trim();

    if (!tipo) return Response.json({ erro: "Selecione o tipo do requerimento." }, { status: 400 });
    if (assunto.length < 4) {
      return Response.json({ erro: "Informe um assunto com pelo menos 4 caracteres." }, { status: 400 });
    }
    if (descricao.length < 15) {
      return Response.json(
        { erro: "Descreva o que você deseja com pelo menos 15 caracteres." },
        { status: 400 },
      );
    }

    const arquivos = form.getAll("anexos").filter((item): item is File => item instanceof File);
    if (arquivos.length > MAX_ANEXOS) {
      return Response.json({ erro: `Máximo de ${MAX_ANEXOS} anexos por requerimento.` }, { status: 400 });
    }
    for (const arquivo of arquivos) {
      const erro = validarArquivo(arquivo.name, arquivo.type, arquivo.size);
      if (erro) return Response.json({ erro }, { status: 400 });
    }

    const [criado] = await db
      .insert(requerimentos)
      .values({
        servidorId: servidor.id,
        protocolo: "pendente",
        tipo,
        assunto,
        descricao,
        status: "protocolado",
      })
      .returning();

    const protocolo = montarProtocolo(criado.id, new Date(criado.criadoEm).getUTCFullYear());
    await db.update(requerimentos).set({ protocolo }).where(eq(requerimentos.id, criado.id));

    for (const arquivo of arquivos) {
      const buffer = Buffer.from(await arquivo.arrayBuffer());
      await db.insert(requerimentoAnexos).values({
        requerimentoId: criado.id,
        nome: arquivo.name,
        mime: arquivo.type,
        tamanho: buffer.byteLength,
        conteudo: buffer.toString("base64"),
        origem: "servidor",
        autor: servidor.nome,
      });
    }

    await registrarAuditoria({
      entidade: "requerimento",
      entidadeId: criado.id,
      acao: "Requerimento protocolado",
      detalhe: `${protocolo} · ${servidor.nome} · ${tipo} · ${arquivos.length} anexo(s).`,
      autor: servidor.nome,
    });

    return Response.json({ ok: true, protocolo, id: criado.id }, { status: 201 });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Não foi possível protocolar: ${mensagem}` }, { status: 500 });
  }
}
