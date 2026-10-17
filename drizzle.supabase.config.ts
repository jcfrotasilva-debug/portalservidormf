import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL não definida. Configure a connection string do Supabase no .env antes de rodar as migrações.",
  );
}

/**
 * Config usada para aplicar migrações no banco de produção (Supabase).
 *
 *   npx drizzle-kit generate --config=drizzle.supabase.config.ts
 *   npx drizzle-kit migrate  --config=drizzle.supabase.config.ts
 *
 * O drizzle.config.json continua apontando para o Postgres local do sandbox.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  // O SSL é negociado pela própria connection string (?sslmode=require).
  verbose: true,
  strict: false,
});
