import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { servidores } from "@/db/schema";
import { gestorProtegido } from "@/lib/gestor";

const COOKIE = "s360_sessao";
const COOKIE_GESTOR = "s360_gestor";
const SEGREDO = process.env.PORTAL_SECRET ?? "servidor360-demonstracao";

function assinar(id: number) {
  return createHmac("sha256", SEGREDO).update(String(id)).digest("hex").slice(0, 32);
}

export function criarToken(id: number) {
  return `${id}.${assinar(id)}`;
}

export function lerToken(valor: string | undefined): number | null {
  if (!valor) return null;
  const [idTexto, assinatura] = valor.split(".");
  const id = Number(idTexto);
  if (!Number.isInteger(id) || !assinatura) return null;
  const esperado = assinar(id);
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? id : null;
}

export async function definirSessao(id: number) {
  const jar = await cookies();
  jar.set(COOKIE, criarToken(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function encerrarSessao() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function servidorDaSessao() {
  const jar = await cookies();
  const id = lerToken(jar.get(COOKIE)?.value);
  if (!id) return null;
  const [servidor] = await db.select().from(servidores).where(eq(servidores.id, id)).limit(1);
  return servidor ?? null;
}

export const NOME_COOKIE = COOKIE;

/* ------------------------------------------------------------------ */
/* Sessão do gestor                                                    */
/* ------------------------------------------------------------------ */

function assinarGestor() {
  return createHmac("sha256", `${SEGREDO}:gestor`).update("gestor360").digest("hex").slice(0, 32);
}

export async function definirSessaoGestor() {
  const jar = await cookies();
  jar.set(COOKIE_GESTOR, assinarGestor(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function encerrarSessaoGestor() {
  const jar = await cookies();
  jar.delete(COOKIE_GESTOR);
}

/**
 * true apenas quando o painel está liberado (acesso livre explícito no
 * ambiente local) OU quando o cookie de sessão do gestor é válido.
 * Nunca abre sem senha configurada automaticamente.
 */
export async function gestorAutenticado(): Promise<boolean> {
  if (!(await gestorProtegido())) return true;
  const jar = await cookies();
  const valor = jar.get(COOKIE_GESTOR)?.value ?? "";
  const esperado = assinarGestor();
  const a = Buffer.from(valor);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
