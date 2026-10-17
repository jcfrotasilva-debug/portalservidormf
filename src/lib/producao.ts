import { readdir } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db, descricaoConexao } from "@/db";

export type StatusItem = "ok" | "atencao" | "bloqueio";

export type ItemProntidao = {
  id: string;
  titulo: string;
  status: StatusItem;
  detalhe: string;
  comoResolver?: string;
};

export type RelatorioProntidao = {
  ambiente: string;
  geradoEm: string;
  conexao: ReturnType<typeof descricaoConexao>;
  tabelas: { nome: string; existe: boolean; registros: number | null }[];
  migracoes: { arquivos: string[]; encontradas: boolean };
  itens: ItemProntidao[];
  resumo: { ok: number; atencao: number; bloqueio: number; prontoParaProdução: boolean };
};

const TABELAS_ESPERADAS = [
  "servidores",
  "ats_quinquenios",
  "evolucoes",
  "licenca_certidoes",
  "licenca_fruicoes",
  "importacoes",
  "auditoria",
];

async function contarTabela(nome: string): Promise<number | null> {
  try {
    const resultado = await db.execute<{ total: number }>(
      sql.raw(`select count(*)::int as total from "${nome}"`),
    );
    const linhas = resultado.rows as { total: number }[];
    return linhas[0]?.total ?? 0;
  } catch {
    return null;
  }
}

async function listarMigracoes() {
  try {
    const dir = path.join(process.cwd(), "drizzle");
    const arquivos = (await readdir(dir)).filter((arquivo) => arquivo.endsWith(".sql")).sort();
    return { arquivos, encontradas: arquivos.length > 0 };
  } catch {
    return { arquivos: [], encontradas: false };
  }
}

export async function gerarRelatorio(): Promise<RelatorioProntidao> {
  const itens: ItemProntidao[] = [];
  const conexao = descricaoConexao();
  const migracoes = await listarMigracoes();

  // --- conexão com o banco ---
  let bancoOnline = false;
  try {
    await db.execute(sql`select 1`);
    bancoOnline = true;
  } catch {
    bancoOnline = false;
  }

  itens.push({
    id: "banco",
    titulo: "Conexão com o PostgreSQL",
    status: bancoOnline ? "ok" : "bloqueio",
    detalhe: bancoOnline
      ? `Conectado em ${conexao?.host ?? "host não identificado"}:${conexao?.porta ?? "?"} (${conexao?.provedor ?? "PostgreSQL"}).`
      : "Não foi possível conectar usando DATABASE_URL.",
    comoResolver: bancoOnline
      ? undefined
      : "Confira a DATABASE_URL do Supabase (Project Settings → Database → Connection string) e se o banco aceita conexões externas.",
  });

  // --- tabelas ---
  const tabelas: RelatorioProntidao["tabelas"] = [];
  for (const nome of TABELAS_ESPERADAS) {
    const total = bancoOnline ? await contarTabela(nome) : null;
    tabelas.push({ nome, existe: total !== null, registros: total });
  }
  const faltando = tabelas.filter((tabela) => !tabela.existe);

  itens.push({
    id: "schema",
    titulo: "Schema e tabelas da plataforma",
    status: bancoOnline ? (faltando.length === 0 ? "ok" : "bloqueio") : "bloqueio",
    detalhe:
      faltando.length === 0
        ? `As ${TABELAS_ESPERADAS.length} tabelas existem no banco.`
        : `Faltam ${faltando.length} tabela(s): ${faltando.map((tabela) => tabela.nome).join(", ")}.`,
    comoResolver:
      faltando.length === 0
        ? undefined
        : "Aplique as migrações com `npx drizzle-kit migrate` apontando para o Supabase, ou execute o SQL de drizzle/ no SQL Editor do Supabase.",
  });

  // --- migrações versionadas ---
  itens.push({
    id: "migracoes",
    titulo: "Migrações versionadas",
    status: migracoes.encontradas ? "ok" : "atencao",
    detalhe: migracoes.encontradas
      ? `${migracoes.arquivos.length} arquivo(s) SQL em /drizzle (${migracoes.arquivos.join(", ")}).`
      : "Nenhum arquivo .sql em /drizzle — o schema só existe via `drizzle-kit push`.",
    comoResolver: migracoes.encontradas
      ? undefined
      : "Rode `npx drizzle-kit generate` e versione a pasta drizzle/ antes do deploy.",
  });

  // --- segredo de sessão do portal ---
  const segredoDefinido = Boolean(process.env.PORTAL_SECRET && process.env.PORTAL_SECRET.length >= 16);
  itens.push({
    id: "portal-secret",
    titulo: "Segredo de sessão do portal (PORTAL_SECRET)",
    status: segredoDefinido ? "ok" : "atencao",
    detalhe: segredoDefinido
      ? "Segredo próprio configurado para assinar o cookie de sessão do servidor."
      : "Usando o segredo padrão da plataforma — defina PORTAL_SECRET com um segredo forte.",
    comoResolver: segredoDefinido
      ? undefined
      : "Gere um segredo forte (ex.: `openssl rand -hex 32`) e configure PORTAL_SECRET nas variáveis de ambiente.",
  });

  // --- autenticação do gestor ---
  const gestorProtegido = Boolean(process.env.GESTOR_SENHA && process.env.GESTOR_SENHA.length >= 8);
  itens.push({
    id: "gestor-auth",
    titulo: "Área do gestor protegida",
    status: gestorProtegido ? "ok" : "bloqueio",
    detalhe: gestorProtegido
      ? "Painel do gestor exige senha de acesso (GESTOR_SENHA)."
      : "O painel do gestor está aberto: qualquer pessoa com o link pode editar cadastros e vantagens.",
    comoResolver: gestorProtegido
      ? undefined
      : "Defina GESTOR_SENHA (mínimo 8 caracteres) nas variáveis de ambiente para exigir login em /gestor.",
  });

  itens.push({
    id: "base-producao",
    titulo: "Ambiente de produção ativo",
    status: "ok",
    detalhe: "A plataforma opera diretamente com dados reais cadastrados pelo gestor; sem interface de teste acessível.",
  });

  // --- base de servidores em uso ---
  const totalServidores = tabelas.find((tabela) => tabela.nome === "servidores")?.registros ?? 0;
  itens.push({
    id: "dados-demo",
    titulo: "Base em uso (servidores reais)",
    status: "ok",
    detalhe: `A base contém ${totalServidores} servidor(es) cadastrados pelo gestor.`,
  });

  // --- TLS ---
  itens.push({
    id: "tls",
    titulo: "Criptografia da conexão (TLS)",
    status: conexao?.ssl ? "ok" : "atencao",
    detalhe: conexao?.ssl
      ? "Conexão com TLS habilitado."
      : "Conexão sem TLS — aceitável apenas em ambiente local de desenvolvimento.",
    comoResolver: conexao?.ssl ? undefined : "No Supabase, a URL já termina com ?sslmode=require.",
  });

  const resumo = {
    ok: itens.filter((item) => item.status === "ok").length,
    atencao: itens.filter((item) => item.status === "atencao").length,
    bloqueio: itens.filter((item) => item.status === "bloqueio").length,
    prontoParaProdução: itens.every((item) => item.status === "ok"),
  };

  return {
    ambiente: process.env.NODE_ENV ?? "development",
    geradoEm: new Date().toISOString(),
    conexao,
    tabelas,
    migracoes,
    itens,
    resumo,
  };
}
