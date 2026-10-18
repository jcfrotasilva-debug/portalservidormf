import { GestorShell } from "@/components/gestor/gestor-shell";
import { RequerimentosGestor } from "@/components/gestor/requerimentos-gestor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Requerimentos · SERVIDOR 360",
  robots: { index: false, follow: false },
};

export default function PaginaRequerimentos() {
  return (
    <GestorShell
      ativo="/gestor/requerimentos"
      titulo="Requerimentos dos servidores"
      descricao="Analise os pedidos abertos na área do servidor, anexe documentos e registre o deferimento ou indeferimento com parecer fundamentado."
    >
      <RequerimentosGestor />
    </GestorShell>
  );
}
