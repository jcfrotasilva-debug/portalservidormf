import { definirSessaoGestor, encerrarSessaoGestor, gestorProtegido, senhaGestorCorreta } from "@/lib/sessao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const corpo = (await request.json().catch(() => ({}))) as { senha?: string };

  if (!gestorProtegido()) {
    return Response.json(
      { erro: "Acesso livre neste ambiente: defina GESTOR_SENHA para exigir login." },
      { status: 400 },
    );
  }

  if (!senhaGestorCorreta(corpo.senha ?? "")) {
    return Response.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  await definirSessaoGestor();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await encerrarSessaoGestor();
  return Response.json({ ok: true });
}
