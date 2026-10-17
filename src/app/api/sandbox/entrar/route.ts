import { eq } from "drizzle-orm";
import { db } from "@/db";
import { servidores } from "@/db/schema";
import { registrarAuditoria } from "@/lib/consultas";
import { definirSessao, encerrarSessao } from "@/lib/sessao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Acesso de teste (sandbox) à área exclusiva de um servidor cadastrado.
 * Uso: /api/sandbox/entrar?servidorId=12  → autentica e abre /servidor em outra aba.
 * Serve para testar servidores importados da planilha, inclusive os que vieram sem CPF.
 */
function redirecionar(para: string) {
  // Location relativo evita problemas de host/proxy (sempre respeita o domínio acessado).
  return new Response(null, { status: 303, headers: { Location: para, "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const servidorId = Number(url.searchParams.get("servidorId"));

  if (!servidorId) return redirecionar("/sandbox?erro=servidor-invalido");

  const [servidor] = await db.select().from(servidores).where(eq(servidores.id, servidorId)).limit(1);
  if (!servidor) return redirecionar("/sandbox?erro=servidor-nao-encontrado");

  await definirSessao(servidor.id);
  await registrarAuditoria({
    entidade: "portal",
    entidadeId: servidor.id,
    acao: "Acesso de teste (sandbox)",
    detalhe: `${servidor.nome} acessado pelo atalho de teste do sandbox, sem login por CPF.`,
    autor: "Sandbox",
  });

  return redirecionar("/servidor");
}

/** Encerra a sessão de teste e volta para o sandbox. */
export async function DELETE() {
  await encerrarSessao();
  return redirecionar("/sandbox");
}
