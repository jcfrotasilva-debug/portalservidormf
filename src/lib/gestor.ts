import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { gestores } from "@/db/schema";

/**
 * Usuários do painel do gestor.
 * Não existe senha única: cada gestor tem email e senha próprios.
 * O primeiro usuário é criado pela própria tela de acesso (perfil admin).
 */

export type Gestor = typeof gestores.$inferSelect;
export type PerfilGestor = "admin" | "gestor";

export const MIN_SENHA = 8;
export const PERFIS: PerfilGestor[] = ["admin", "gestor"];

/* ------------------------------ senha ------------------------------ */

function hashSenha(senha: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function conferirSenha(senha: string, armazenado: string) {
  const [algoritmo, salt, hash] = armazenado.split(":");
  if (algoritmo !== "scrypt" || !salt || !hash) return false;
  const teste = scryptSync(senha, salt, 64).toString("hex");
  const a = Buffer.from(teste);
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ----------------------------- validação ---------------------------- */

function normalizarEmail(valor: string) {
  return valor.trim().toLowerCase().replace(/\s+/g, "");
}

export function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valor.trim());
}

/* ------------------------------ consultas -------------------------- */

export async function contarGestores(): Promise<number> {
  const [row] = await db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(gestores);
  return row?.total ?? 0;
}

/** "bootstrap" quando ainda não há usuários; "login" no uso normal. */
export async function estadoAcessoGestor(): Promise<"bootstrap" | "login"> {
  return (await contarGestores()) === 0 ? "bootstrap" : "login";
}

export async function obterGestorPorId(id: number): Promise<Gestor | null> {
  const [row] = await db.select().from(gestores).where(eq(gestores.id, id)).limit(1);
  return row ?? null;
}

export async function listarGestores(): Promise<Gestor[]> {
  return db.select().from(gestores).orderBy(asc(gestores.nome));
}

export async function autenticarGestor(emailBruto: string, senha: string): Promise<Gestor | null> {
  const email = normalizarEmail(emailBruto);
  if (!email || !senha) return null;
  const [row] = await db
    .select()
    .from(gestores)
    .where(and(eq(gestores.email, email), eq(gestores.ativo, true)))
    .limit(1);
  if (!row) return null;
  if (!conferirSenha(senha, row.senhaHash)) return null;

  await db.update(gestores).set({ ultimoAcesso: new Date() }).where(eq(gestores.id, row.id));
  return row;
}

/* ------------------------------- escrita --------------------------- */

export async function criarPrimeiroGestor(entrada: {
  nome: string;
  email: string;
  senha: string;
}): Promise<{ ok: true; gestor: Gestor } | { ok: false; erro: string }> {
  if ((await contarGestores()) > 0) {
    return { ok: false, erro: "Já existe um usuário gestor. Faça login normalmente." };
  }
  return criarGestor({ ...entrada, perfil: "admin" });
}

export async function criarGestor(entrada: {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilGestor;
}): Promise<{ ok: true; gestor: Gestor } | { ok: false; erro: string }> {
  const nome = entrada.nome.trim().replace(/\s+/g, " ");
  const email = normalizarEmail(entrada.email);

  if (nome.length < 3) return { ok: false, erro: "Informe o nome completo do usuário." };
  if (!emailValido(email)) return { ok: false, erro: "E-mail inválido." };
  if (entrada.senha.length < MIN_SENHA) {
    return { ok: false, erro: `A senha deve ter no mínimo ${MIN_SENHA} caracteres.` };
  }
  if (!PERFIS.includes(entrada.perfil)) return { ok: false, erro: "Perfil inválido." };

  const [existente] = await db
    .select({ id: gestores.id })
    .from(gestores)
    .where(eq(gestores.email, email))
    .limit(1);
  if (existente) return { ok: false, erro: "Já existe usuário com este e-mail." };

  const [gestor] = await db
    .insert(gestores)
    .values({
      nome,
      email,
      senhaHash: hashSenha(entrada.senha),
      perfil: entrada.perfil,
      ativo: true,
    })
    .returning();

  return { ok: true, gestor };
}

export async function atualizarGestor(
  id: number,
  alteracoes: {
    nome?: string;
    perfil?: PerfilGestor;
    ativo?: boolean;
    novaSenha?: string;
  },
): Promise<{ ok: true; gestor: Gestor } | { ok: false; erro: string }> {
  const atual = await obterGestorPorId(id);
  if (!atual) return { ok: false, erro: "Usuário não encontrado." };

  const valores: Partial<typeof gestores.$inferInsert> = { atualizadoEm: new Date() };

  if (alteracoes.nome !== undefined) {
    const nome = alteracoes.nome.trim().replace(/\s+/g, " ");
    if (nome.length < 3) return { ok: false, erro: "Informe o nome completo." };
    valores.nome = nome;
  }
  if (alteracoes.perfil !== undefined) {
    if (!PERFIS.includes(alteracoes.perfil)) return { ok: false, erro: "Perfil inválido." };
    valores.perfil = alteracoes.perfil;
  }
  if (alteracoes.ativo !== undefined) valores.ativo = alteracoes.ativo;
  if (alteracoes.novaSenha !== undefined && alteracoes.novaSenha !== "") {
    if (alteracoes.novaSenha.length < MIN_SENHA) {
      return { ok: false, erro: `A nova senha deve ter no mínimo ${MIN_SENHA} caracteres.` };
    }
    valores.senhaHash = hashSenha(alteracoes.novaSenha);
  }

  // não permitir desativar/rebaixar o último administrador ativo
  const adminsAtivos = await db
    .select({ id: gestores.id })
    .from(gestores)
    .where(and(eq(gestores.perfil, "admin"), eq(gestores.ativo, true)));
  const restaOutroAdmin = adminsAtivos.some((admin) => admin.id !== id);
  if (
    adminsAtivos.length > 0 &&
    adminsAtivos.every((admin) => admin.id === id) &&
    (valores.perfil === "gestor" || valores.ativo === false)
  ) {
    return {
      ok: false,
      erro: "Este é o único administrador ativo. Crie outro administrador antes de alterá-lo.",
    };
  }

  const [gestor] = await db.update(gestores).set(valores).where(eq(gestores.id, id)).returning();
  return { ok: true, gestor };
}

export function perfilRotulo(perfil: string) {
  return perfil === "admin" ? "Administrador" : "Gestor";
}
