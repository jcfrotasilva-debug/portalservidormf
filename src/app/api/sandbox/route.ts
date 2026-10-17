import { obterStatusSandbox, resetarSandbox } from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** O sandbox é público de propósito: liberado para testes. */
export async function GET() {
  const status = await obterStatusSandbox();
  return Response.json(
    {
      ok: true,
      ...status,
      rotas: {
        apresentacao: "/",
        painelGestor: "/gestor",
        importarPlanilha: "/gestor/importar",
        modeloXlsx: "/api/importacoes/modelo",
        areaServidor: "/servidor",
        sandbox: "/sandbox",
      },
      aviso: "Ambiente de testes aberto. Dados fictícios, sem informação real de servidores.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Recria a base de demonstração para um novo ciclo de testes.
 * Proteções opcionais de produção:
 *  - SANDBOX_LIBERADO=false  → desativa o reset
 *  - SANDBOX_RESET_TOKEN=xyz → exige o header x-sandbox-token
 */
export async function POST(request: Request) {
  try {
    if (process.env.SANDBOX_LIBERADO === "false") {
      return Response.json(
        { erro: "Reset do sandbox desativado neste ambiente (SANDBOX_LIBERADO=false)." },
        { status: 403 },
      );
    }
    const token = process.env.SANDBOX_RESET_TOKEN;
    if (token && request.headers.get("x-sandbox-token") !== token) {
      return Response.json(
        { erro: "Informe o token de reset no header x-sandbox-token." },
        { status: 401 },
      );
    }
    const resultado = await resetarSandbox();
    return Response.json({
      ok: true,
      mensagem: "Sandbox reiniciado com os dados de demonstração.",
      ...resultado,
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida.";
    return Response.json({ erro: `Não foi possível reiniciar o sandbox: ${mensagem}` }, { status: 500 });
  }
}
