import {
  autenticarGestor,
  criarPrimeiroGestor,
  estadoAcessoGestor,
} from "@/lib/gestor";
import { definirSessaoGestor, encerrarSessaoGestor } from "@/lib/sessao";
import { registrarAuditoria } from "@/lib/consultas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — entrar com e-mail e senha do usuário gestor. */
export async function POST(request: Request) {
  const corpo = (await request.json().catch(() => ({}))) as { email?: string; senha?: string };
  const email = (corpo.email ?? "").toString();
  const senha = (corpo.senha ?? "").toString();

  if (!email.trim() || !senha) {
    return Response.json({ erro: "Informe e-mail e senha." }, { status: 400 });
  }
  if ((await estadoAcessoGestor()) === "bootstrap") {
    return Response.json(
      { erro: "Nenhum usuário gestor cadastrado. Crie o primeiro administrador." },
      { status: 400 },
    );
  }

  const gestor = await autenticarGestor(email, senha);
  if (!gestor) {
    // pequena pausa para dificultar tentativas em sequência
    await new Promise((resolve) => setTimeout(resolve, 400));
    return Response.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await definirSessaoGestor(gestor.id);
  await registrarAuditoria({
    entidade: "gestor",
    entidadeId: gestor.id,
    acao: "Acesso ao painel",
    detalhe: `${gestor.nome} (${gestor.email}) entrou no painel do gestor.`,
    autor: gestor.nome,
  });

  return Response.json({
    ok: true,
    gestor: { id: gestor.id, nome: gestor.nome, email: gestor.email, perfil: gestor.perfil },
  });
}

/** PUT — criar o PRIMEIRO administrador (só funciona com a base vazia). */
export async function PUT(request: Request) {
  const corpo = (await request.json().catch(() => ({}))) as {
    nome?: string;
    email?: string;
    senha?: string;
  };

  const resultado = await criarPrimeiroGestor({
    nome: (corpo.nome ?? "").toString(),
    email: (corpo.email ?? "").toString(),
    senha: (corpo.senha ?? "").toString(),
  });

  if (!resultado.ok) return Response.json({ erro: resultado.erro }, { status: 400 });

  await definirSessaoGestor(resultado.gestor.id);
  await registrarAuditoria({
    entidade: "gestor",
    entidadeId: resultado.gestor.id,
    acao: "Primeiro administrador criado",
    detalhe: `${resultado.gestor.nome} (${resultado.gestor.email}) configurou o acesso ao painel.`,
    autor: resultado.gestor.nome,
  });

  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE() {
  await encerrarSessaoGestor();
  return Response.json({ ok: true });
}
