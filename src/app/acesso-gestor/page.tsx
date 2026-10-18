import { redirect } from "next/navigation";
import { AcessoGestorForm } from "@/components/gestor/acesso-gestor-form";
import { estadoAcessoGestor } from "@/lib/gestor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Acesso do gestor · SERVIDOR 360",
  description: "Área restrita: entre com a senha administrativa do painel do gestor.",
  robots: { index: false, follow: false },
};

export default async function PaginaAcessoGestor() {
  const estado = await estadoAcessoGestor();
  if (estado === "livre") redirect("/gestor");

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-5 py-12">
      <AcessoGestorForm modoInicial={estado === "criar" ? "criar" : "login"} />
    </div>
  );
}
