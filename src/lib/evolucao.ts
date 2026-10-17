/** Motor de regras da Evolução Funcional. */

export type QuadroKey = "docente" | "suporte";

export type RegraEvolucao = {
  origem: string;
  destino: string;
  intersticioAnos: number;
  pontuacaoMinima: number;
  pesos: { atualizacao: number; aperfeicoamento: number; producao: number };
};

export const NIVEIS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;
export const TIPO_EVOLUCAO_MAX = 15;

export const QUADROS: Record<QuadroKey, { label: string; curto: string; detalhe: string }> = {
  docente: {
    label: "Classe Docentes (PEB-I e PEB-II)",
    curto: "Docentes",
    detalhe: "Professor de Educação Básica I e II — Tabela 1",
  },
  suporte: {
    label: "Classe de Suporte Pedagógico (Diretor de Escola e Supervisor de Ensino)",
    curto: "Suporte Pedagógico",
    detalhe: "Diretor de Escola e Supervisor de Ensino — Tabela 2",
  },
};

/** Tabela 1 — Classe Docentes (PEB-I e PEB-II). */
export const TABELA_DOCENTE: RegraEvolucao[] = [
  { origem: "I", destino: "II", intersticioAnos: 4, pontuacaoMinima: 35, pesos: { atualizacao: 4, aperfeicoamento: 4, producao: 2 } },
  { origem: "II", destino: "III", intersticioAnos: 4, pontuacaoMinima: 40, pesos: { atualizacao: 4, aperfeicoamento: 4, producao: 2 } },
  { origem: "III", destino: "IV", intersticioAnos: 5, pontuacaoMinima: 50, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
  { origem: "IV", destino: "V", intersticioAnos: 5, pontuacaoMinima: 60, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
  { origem: "V", destino: "VI", intersticioAnos: 4, pontuacaoMinima: 60, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
  { origem: "VI", destino: "VII", intersticioAnos: 4, pontuacaoMinima: 60, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
  { origem: "VII", destino: "VIII", intersticioAnos: 4, pontuacaoMinima: 60, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
];

/** Tabela 2 — Classe de Suporte Pedagógico. */
export const TABELA_SUPORTE: RegraEvolucao[] = [
  { origem: "I", destino: "II", intersticioAnos: 4, pontuacaoMinima: 35, pesos: { atualizacao: 4, aperfeicoamento: 4, producao: 2 } },
  { origem: "II", destino: "III", intersticioAnos: 5, pontuacaoMinima: 40, pesos: { atualizacao: 4, aperfeicoamento: 4, producao: 2 } },
  { origem: "III", destino: "IV", intersticioAnos: 6, pontuacaoMinima: 50, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
  { origem: "IV", destino: "V", intersticioAnos: 6, pontuacaoMinima: 60, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
  { origem: "V", destino: "VI", intersticioAnos: 5, pontuacaoMinima: 60, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
  { origem: "VI", destino: "VII", intersticioAnos: 5, pontuacaoMinima: 60, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
  { origem: "VII", destino: "VIII", intersticioAnos: 4, pontuacaoMinima: 60, pesos: { atualizacao: 3, aperfeicoamento: 3, producao: 4 } },
];

export const TABELAS: Record<QuadroKey, RegraEvolucao[]> = {
  docente: TABELA_DOCENTE,
  suporte: TABELA_SUPORTE,
};

export function ehQuadro(valor: string): valor is QuadroKey {
  return valor === "docente" || valor === "suporte";
}

export function tiposEvolucao() {
  return Array.from({ length: TIPO_EVOLUCAO_MAX }, (_, indice) => {
    const tipo = indice + 1;
    return { tipo, label: `${tipo}ª Evolução` };
  });
}

export function rotuloTipoEvolucao(tipo: number) {
  return `${tipo}ª Evolução`;
}

export function formatarRegra(regra: RegraEvolucao) {
  return `Nível ${regra.origem} → ${regra.destino}: ${regra.intersticioAnos} anos de interstício · ${regra.pontuacaoMinima} pontos mínimos · pesos ×${regra.pesos.atualizacao} (atualização), ×${regra.pesos.aperfeicoamento} (aperfeiçoamento) e ×${regra.pesos.producao} (produção profissional)`;
}

/** Regra da enésima evolução (tipo 1 = Nível I→II). Acima de 7 repete a última faixa. */
export function regraPorTipo(quadro: QuadroKey, tipo: number): RegraEvolucao {
  const tabela = TABELAS[quadro];
  const indice = Math.min(Math.max(tipo, 1), tabela.length) - 1;
  return tabela[indice];
}

/** Próxima regra a partir do nível atual. */
export function regraPorNivel(quadro: QuadroKey, nivel: string): RegraEvolucao | null {
  return TABELAS[quadro].find((regra) => regra.origem === nivel) ?? null;
}

export function proximoNivel(tipo: number) {
  return NIVEIS[Math.min(tipo, NIVEIS.length - 1)];
}

/** Soma anos a uma data ISO preservando 29/02 em anos bissextos. */
export function somarAnos(iso: string, anos: number): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  const alvoAno = ano + anos;
  const ultimoDia = new Date(Date.UTC(alvoAno, mes, 0)).getUTCDate();
  const alvoDia = Math.min(dia, ultimoDia);
  return `${alvoAno}-${String(mes).padStart(2, "0")}-${String(alvoDia).padStart(2, "0")}`;
}

/** Data da próxima evolução = vigência + interstício da faixa. */
export function projetarProximaEvolucao(vigenciaISO: string, intersticioAnos: number): string {
  return somarAnos(vigenciaISO, intersticioAnos);
}

export type ResumoEvolucao = {
  quantidade: number;
  temEvolucao: boolean;
  nivelAtual: string;
  nivelAtualRotulo: string;
  quadro: QuadroKey | null;
  quadroLabel: string | null;
  ultimaVigencia: string | null;
  dataProxima: string | null;
  diasParaProxima: number | null;
  proximoTipo: number;
  proximaRegra: RegraEvolucao | null;
};

export function resumoVazio(): ResumoEvolucao {
  return {
    quantidade: 0,
    temEvolucao: false,
    nivelAtual: "I",
    nivelAtualRotulo: "Nível I",
    quadro: null,
    quadroLabel: null,
    ultimaVigencia: null,
    dataProxima: null,
    diasParaProxima: null,
    proximoTipo: 1,
    proximaRegra: TABELA_DOCENTE[0],
  };
}
