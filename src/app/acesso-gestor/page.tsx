import { AcessoGestorForm } from "@/components/gestor/acesso-gestor-form";
import { estadoAcessoGestor } from "@/lib/gestor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Acesso do gestor · SERVIDOR 360 · EE Profa. Marlene Frattini",
  description: "Área restrita: entre com seu e-mail e senha de usuário gestor.",
  robots: { index: false, follow: false },
};

export default async function PaginaAcessoGestor() {
  const estado = await estadoAcessoGestor();
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-5 py-12">
      <AcessoGestorForm modoInicial={estado} />
    </div>
  );
}
