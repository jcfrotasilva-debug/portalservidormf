import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { atsQuinquenios, servidores } from "@/db/schema";
import { registrarAuditoria, resumirAts } from "@/lib/consultas";
import {
  DIAS_QUINQUENIO,
  QUINQUENIO_MAX,
  hojeISO,
  projetarProximoQuinquenio,
  rotuloQuinquenio,
} from "@/lib/ats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Corpo = {
  servidorId?: number;
  tipo?: number;
  dataVigencia?: string;
  dataDoe?: string | null;
  observacao?: string | null;
  criadoPor?: string;
};

function validar(corpo: Corpo) {
  const erros: string[] = [];
  if (!corpo.servidorId || !Number.isInteger(corpo.servidorId)) erros.push("Selecione o servidor.");
  if (!corpo.tipo || corpo.tipo < 1 || corpo.tipo > QUINQUENIO_MAX) {
    erros.push(`Tipo deve estar entre 1º e ${QUINQUENIO_MAX}º quinquênio.`);
  }
  if (!corpo.dataVigencia || !/^\d{4}-\d{2}-\d{2}$/.test(corpo.dataVigencia)) {
    erros.push("Informe a data de vigência no formato aaaa-mm-dd.");
  }
  if (corpo.dataDoe && !/^\d{4}-\d{2}-\d{2}$/.test(corpo.dataDoe)) {
    erros.push("Data do DOE inválida.");
  }
  if (
    corpo.dataVigencia &&
    corpo.dataDoe &&
    corpo.dataDoe < corpo.dataVigencia
  ) {
    erros.push("A data do DOE não pode ser anterior à data de vigência.");
  }
  return erros;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const servidorIdParam = url.searchParams.get("servidorId");
  if (!servidorIdParam) {
    return Response.json({ erro: "Informe o servidorId." }, { status: 400 });
  }
  const servidorId = Number(servidorIdParam);
  const registros = await db
    .select()
    .from(atsQuinquenios)
    .where(eq(atsQuinquenios.servidorId, servidorId))
    .orderBy(asc(atsQuinquenios.tipo));

  return Response.json({ ok: true, quinquenios: registros, resumo: resumirAts(registros) });
}

export async function POST(request: Request) {
  try {
    const corpo = (await request.json()) as Corpo;
    const erros = validar(corpo);
    if (erros.length) return Response.json({ erro: erros.join(" ") }, { status: 400 });

    const servidorId = Number(corpo.servidorId);
    const [servidor] = await db.select().from(servidores).where(eq(servidores.id, servidorId)).limit(1);
    if (!servidor) return Response.json({ erro: "Servidor não encontrado." }, { status: 404 });

    const tipo = Number(corpo.tipo);
    const dataVigencia = corpo.dataVigencia as string;
    const dataDoe = corpo.dataDoe ? corpo.dataDoe : null;
    const projeccao = projetarProximoQuinquenio(dataVigencia);

    const existente = await db
      .select()
      .from(atsQuinquenios)
      .where(and(eq(atsQuinquenios.servidorId, servidorId), eq(atsQuinquenios.tipo, tipo)))
      .limit(1);

    const dados = {
      servidorId,
      tipo,
      dataVigencia,
      dataDoe,
      dataProximoProjetada: projeccao,
      observacao: corpo.observacao ?? null,
      criadoPor: corpo.criadoPor ?? "Gestor RH",
    };

    const [registro] = existente.length
      ? await db.update(atsQuinquenios).set(dados).where(eq(atsQuinquenios.id, existente[0].id)).returning()
      : await db.insert(atsQuinquenios).values(dados).returning();

    await registrarAuditoria({
      entidade: "ats",
      entidadeId: servidorId,
      acao: existente.length ? "ATS atualizado" : "ATS lançado",
      detalhe: `#${servidorId} ${servidor.nome} · ${rotuloQuinquenio(tipo)} · vigência ${dataVigencia} · DOE ${dataDoe ?? "não informado"} · projeção ${projeccao} (+${DIAS_QUINQUENIO} dias).`,
      autor: corpo.criadoPor ?? "Gestor RH",
    });

    const todos = await db
      .select()
      .from(atsQuinquenios)
      .where(eq(atsQuinquenios.servidorId, servidorId))
      .orderBy(asc(atsQuinquenios.tipo));

    return Response.json(
      { ok: true, quinquenio: registro, quinquenios: todos, resumo: resumirAts(todos), atualizado: existente.length > 0 },
      { status: existente.length ? 200 : 201 },
    );
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Não foi possível lançar o ATS: ${mensagem}` }, { status: 500 });
  }
}

/** Gera automaticamente todos os quinquênios já obtidos a partir da DI do servidor. */
export async function PUT(request: Request) {
  try {
    const corpo = (await request.json()) as { servidorId?: number; dataDoe?: string | null; base?: string | null };
    const servidorId = Number(corpo.servidorId);
    if (!servidorId) return Response.json({ erro: "Selecione o servidor." }, { status: 400 });

    const [servidor] = await db.select().from(servidores).where(eq(servidores.id, servidorId)).limit(1);
    if (!servidor) return Response.json({ erro: "Servidor não encontrado." }, { status: 404 });

    const base = corpo.base ?? servidor.di;
    if (!base) {
      return Response.json(
        { erro: "DI (data de ingresso) não informada no cadastro. Informe uma data base para a geração." },
        { status: 400 },
      );
    }

    const existentes = await db
      .select()
      .from(atsQuinquenios)
      .where(eq(atsQuinquenios.servidorId, servidorId));
    const tiposExistentes = new Set(existentes.map((item) => item.tipo));

    const hoje = hojeISO();
    const criados: number[] = [];
    for (let tipo = 1; tipo <= QUINQUENIO_MAX; tipo += 1) {
      const vigencia = projetarProximoQuinquenio(
        tipo === 1 ? base : projetarProximoQuinquenio(gerarVigencia(base, tipo - 1)),
      );
      if (vigencia > hoje) break;
      if (tiposExistentes.has(tipo)) continue;
      await db.insert(atsQuinquenios).values({
        servidorId,
        tipo,
        dataVigencia: vigencia,
        dataDoe: corpo.dataDoe ?? null,
        dataProximoProjetada: projetarProximoQuinquenio(vigencia),
        observacao: `Gerado automaticamente a partir da DI ${base} (+${DIAS_QUINQUENIO} dias por quinquênio).`,
        criadoPor: "Motor de regras",
      });
      criados.push(tipo);
    }

    const todos = await db
      .select()
      .from(atsQuinquenios)
      .where(eq(atsQuinquenios.servidorId, servidorId))
      .orderBy(asc(atsQuinquenios.tipo));

    await registrarAuditoria({
      entidade: "ats",
      entidadeId: servidorId,
      acao: "Geração automática de quinquênios",
      detalhe: `#${servidorId} ${servidor.nome} · base ${base} · quinquênios criados: ${criados.length ? criados.join(", ") : "nenhum novo"}.`,
      autor: "Motor de regras",
    });

    return Response.json({
      ok: true,
      criados,
      quinquenios: todos,
      resumo: resumirAts(todos),
      base,
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Falha na geração automática: ${mensagem}` }, { status: 500 });
  }
}

function gerarVigencia(base: string, indice: number) {
  let atual = base;
  for (let i = 0; i < indice; i += 1) atual = projetarProximoQuinquenio(atual);
  return atual;
}
