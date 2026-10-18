import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { gestorAutenticado } from "@/lib/sessao";

export const dynamic = "force-dynamic";

/**
 * Protege todo o painel do gestor.
 * Exige sessão válida: a senha vem de GESTOR_SENHA ou do hash gravado no
 * banco (criado/trocado em /acesso-gestor). Fora do modo acesso-livre local,
 * o painel nunca abre sem senha.
 */
export default async function GestorLayout({ children }: { children: ReactNode }) {
  if (!(await gestorAutenticado())) {
    redirect("/acesso-gestor");
  }
  return <>{children}</>;
}
