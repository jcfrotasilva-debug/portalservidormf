import type {
  AtsQuinquenio,
  Evolucao,
  Importacao,
  LicencaCertidao,
  LicencaFruicao,
  Servidor,
} from "@/db/schema";
import type { ResumoEvolucao } from "@/lib/evolucao";
import type { ResumoLicenca } from "@/lib/licenca";

export type {
  AtsQuinquenio,
  Evolucao,
  Importacao,
  LicencaCertidao,
  LicencaFruicao,
  ResumoEvolucao,
  ResumoLicenca,
  Servidor,
};

export type ResumoAts = {
  quantidade: number;
  percentual: number;
  ultimaVigencia: string | null;
  ultimaVigenciaTipo: number | null;
  proximaProjetada: string | null;
  diasParaProxima: number | null;
  proximoTipo: number | null;
  temAts: boolean;
};

export type ServidorComAts = Servidor & {
  ats: ResumoAts;
  evolucao: ResumoEvolucao;
  licenca: ResumoLicenca;
};

export type MetricasBase = {
  totalServidores: number;
  ativos: number;
  comPendencias: number;
  semCpf: number;
  semDi: number;
  totalQuinquenios: number;
  proximos12Meses: number;
  percentualMedioAts: number;
  totalEvolucoes: number;
  evolucoesProximas12Meses: number;
  totalCertidoes: number;
  saldoLicencaTotal: number;
  diasGozoTotal: number;
  diasPecuniaTotal: number;
  porSituacao: { situacao: string; total: number }[];
  porLotacao: { lotacao: string; total: number }[];
};

export type AtividadeRecente = {
  id: number;
  servidorId: number | null;
  nome: string;
  tipo: number;
  dataVigencia: string;
  dataDoe: string | null;
  dataProximoProjetada: string;
  criadoPor: string;
  criadoEm: string;
};

export type LinhaPortal = {
  servidor: Servidor;
  quinquenios: AtsQuinquenio[];
  evolucoes: Evolucao[];
  certidoes: LicencaCertidao[];
  fruicoes: LicencaFruicao[];
  resumo: ResumoAts;
  resumoEvolucao: ResumoEvolucao;
  resumoLicenca: ResumoLicenca;
  tempo: { anos: number; meses: number; dias: number; totalDias: number } | null;
  idade: number | null;
  celulasVazias: string[];
};
