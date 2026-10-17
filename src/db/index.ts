import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl: string | undefined = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

/**
 * Normaliza a connection string de provedores gerenciados.
 * O driver `pg` >= 8.20 interpreta `sslmode=require` como verificação estrita
 * (`verify-full`), o que falha no pooler do Supabase por causa da cadeia de
 * certificados interna. Removemos o parâmetro da URL e configuramos o TLS
 * explicitamente, mantendo o tráfego criptografado.
 */
function prepararConexao(valor: string) {
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return { connectionString: valor, precisaSsl: process.env.DATABASE_SSL === "true" };
  }

  const modoSsl = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");

  const hostGerenciado = /supabase\.(co|com)|neon\.tech|render\.com|amazonaws\.com|azure\.com|rds\./.test(
    url.hostname,
  );
  const precisaSsl =
    modoSsl === "require" ||
    modoSsl === "verify-ca" ||
    modoSsl === "verify-full" ||
    hostGerenciado ||
    process.env.DATABASE_SSL === "true";

  // O pooler do Supabase (e a maioria dos provedores) encerra TLS com CA interna;
  // a conexão continua criptografada, apenas sem validação da cadeia pública.
  const validarCadeia = process.env.DATABASE_SSL_STRICT === "true";

  return {
    connectionString: url.toString(),
    precisaSsl,
    ssl: precisaSsl ? { rejectUnauthorized: validarCadeia } : undefined,
  };
}

const conexao = prepararConexao(databaseUrl);
const connectionString: string = conexao.connectionString;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

const maxConexoes = Number(process.env.DATABASE_POOL_MAX ?? 5);

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString,
    max: Number.isFinite(maxConexoes) && maxConexoes > 0 ? maxConexoes : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ...(conexao.ssl ? { ssl: conexao.ssl } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

export function descricaoConexao() {
  try {
    const url = new URL(connectionString);
    const host = url.hostname;
    const provedor = /supabase/.test(host)
      ? "Supabase"
      : /neon/.test(host)
        ? "Neon"
        : /127\.0\.0\.1|localhost/.test(host)
          ? "PostgreSQL local"
          : "PostgreSQL gerenciado";
    return {
      provedor,
      host,
      porta: url.port || "5432",
      database: url.pathname.replace("/", "") || "postgres",
      usuario: url.username,
      ssl: Boolean(conexao.ssl),
      poolMax: maxConexoes,
      pooled: /pooler\.supabase/.test(host) || url.port === "6543",
    };
  } catch {
    return null;
  }
}
