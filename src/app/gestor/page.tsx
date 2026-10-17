import type { Metadata } from "next";
import { GestorShell } from "@/components/gestor/gestor-shell";
import { PainelGestor } from "@/components/gestor/painel-gestor";

export const metadata: Metadata = {
  title: "Painel do gestor · SERVIDOR 360",
  description:
    "Curadoria do cadastro funcional, lançamento de quinquênios (ATS) e projeção automática de vantagens.",
};

export const dynamic = "force-dynamic";

export default function PaginaGestor() {
  return (
    <GestorShell
      ativo="/gestor"
      titulo="Painel do gestor"
      descricao="Alimente a base com a planilha de pré-cadastro, saneie pendências e lance os quinquênios (ATS) de cada servidor. Toda alteração fica registrada na trilha de auditoria."
    >
      <PainelGestor />
    </GestorShell>
  );
}
