import { somarDias } from "@/lib/ats";
import type { LicencaCertidao, LicencaFruicao } from "@/db/schema";

/** Cada certidão de licença-prêmio concede 90 dias. */
export const DIAS_CERTIDAO = 90;
/** Conversão em pecúnia é sempre de 30 dias. */
export const DIAS_PECUNIA = 30;
/** Opções de gozo em dias. */
export const OPCOES_GOZO = [15, 30, 45, 60, 75, 90] as const;

export type TipoFruicao = "gozo" | "pecunia";

export function ehTipoFruicao(valor: string): valor is TipoFruicao {
  return valor === "gozo" || valor === "pecunia";
}

export type ResumoCertidao = {
  diasConcedidos: number;
  diasGozo: number;
  diasPecunia: number;
  diasUtilizados: number;
  saldo: number;
  percentualUtilizado: number;
  totalmenteUtilizada: boolean;
};

export function resumirCertidao(
  certidao: Pick<LicencaCertidao, "diasConcedidos">,
  fruicoes: LicencaFruicao[],
): ResumoCertidao {
  const concedidos = certidao.diasConcedidos || DIAS_CERTIDAO;
  const gozo = fruicoes.filter((item) => item.tipo === "gozo").reduce((total, item) => total + item.dias, 0);
  const pecunia = fruicoes
    .filter((item) => item.tipo === "pecunia")
    .reduce((total, item) => total + item.dias, 0);
  const utilizados = gozo + pecunia;
  const saldo = Math.max(0, concedidos - utilizados);
  return {
    diasConcedidos: concedidos,
    diasGozo: gozo,
    diasPecunia: pecunia,
    diasUtilizados: utilizados,
    saldo,
    percentualUtilizado: Math.min(100, Math.round((utilizados / concedidos) * 100)),
    totalmenteUtilizada: saldo === 0,
  };
}

export function resumirLicenca(certidoes: LicencaCertidao[], fruicoes: LicencaFruicao[]) {
  const porCertidao = new Map<number, LicencaFruicao[]>();
  for (const fruicao of fruicoes) {
    const atual = porCertidao.get(fruicao.certidaoId) ?? [];
    atual.push(fruicao);
    porCertidao.set(fruicao.certidaoId, atual);
  }

  let concedidos = 0;
  let gozo = 0;
  let pecunia = 0;
  let saldo = 0;

  for (const certidao of certidoes) {
    const resumo = resumirCertidao(certidao, porCertidao.get(certidao.id) ?? []);
    concedidos += resumo.diasConcedidos;
    gozo += resumo.diasGozo;
    pecunia += resumo.diasPecunia;
    saldo += resumo.saldo;
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const emGozo = fruicoes.filter(
    (item) => item.tipo === "gozo" && item.dataInicio && item.dataFim && item.dataInicio <= hoje && item.dataFim >= hoje,
  ).length;

  return {
    certidoes: certidoes.length,
    diasConcedidos: concedidos,
    diasGozo: gozo,
    diasPecunia: pecunia,
    saldo,
    emGozo,
    temCertidao: certidoes.length > 0,
  };
}

export type ResumoLicenca = ReturnType<typeof resumirLicenca>;

/** Data final do gozo: início + dias - 1 (contagem inclusiva, como no ato oficial). */
export function calcularDataFimGozo(dataInicioISO: string, dias: number): string {
  if (!dataInicioISO || !dias) return "";
  return somarDias(dataInicioISO, Math.max(0, dias - 1));
}

/** Dias entre início e fim, contagem inclusiva. */
export function diasDoPeriodo(inicioISO: string, fimISO: string): number {
  if (!inicioISO || !fimISO) return 0;
  const inicio = Date.parse(`${inicioISO}T00:00:00Z`);
  const fim = Date.parse(`${fimISO}T00:00:00Z`);
  if (Number.isNaN(inicio) || Number.isNaN(fim)) return 0;
  return Math.round((fim - inicio) / 86_400_000) + 1;
}

export function validarCertidao(dados: {
  numero?: string;
  ano?: number;
  periodoInicial?: string | null;
  periodoFinal?: string | null;
  dataDoe?: string | null;
}) {
  const erros: string[] = [];
  if (!dados.numero || dados.numero.trim().length === 0) erros.push("Informe o número da certidão.");
  const anoAtual = new Date().getUTCFullYear();
  if (!dados.ano || !Number.isInteger(dados.ano) || dados.ano < 1990 || dados.ano > anoAtual + 1) {
    erros.push(`Ano da certidão inválido (use entre 1990 e ${anoAtual + 1}).`);
  }
  if (!dados.periodoInicial) erros.push("Informe a data do período inicial.");
  if (!dados.periodoFinal) erros.push("Informe a data do período final.");
  if (dados.periodoInicial && dados.periodoFinal && dados.periodoFinal < dados.periodoInicial) {
    erros.push("O período final não pode ser anterior ao período inicial.");
  }
  // A publicação em DOE pode ocorrer ANTES do encerramento do período aquisitivo
  // (publicação antecipada / retificação). Não há trava entre DOE e período final.
  return erros;
}
