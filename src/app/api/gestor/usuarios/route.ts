import {
  atualizarGestor,
  criarGestor,
  listarGestores,
  perfilRotulo,
  type PerfilGestor,
} from "@/lib/gestor";
import { gestorAdminDaSessao } from "@/lib/sessao";
import { registrarAuditoria } from "@/lib/consultas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEM_PERMISSAO = "Apenas administradores podem gerenciar usuários.";

/** GET — lista de usuários gestores (somente admin). */
export async function GET() {
  const admin = await gestorAdminDaSessao();
  if (!admin) return Response.json({ erro: SEM_PERMISSAO }, { status: 403 });

  const lista = await listarGestores();
  return Response.json({
    ok: true,
    gestores: lista.map((gestor) => ({
      id: gestor.id,
      nome: gestor.nome,
      email: gestor.email,
      perfil: gestor.perfil,
      perfilRotulo: perfilRotulo(gestor.perfil),
      ativo: gestor.ativo,
      ultimoAcesso: gestor.ultimoAcesso ? gestor.ultimoAcesso.toISOString() : null,
      criadoEm: gestor.criadoEm.toISOString(),
    })),
  });
}

/** POST — criar novo usuário gestor (somente admin). */
export async function POST(request: Request) {
  const admin = await gestorAdminDaSessao();
  if (!admin) return Response.json({ erro: SEM_PERMISSAO }, { status: 403 });

  const corpo = (await request.json().catch(() => ({}))) as {
    nome?: string;
    email?: string;
    senha?: string;
    perfil?: string;
  };

  const resultado = await criarGestor({
    nome: (corpo.nome ?? "").toString(),
    email: (corpo.email ?? "").toString(),
    senha: (corpo.senha ?? "").toString(),
    perfil: (corpo.perfil === "admin" ? "admin" : "gestor") as PerfilGestor,
  });

  if (!resultado.ok) return Response.json({ erro: resultado.erro }, { status: 400 });

  await registrarAuditoria({
    entidade: "gestor",
    entidadeId: resultado.gestor.id,
    acao: "Usuário gestor criado",
    detalhe: `${resultado.gestor.nome} (${resultado.gestor.email}) criado como ${perfilRotulo(
      resultado.gestor.perfil,
    )}.`,
    autor: admin.nome,
  });

  return Response.json({ ok: true }, { status: 201 });
}

/** PATCH — editar nome, perfil, situação ou redefinir senha (somente admin). */
export async function PATCH(request: Request) {
  const admin = await gestorAdminDaSessao();
  if (!admin) return Response.json({ erro: SEM_PERMISSAO }, { status: 403 });

  const corpo = (await request.json().catch(() => ({}))) as {
    id?: number;
    nome?: string;
    perfil?: string;
    ativo?: boolean;
    novaSenha?: string;
  };

  const id = Number(corpo.id);
  if (!Number.isInteger(id)) {
    return Response.json({ erro: "Selecione o usuário." }, { status: 400 });
  }

  const resultado = await atualizarGestor(id, {
    nome: corpo.nome,
    perfil: corpo.perfil === "admin" || corpo.perfil === "gestor" ? corpo.perfil : undefined,
    ativo: typeof corpo.ativo === "boolean" ? corpo.ativo : undefined,
    novaSenha: corpo.novaSenha,
  });

  if (!resultado.ok) return Response.json({ erro: resultado.erro }, { status: 400 });

  const acoes: string[] = [];
  if (corpo.nome) acoes.push("nome atualizado");
  if (corpo.perfil) acoes.push(`perfil → ${perfilRotulo(corpo.perfil)}`);
  if (typeof corpo.ativo === "boolean") acoes.push(corpo.ativo ? "ativado" : "desativado");
  if (corpo.novaSenha) acoes.push("senha redefinida");

  await registrarAuditoria({
    entidade: "gestor",
    entidadeId: id,
    acao: "Usuário gestor alterado",
    detalhe: `${resultado.gestor.nome} (${resultado.gestor.email}): ${acoes.join(", ") || "sem alteração"}.`,
    autor: admin.nome,
  });

  return Response.json({ ok: true });
}
