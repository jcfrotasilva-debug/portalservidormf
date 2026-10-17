import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { gestorAutenticado, gestorProtegido } from "@/lib/sessao";

export const dynamic = "force-dynamic";

/**
 * Protege todo o painel do gestor.
 * Requer GESTOR_SENHA configurada nas variáveis de ambiente; sem ela, o painel
 * permanece aberto (não recomendado em produção).
 */
export default async function GestorLayout({ children }: { children: ReactNode }) {
  if (gestorProtegido() && !(await gestorAutenticado())) {
    redirect("/acesso-gestor");
  }
  return <>{children}</>;
}
