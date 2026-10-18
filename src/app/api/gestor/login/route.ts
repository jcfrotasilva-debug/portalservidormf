import { definirSessaoGestor, encerrarSessaoGestor } from "@/lib/sessao";
import {
  estadoAcessoGestor,
  definirSenhaGestor,
  verificarSenhaGestor,
} from "@/lib/gestor";
import { registrarAuditoria } from "@/lib/consultas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — entrar no painel do gestor. */
export async function POST(request: Request) {
  const corpo = (await request.json().catch(() => ({}))) as { senha?: string };
  const estado = await estadoAcessoGestor();

  if (estado === "criar") {
    return Response.json(
      { erro: "Nenhuma senha de gestor configurada. Defina a senha primeiro." },
      { status: 400 },
    );
  }
  if (estado === "livre") {
    return Response.json(
      { erro: "Ambiente local de acesso livre — o painel não exige login aqui." },
      { status: 400 },
    );
  }

  const senha = (corpo.senha ?? "").toString();
  if (senha.trim().length === 0) {
    return Response.json({ erro: "Informe a senha administrativa." }, { status: 400 });
  }
  if (!(await verificarSenhaGestor(senha))) {
    return Response.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  await definirSessaoGestor();
  await registrarAuditoria({
    entidade: "gestor",
    acao: "Acesso ao painel",
    detalhe: "Sessão do gestor iniciada.",
  });
  return Response.json({ ok: true });
}

/** PUT — criar a senha (primeira vez) ou trocar (requer senha atual). */
export async function PUT(request: Request) {
  const corpo = (await request.json().catch(() => ({}))) as {
    nova?: string;
    senhaAtual?: string;
  };

  const estado = await estadoAcessoGestor();
  const nova = (corpo.nova ?? "").toString().trim();
  if (nova.length < 8 || nova.length > 100) {
    return Response.json({ erro: "A nova senha deve ter entre 8 e 100 caracteres." }, { status: 400 });
  }

  if (estado === "livre") {
    return Response.json(
      { erro: "Ambiente local de acesso livre — a senha é definida apenas em produção." },
      { status: 400 },
    );
  }

  // Troca quando já existe senha (env)
  if (estado === "login" && (process.env.GESTOR_SENHA ?? "").length >= 8) {
    const senhaAtual = (corpo.senhaAtual ?? "").toString();
    if (!(await verificarSenhaGestor(senhaAtual))) {
      return Response.json(
        { erro: "Confirme a senha atual para trocar. A nova senha é gravada no banco e passa a valer." },
        { status: 401 },
      );
    }
  }

  if (estado === "login") {
    const senhaAtual = (corpo.senhaAtual ?? "").toString();
    if (!(await verificarSenhaGestor(senhaAtual))) {
      return Response.json({ erro: "A senha atual informada não confere." }, { status: 401 });
    }
  }

  const resultado = await definirSenhaGestor(nova);
  if (!resultado.ok) return Response.json({ erro: resultado.erro }, { status: 400 });

  await registrarAuditoria({
    entidade: "gestor",
    acao: estado === "criar" ? "Senha do gestor criada" : "Senha do gestor alterada",
    detalhe: "Senha administrativa atualizada pela tela de acesso do gestor.",
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  await encerrarSessaoGestor();
  await registrarAuditoria({ entidade: "gestor", acao: "Saída do painel", detalhe: "Sessão encerrada." });
  return Response.json({ ok: true });
}
