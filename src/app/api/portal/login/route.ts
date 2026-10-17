import { eq } from "drizzle-orm";
import { db } from "@/db";
import { servidores } from "@/db/schema";
import { registrarAuditoria } from "@/lib/consultas";
import { apenasDigitos, nomeDeBusca } from "@/lib/planilha";
import { definirSessao, encerrarSessao } from "@/lib/sessao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const corpo = (await request.json()) as { cpf?: string; dtnasc?: string };
    const informado = (corpo.cpf ?? "").trim();
    const cpf = apenasDigitos(informado);
    const pareceNome = /[A-Za-zÀ-ÿ]/.test(informado);

    if (!pareceNome && cpf.length !== 11) {
      return Response.json(
        { erro: "Informe o CPF com 11 dígitos ou o nome completo do cadastro." },
        { status: 400 },
      );
    }

    let servidor: typeof servidores.$inferSelect | undefined;
    if (pareceNome) {
      const termo = nomeDeBusca(informado);
      const encontrados = await db
        .select()
        .from(servidores)
        .where(eq(servidores.nomeBusca, termo))
        .limit(2);
      if (encontrados.length > 0) servidor = encontrados[0];
    } else {
      const encontrados = await db.select().from(servidores).where(eq(servidores.cpf, cpf)).limit(1);
      servidor = encontrados[0];
    }

    if (!servidor) {
      return Response.json(
        {
          erro: "Cadastro não localizado. Confira o CPF/nome ou procure o RH para conferir seu cadastro.",
        },
        { status: 404 },
      );
    }

    if (servidor.dtnasc) {
      const informada = (corpo.dtnasc ?? "").trim();
      const normalizada = informada.includes("/")
        ? informada.split("/").reverse().join("-")
        : informada;
      if (normalizada.slice(0, 10) !== servidor.dtnasc) {
        return Response.json({ erro: "Data de nascimento não confere com o cadastro." }, { status: 401 });
      }
    }

    await definirSessao(servidor.id);
    await registrarAuditoria({
      entidade: "portal",
      entidadeId: servidor.id,
      acao: "Acesso à área exclusiva",
      detalhe: `${servidor.nome} acessou o portal do servidor.`,
      autor: servidor.nome,
    });

    return Response.json({
      ok: true,
      servidor: {
        id: servidor.id,
        nome: servidor.nome,
        cadastroIncompleto: servidor.pendencias.length > 0,
      },
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Falha no acesso: ${mensagem}` }, { status: 500 });
  }
}

export async function DELETE() {
  await encerrarSessao();
  return Response.json({ ok: true });
}
