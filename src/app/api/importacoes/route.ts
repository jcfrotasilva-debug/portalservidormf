import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { importacoes, servidores } from "@/db/schema";
import { registrarAuditoria, listarImportacoes } from "@/lib/consultas";
import { LABELS_CAMPOS, type CampoVazio } from "@/lib/ats";
import { chaveServidor, nomeDeBusca, type LinhaProcessada, type PayloadServidor } from "@/lib/planilha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Corpo = {
  arquivo?: string;
  formato?: string;
  linhas?: LinhaProcessada[];
  celulasVaziasTratadas?: number;
};

function sanitizar(payload: PayloadServidor) {
  return {
    nome: payload.nome.trim(),
    nomeBusca: nomeDeBusca(payload.nome),
    cpf: payload.cpf,
    rgcin: payload.rgcin,
    di: payload.di,
    dtnasc: payload.dtnasc,
    tel: payload.tel,
    email: payload.email,
    classe: payload.classe,
    cargo: payload.cargo,
    categoria: payload.categoria,
    jornada: payload.jornada,
    lotacao: payload.lotacao,
    situacao: payload.situacao || "Ativo",
  };
}

export async function GET() {
  const historico = await listarImportacoes(12);
  return Response.json({ ok: true, historico });
}

export async function POST(request: Request) {
  try {
    const corpo = (await request.json()) as Corpo;
    const linhas = (corpo.linhas ?? []).filter(
      (linha) => linha.payload && (linha.status === "nova" || linha.status === "atualizar"),
    );

    if (linhas.length === 0) {
      return Response.json(
        { erro: "Nenhuma linha válida para importar. Revise o arquivo e envie novamente." },
        { status: 400 },
      );
    }

    const [importacao] = await db
      .insert(importacoes)
      .values({
        arquivo: corpo.arquivo ?? "planilha.xlsx",
        formato: corpo.formato ?? "xlsx",
        totalLinhas: corpo.linhas?.length ?? linhas.length,
        celulasVaziasTratadas: corpo.celulasVaziasTratadas ?? 0,
      })
      .returning();

    let novas = 0;
    let atualizadas = 0;
    const salvos: { id: number; nome: string; cpf: string | null; dtnasc: string | null; podeTestar: boolean }[] = [];
    let comPendencias = 0;
    let ignoradas = (corpo.linhas?.length ?? 0) - linhas.length;
    const detalhes: string[] = [];

    for (const linha of linhas) {
      const payload = linha.payload as PayloadServidor;
      const dados = sanitizar(payload);
      const pendencias = linha.pendencias ?? [];
      const camposVazios = (linha.camposVazios ?? []) as CampoVazio[];
      if (pendencias.length > 0) comPendencias += 1;

      const existente = payload.cpf
        ? (
            await db
              .select({ id: servidores.id })
              .from(servidores)
              .where(eq(servidores.cpf, payload.cpf))
              .limit(1)
          )[0]
        : (
            await db
              .select({ id: servidores.id })
              .from(servidores)
              .where(and(eq(servidores.nomeBusca, dados.nomeBusca)))
              .limit(1)
          )[0];

      if (existente) {
        const [atualizado] = await db
          .update(servidores)
          .set({
            ...dados,
            pendencias,
            camposVazios,
            importacaoId: importacao.id,
            atualizadoEm: new Date(),
          })
          .where(eq(servidores.id, existente.id))
          .returning({
            id: servidores.id,
            nome: servidores.nome,
            cpf: servidores.cpf,
            dtnasc: servidores.dtnasc,
          });
        salvos.push({ ...atualizado, podeTestar: true });
        atualizadas += 1;
        detalhes.push(`Linha ${linha.linha}: atualizado cadastro de ${dados.nome}.`);
      } else {
        const [criado] = await db
          .insert(servidores)
          .values({
            ...dados,
            pendencias,
            camposVazios,
            origem: "importacao",
            importacaoId: importacao.id,
          })
          .returning({
            id: servidores.id,
            nome: servidores.nome,
            cpf: servidores.cpf,
            dtnasc: servidores.dtnasc,
          });
        salvos.push({ ...criado, podeTestar: true });
        novas += 1;
        detalhes.push(`Linha ${linha.linha}: cadastrado ${dados.nome}.`);
      }
    }

    await db
      .update(importacoes)
      .set({ novas, atualizadas, ignoradas, comPendencias })
      .where(eq(importacoes.id, importacao.id));

    await registrarAuditoria({
      entidade: "importacao",
      entidadeId: importacao.id,
      acao: "Importação de planilha confirmada",
      detalhe: `${corpo.arquivo ?? "planilha"}: ${novas} novos, ${atualizadas} atualizados, ${ignoradas} ignorados, ${comPendencias} com pendências.`,
    });

    return Response.json({
      ok: true,
      importacaoId: importacao.id,
      resumo: { novas, atualizadas, ignoradas, comPendencias, total: linhas.length },
      detalhes: detalhes.slice(0, 50),
      testes: salvos.slice(0, 200),
      chavesAmostra: linhas.slice(0, 3).map((linha) => chaveServidor(linha.payload as PayloadServidor)),
      rotulosAusentes: linhas
        .flatMap((linha) => linha.camposVazios ?? [])
        .filter((campo, index, todos) => todos.indexOf(campo) === index)
        .map((campo) => LABELS_CAMPOS[campo]),
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Falha ao gravar a importação: ${mensagem}` }, { status: 500 });
  }
}
