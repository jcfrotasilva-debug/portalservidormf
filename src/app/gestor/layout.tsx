import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { gestorAutenticado, gestorProtegido } from "@/lib/sessao";

export const dynamic = "force-dynamic";

/**
 * Protege todo o painel do gestor quando GESTOR_SENHA está configurada.
 * Sem a variável, o painel permanece aberto (modo sandbox/testes).
 */
export default async function GestorLayout({ children }: { children: ReactNode }) {
  if (gestorProtegido() && !(await gestorAutenticado())) {
    redirect("/acesso-gestor");
  }
  return <>{children}</>;
}
