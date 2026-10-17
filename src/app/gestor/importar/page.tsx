import type { Metadata } from "next";
import { GestorShell } from "@/components/gestor/gestor-shell";
import { ImportarWizard } from "@/components/gestor/importar-wizard";

export const metadata: Metadata = {
  title: "Importar planilha de pré-cadastro · SERVIDOR 360",
  description:
    "Carga do pré-cadastro de servidores a partir de planilha Excel, com tratamento inteligente de células vazias.",
};

export const dynamic = "force-dynamic";

export default function PaginaImportar() {
  return (
    <GestorShell
      ativo="/gestor/importar"
      titulo="Importar planilha de pré-cadastro"
      descricao="Envie o arquivo com as colunas NOME, CPF, RGCIN, DI, DTNASC, TEL, E-MAIL, CLASSE, CARGO, CATEGORIA, JORNADA, LOTACAO e SITUACAO. O sistema valida, trata células vazias e mostra o que será gravado antes de confirmar."
    >
      <ImportarWizard />
    </GestorShell>
  );
}
