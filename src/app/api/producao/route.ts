import { gerarRelatorio } from "@/lib/producao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Diagnóstico de prontidão para produção (monitoramento/CI). */
export async function GET() {
  const relatorio = await gerarRelatorio();
  const status = relatorio.resumo.bloqueio > 0 ? 503 : 200;
  return Response.json(
    { ok: relatorio.resumo.bloqueio === 0, ...relatorio },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
