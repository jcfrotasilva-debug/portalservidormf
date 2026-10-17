import { atividadesRecentes, listarImportacoes, obterMetricas } from "@/lib/consultas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [metricas, atividades, importacoes] = await Promise.all([
    obterMetricas(),
    atividadesRecentes(10),
    listarImportacoes(8),
  ]);

  return Response.json({ ok: true, metricas, atividades, importacoes });
}
