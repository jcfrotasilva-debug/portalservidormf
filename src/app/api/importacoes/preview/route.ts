import { db } from "@/db";
import { servidores } from "@/db/schema";
import { processarPlanilha } from "@/lib/planilha";
import type { ResultadoProcessamento } from "@/lib/planilha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const arquivo = form.get("arquivo");

    if (!(arquivo instanceof File)) {
      return Response.json(
        { erro: "Envie um arquivo .xlsx, .xls ou .csv no campo \"arquivo\"." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    if (buffer.byteLength === 0) {
      return Response.json({ erro: "O arquivo enviado está vazio." }, { status: 400 });
    }
    if (buffer.byteLength > 12 * 1024 * 1024) {
      return Response.json({ erro: "Arquivo acima de 12 MB." }, { status: 413 });
    }

    const existentes = await db.select({ cpf: servidores.cpf, nome: servidores.nome, lotacao: servidores.lotacao }).from(servidores);
    const cpfs = new Set(existentes.map((item) => item.cpf).filter((cpf): cpf is string => Boolean(cpf)));
    const chaves = new Set(
      existentes.map(
        (item) =>
          `nm:${item.nome
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()}|${(item.lotacao ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Za-z0-9]+/g, " ")
            .trim()
            .toUpperCase()}`,
      ),
    );

    const resultado: ResultadoProcessamento = await processarPlanilha(buffer, arquivo.name, {
      cpfs,
      chaves,
    });

    return Response.json({ ok: true, resultado });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida ao ler a planilha.";
    return Response.json(
      { erro: `Não foi possível interpretar a planilha: ${mensagem}` },
      { status: 422 },
    );
  }
}
