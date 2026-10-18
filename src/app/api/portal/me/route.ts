import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { atsQuinquenios, evolucoes, licencaCertidoes, licencaFruicoes } from "@/db/schema";
import { resumirEvolucao, resumirAts } from "@/lib/consultas";
import { resumirLicenca } from "@/lib/licenca";
import { LABELS_CAMPOS, idade, somarDias, tempoDeServico, type CampoVazio } from "@/lib/ats";
import { servidorDaSessao } from "@/lib/sessao";
import type { LinhaPortal } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const servidor = await servidorDaSessao();
  if (!servidor) {
    return Response.json({ ok: false, autenticado: false }, { status: 401 });
  }

  const [quinquenios, evolucoesLista, certidoesLista, fruicoesLista] = await Promise.all([
    db
      .select()
      .from(atsQuinquenios)
      .where(eq(atsQuinquenios.servidorId, servidor.id))
      .orderBy(asc(atsQuinquenios.tipo)),
    db
      .select()
      .from(evolucoes)
      .where(eq(evolucoes.servidorId, servidor.id))
      .orderBy(asc(evolucoes.tipo)),
    db
      .select()
      .from(licencaCertidoes)
      .where(eq(licencaCertidoes.servidorId, servidor.id)),
    db
      .select()
      .from(licencaFruicoes)
      .where(eq(licencaFruicoes.servidorId, servidor.id)),
  ]);

  const primeiroAts = [...quinquenios].sort((a, b) => a.tipo - b.tipo)[0];
  const baseTempo = primeiroAts ? somarDias(primeiroAts.dataVigencia, -1825) : null;

  const camposVazios: CampoVazio[] = (servidor.camposVazios ?? []) as CampoVazio[];

  const payload: LinhaPortal = {
    servidor,
    quinquenios,
    evolucoes: evolucoesLista,
    certidoes: certidoesLista,
    fruicoes: fruicoesLista,
    resumo: resumirAts(quinquenios),
    resumoEvolucao: resumirEvolucao(evolucoesLista),
    resumoLicenca: resumirLicenca(certidoesLista, fruicoesLista),
    // Sem data de admissão na planilha, o tempo é estimado pelo 1º quinquênio
    // (vigência do 1º ATS − 5 anos). Null quando não há ATS lançado.
    tempo: tempoDeServico(baseTempo),
    idade: idade(servidor.dtnasc),
    celulasVazias: camposVazios.map((campo) => LABELS_CAMPOS[campo] ?? campo),
  };

  return Response.json({ ok: true, autenticado: true, ...payload });
}
