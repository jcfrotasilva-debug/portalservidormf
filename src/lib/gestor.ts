import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";

/**
 * Proteção do painel do gestor.
 *
 * A senha pode vir de duas fontes:
 *  1. Variável de ambiente GESTOR_SENHA (recomendado quando o host a preserva);
 *  2. Tabela `configs` no banco (hash v1 saltado SHA-256), criada/trocada pela
 *     própria tela /acesso-gestor. Funciona mesmo se a variável não existir.
 *
 * Então: fora do modo de desenvolvimento explícito (GESTOR_ACESSO_LIVRE=true),
 * o painel NUNCA abre sem senha.
 */

export const CHAVE_CONFIG_SENHA = "gestor_senha_hash";
export const VERSAO_HASH = "v1";
const ERRO_TAMANHO = "A senha deve ter entre 8 e 100 caracteres.";

const cache = globalThis as unknown as {
  __gestorHashCache?: string | null | undefined;
};

function sha256(valor: string) {
  return createHash("sha256").update(valor).digest("hex");
}

function compararConst(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

export function acessoLivreLocal() {
  return process.env.GESTOR_ACESSO_LIVRE === "true";
}

export function senhaPorEnv() {
  return (process.env.GESTOR_SENHA ?? "").length >= 8;
}

async function hashArmazenado(): Promise<string | null> {
  if (cache.__gestorHashCache !== undefined) return cache.__gestorHashCache;
  try {
    const [registro] = await db
      .select()
      .from(configs)
      .where(eq(configs.chave, CHAVE_CONFIG_SENHA))
      .limit(1);
    cache.__gestorHashCache = registro?.valor ?? null;
  } catch {
    cache.__gestorHashCache = null;
  }
  return cache.__gestorHashCache;
}

export async function estadoAcessoGestor(): Promise<"livre" | "criar" | "login"> {
  if (acessoLivreLocal()) return "livre";
  if (senhaPorEnv()) return "login";
  return (await hashArmazenado()) ? "login" : "criar";
}

export async function gestorProtegido(): Promise<boolean> {
  return (await estadoAcessoGestor()) !== "livre";
}

export async function verificarSenhaGestor(senha: string): Promise<boolean> {
  if (acessoLivreLocal()) return true;
  const env = process.env.GESTOR_SENHA ?? "";
  if (env.length >= 8) return compararConst(senha, env);

  const valor = await hashArmazenado();
  if (!valor) return false;
  const partes = valor.split(":");
  if (partes.length !== 3 || partes[0] !== VERSAO_HASH) return false;
  const [, salt, hashEsperado] = partes;
  return compararConst(sha256(`${salt}:${senha}`), hashEsperado);
}

export async function definirSenhaGestor(senha: string) {
  if (senha.trim().length < 8 || senha.trim().length > 100) {
    return { ok: false as const, erro: ERRO_TAMANHO };
  }
  const salt = randomBytes(16).toString("hex");
  const valor = `${VERSAO_HASH}:${salt}:${sha256(`${salt}:${senha.trim()}`)}`;
  await db
    .insert(configs)
    .values({ chave: CHAVE_CONFIG_SENHA, valor, atualizadoEm: new Date() })
    .onConflictDoUpdate({
      target: configs.chave,
      set: { valor, atualizadoEm: new Date() },
    });
  cache.__gestorHashCache = valor;
  return { ok: true as const };
}

export function invalidarCache() {
  cache.__gestorHashCache = undefined;
}
