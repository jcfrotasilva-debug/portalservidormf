import { eq } from "drizzle-orm";
import { db } from "@/db";
import { servidores } from "@/db/schema";
import { listarServidoresComAts, registrarAuditoria } from "@/lib/consultas";
import { apenasDigitos, cpfValido, nomeDeBusca, titulo } from "@/lib/planilha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const busca = url.searchParams.get("busca") ?? "";
  const situacao = url.searchParams.get("situacao") ?? "todas";
  const somenteAts = url.searchParams.get("somenteAts") === "1";

  const lista = await listarServidoresComAts({ busca, situacao, somenteAts });
  const situacoes = await db
    .selectDistinct({ situacao: servidores.situacao })
    .from(servidores)
    .orderBy(servidores.situacao);

  return Response.json({
    ok: true,
    total: lista.length,
    servidores: lista,
    situacoes: situacoes.map((item) => item.situacao),
  });
}

export async function POST(request: Request) {
  try {
    const corpo = (await request.json()) as Record<string, string | null>;
    const nome = titulo((corpo.nome ?? "").toString().trim());
    if (nome.length < 3) {
      return Response.json({ erro: "Informe o nome completo do servidor." }, { status: 400 });
    }

    const cpfTexto = (corpo.cpf ?? "").toString();
    const cpf = cpfTexto ? apenasDigitos(cpfTexto) : null;
    if (cpf && !cpfValido(cpf)) {
      return Response.json({ erro: "CPF inválido (dígitos verificadores)." }, { status: 400 });
    }
    if (cpf) {
      const existente = await db
        .select({ id: servidores.id })
        .from(servidores)
        .where(eq(servidores.cpf, cpf))
        .limit(1);
      if (existente.length > 0) {
        return Response.json({ erro: "Já existe servidor cadastrado com este CPF." }, { status: 409 });
      }
    }

    const pendencias: string[] = [];
    if (!cpf) pendencias.push("CPF não informado.");
    if (!corpo.di) pendencias.push("DI (data de ingresso) não informada.");
    if (!corpo.cargo) pendencias.push("Cargo não informado.");
    if (!corpo.lotacao) pendencias.push("Lotação não informada.");

    const [criado] = await db
      .insert(servidores)
      .values({
        nome,
        nomeBusca: nomeDeBusca(nome),
        cpf,
        rgcin: corpo.rgcin ? corpo.rgcin.toString().trim() : null,
        di: corpo.di ? corpo.di.toString().slice(0, 10) : null,
        dtnasc: corpo.dtnasc ? corpo.dtnasc.toString().slice(0, 10) : null,
        tel: corpo.tel ? apenasDigitos(corpo.tel.toString()) : null,
        email: corpo.email ? corpo.email.toString().trim().toLowerCase() : null,
        classe: corpo.classe ? titulo(corpo.classe.toString()) : null,
        cargo: corpo.cargo ? titulo(corpo.cargo.toString()) : null,
        categoria: corpo.categoria ? titulo(corpo.categoria.toString()) : null,
        jornada: corpo.jornada ? corpo.jornada.toString() : null,
        lotacao: corpo.lotacao ? titulo(corpo.lotacao.toString()) : null,
        situacao: corpo.situacao ? corpo.situacao.toString() : "Ativo",
        pendencias,
        camposVazios: [],
        origem: "manual",
      })
      .returning();

    await registrarAuditoria({
      entidade: "servidor",
      entidadeId: criado.id,
      acao: "Cadastro manual criado",
      detalhe: `${criado.nome} incluído manualmente no painel do gestor.`,
    });

    return Response.json({ ok: true, servidor: criado }, { status: 201 });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Não foi possível cadastrar: ${mensagem}` }, { status: 500 });
  }
}
