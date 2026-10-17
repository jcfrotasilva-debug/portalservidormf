import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { licencaCertidoes, licencaFruicoes, servidores } from "@/db/schema";
import { registrarAuditoria } from "@/lib/consultas";
import {
  DIAS_CERTIDAO,
  DIAS_PECUNIA,
  OPCOES_GOZO,
  calcularDataFimGozo,
  ehTipoFruicao,
  resumirCertidao,
  resumirLicenca,
  validarCertidao,
} from "@/lib/licenca";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

async function carregarServidor(servidorId: number) {
  const [servidor] = await db.select().from(servidores).where(eq(servidores.id, servidorId)).limit(1);
  return servidor ?? null;
}

/** GET /api/licenca-premio?servidorId=1 — certidões + fruições + saldos. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const servidorId = Number(url.searchParams.get("servidorId"));
  if (!servidorId) return Response.json({ erro: "Informe o servidorId." }, { status: 400 });

  const certidoes = await db
    .select()
    .from(licencaCertidoes)
    .where(eq(licencaCertidoes.servidorId, servidorId))
    .orderBy(desc(licencaCertidoes.ano), desc(licencaCertidoes.numero));

  const fruicoes = certidoes.length
    ? await db
        .select()
        .from(licencaFruicoes)
        .where(
          inArray(
            licencaFruicoes.certidaoId,
            certidoes.map((item) => item.id),
          ),
        )
        .orderBy(asc(licencaFruicoes.dataInicio))
    : [];

  return Response.json({
    ok: true,
    certidoes: certidoes.map((certidao) => ({
      ...certidao,
      resumo: resumirCertidao(
        certidao,
        fruicoes.filter((item) => item.certidaoId === certidao.id),
      ),
    })),
    fruicoes,
    resumo: resumirLicenca(certidoes, fruicoes),
  });
}

type Corpo = {
  acao?: "certidao" | "fruicao";
  servidorId?: number;
  // certidão
  numero?: string;
  ano?: number;
  periodoInicial?: string;
  periodoFinal?: string;
  dataDoe?: string | null;
  observacao?: string | null;
  // fruição
  certidaoId?: number;
  tipo?: string;
  dias?: number;
  dataInicio?: string;
  dataFim?: string;
  dataDoeAutorizacao?: string | null;
  dataDoePecunia?: string | null;
  id?: number;
};

/** POST — cria certidão ou lança fruição (gozo/pecúnia). */
export async function POST(request: Request) {
  try {
    const corpo = (await request.json()) as Corpo;
    const servidorId = Number(corpo.servidorId);
    const servidor = servidorId ? await carregarServidor(servidorId) : null;
    if (!servidor) return Response.json({ erro: "Selecione um servidor válido." }, { status: 404 });

    if (corpo.acao === "fruicao") {
      const certidaoId = Number(corpo.certidaoId);
      const tipoBruto = (corpo.tipo ?? "gozo").toString();
      if (!ehTipoFruicao(tipoBruto)) {
        return Response.json({ erro: 'Tipo da fruição deve ser "gozo" ou "pecunia".' }, { status: 400 });
      }

      const [certidao] = await db
        .select()
        .from(licencaCertidoes)
        .where(and(eq(licencaCertidoes.id, certidaoId), eq(licencaCertidoes.servidorId, servidorId)))
        .limit(1);
      if (!certidao) {
        return Response.json({ erro: "Selecione uma certidão deste servidor." }, { status: 400 });
      }

      const fruicoesCertidao = await db
        .select()
        .from(licencaFruicoes)
        .where(eq(licencaFruicoes.certidaoId, certidaoId));
      const resumo = resumirCertidao(certidao, fruicoesCertidao);

      const dias = tipoBruto === "pecunia" ? DIAS_PECUNIA : Number(corpo.dias);
      if (!OPCOES_GOZO.includes(dias as (typeof OPCOES_GOZO)[number])) {
        return Response.json(
          { erro: `Dias de gozo permitidos: ${OPCOES_GOZO.join(", ")}.` },
          { status: 400 },
        );
      }
      if (dias > resumo.saldo) {
        return Response.json(
          {
            erro: `Saldo insuficiente: a certidão ${certidao.numero}/${certidao.ano} tem ${resumo.saldo} dia(s) disponível(is) e a fruição solicitada é de ${dias} dia(s).`,
          },
          { status: 409 },
        );
      }

      let dataInicio: string | null = null;
      let dataFim: string | null = null;
      let dataDoeAutorizacao: string | null = null;
      let dataDoePecunia: string | null = null;
      let ano: number | null = null;

      if (tipoBruto === "gozo") {
        if (!corpo.dataInicio || !ISO.test(corpo.dataInicio)) {
          return Response.json({ erro: "Informe a data de início do gozo." }, { status: 400 });
        }
        dataInicio = corpo.dataInicio;
        dataFim =
          corpo.dataFim && ISO.test(corpo.dataFim) ? corpo.dataFim : calcularDataFimGozo(dataInicio, dias);
        if (dataFim < dataInicio) {
          return Response.json({ erro: "A data final do gozo deve ser posterior ao início." }, { status: 400 });
        }
        if (corpo.dataDoeAutorizacao) {
          if (!ISO.test(corpo.dataDoeAutorizacao)) {
            return Response.json({ erro: "Data da autorização em DOE inválida." }, { status: 400 });
          }
          dataDoeAutorizacao = corpo.dataDoeAutorizacao;
        }
      } else {
        ano = corpo.ano && Number.isInteger(Number(corpo.ano)) ? Number(corpo.ano) : new Date().getUTCFullYear();
        if (corpo.dataDoePecunia) {
          if (!ISO.test(corpo.dataDoePecunia)) {
            return Response.json({ erro: "Data do DOE da pecúnia inválida." }, { status: 400 });
          }
          dataDoePecunia = corpo.dataDoePecunia;
        }
      }

      const [fruicao] = await db
        .insert(licencaFruicoes)
        .values({
          certidaoId,
          servidorId,
          tipo: tipoBruto,
          dias,
          dataInicio,
          dataFim,
          dataDoeAutorizacao,
          ano,
          dataDoePecunia,
          observacao: corpo.observacao ?? null,
          criadoPor: "Gestor RH",
        })
        .returning();

      const novasFruicoes = [...fruicoesCertidao, fruicao];
      await registrarAuditoria({
        entidade: "licenca",
        entidadeId: servidorId,
        acao: tipoBruto === "gozo" ? "Licença-prêmio em gozo registrada" : "Licença-prêmio em pecúnia registrada",
        detalhe: `#${servidorId} ${servidor.nome} · certidão ${certidao.numero}/${certidao.ano} · ${dias} dia(s)${
          tipoBruto === "gozo"
            ? ` · gozo de ${dataInicio} a ${dataFim} · DOE ${dataDoeAutorizacao ?? "não informado"}`
            : ` · pecúnia ${ano} · DOE ${dataDoePecunia ?? "não informado"}`
        } · saldo restante ${resumirCertidao(certidao, novasFruicoes).saldo} dia(s).`,
      });

      return Response.json(
        {
          ok: true,
          fruicao,
          resumoCertidao: resumirCertidao(certidao, novasFruicoes),
        },
        { status: 201 },
      );
    }

    // certidão
    const erros = validarCertidao({
      numero: corpo.numero,
      ano: Number(corpo.ano),
      periodoInicial: corpo.periodoInicial ?? null,
      periodoFinal: corpo.periodoFinal ?? null,
      dataDoe: corpo.dataDoe ?? null,
    });
    if (erros.length) return Response.json({ erro: erros.join(" ") }, { status: 400 });

    const numero = (corpo.numero as string).trim();
    const ano = Number(corpo.ano);

    const existente = await db
      .select()
      .from(licencaCertidoes)
      .where(
        and(
          eq(licencaCertidoes.servidorId, servidorId),
          eq(licencaCertidoes.numero, numero),
          eq(licencaCertidoes.ano, ano),
        ),
      )
      .limit(1);

    if (existente.length) {
      return Response.json(
        { erro: `A certidão nº ${numero}/${ano} já está cadastrada para este servidor.` },
        { status: 409 },
      );
    }

    const [certidao] = await db
      .insert(licencaCertidoes)
      .values({
        servidorId,
        numero,
        ano,
        periodoInicial: corpo.periodoInicial as string,
        periodoFinal: corpo.periodoFinal as string,
        dataDoe: corpo.dataDoe ?? null,
        diasConcedidos: DIAS_CERTIDAO,
        observacao: corpo.observacao ?? null,
        criadoPor: "Gestor RH",
      })
      .returning();

    await registrarAuditoria({
      entidade: "licenca",
      entidadeId: servidorId,
      acao: "Certidão de licença-prêmio cadastrada",
      detalhe: `#${servidorId} ${servidor.nome} · certidão ${numero}/${ano} · período ${corpo.periodoInicial} a ${corpo.periodoFinal} · DOE ${corpo.dataDoe ?? "não informado"} · saldo inicial ${DIAS_CERTIDAO} dias.`,
    });

    return Response.json(
      {
        ok: true,
        certidao: { ...certidao, resumo: resumirCertidao(certidao, []) },
      },
      { status: 201 },
    );
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Não foi possível salvar: ${mensagem}` }, { status: 500 });
  }
}

/** DELETE — remove certidão (?id=) ou fruição (?fruicaoId=). */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const fruicaoId = Number(url.searchParams.get("fruicaoId"));
  const certidaoId = Number(url.searchParams.get("id"));

  if (fruicaoId) {
    const [removida] = await db.delete(licencaFruicoes).where(eq(licencaFruicoes.id, fruicaoId)).returning();
    if (!removida) return Response.json({ erro: "Fruição não encontrada." }, { status: 404 });
    await registrarAuditoria({
      entidade: "licenca",
      entidadeId: removida.servidorId,
      acao: "Fruição de licença-prêmio excluída",
      detalhe: `#${removida.servidorId} · ${removida.dias} dia(s) de ${removida.tipo} devolvidos ao saldo.`,
    });
    return Response.json({ ok: true });
  }

  if (certidaoId) {
    const [removida] = await db
      .delete(licencaCertidoes)
      .where(eq(licencaCertidoes.id, certidaoId))
      .returning();
    if (!removida) return Response.json({ erro: "Certidão não encontrada." }, { status: 404 });
    await registrarAuditoria({
      entidade: "licenca",
      entidadeId: removida.servidorId,
      acao: "Certidão de licença-prêmio excluída",
      detalhe: `#${removida.servidorId} · certidão ${removida.numero}/${removida.ano} excluída com as fruições vinculadas.`,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ erro: "Informe id ou fruicaoId." }, { status: 400 });
}
