import { notFound } from "next/navigation";
import { GestorShell } from "@/components/gestor/gestor-shell";
import { DetalheServidor } from "@/components/gestor/detalhe-servidor";
import { obterServidor } from "@/lib/consultas";

export const dynamic = "force-dynamic";

export default async function PaginaServidor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const detalhe = await obterServidor(numero);
  if (!detalhe) notFound();

  return (
    <GestorShell
      ativo="/gestor"
      titulo="Ficha funcional do servidor"
      descricao="Dossiê completo: dados do pré-cadastro, pendências herdadas da planilha, quinquênios lançados com projeção do próximo e histórico de auditoria."
    >
      <DetalheServidor
        servidor={detalhe.servidor}
        quinquenios={detalhe.quinquenios}
        resumo={detalhe.resumo}
        evolucoes={detalhe.evolucoes}
        resumoEvolucao={detalhe.resumoEvolucao}
        certidoes={detalhe.certidoes}
        fruicoes={detalhe.fruicoes}
        resumoLicenca={detalhe.resumoLicenca}
        historico={detalhe.historico}
        historicoAts={detalhe.historicoAts}
      />
    </GestorShell>
  );
}
