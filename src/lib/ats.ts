/** Regras de negócio do ATS — Adicional por Tempo de Serviço (quinquênio). */

export const QUINQUENIO_MAX = 10;
export const PERCENTUAL_POR_QUINQUENIO = 5;
/** Regra fixa do órgão: próximo quinquênio = vigência + 1825 dias. */
export const DIAS_QUINQUENIO = 1825;

export const QUINQUENIO_ORDINAIS = [
  "1º Quinquênio",
  "2º Quinquênio",
  "3º Quinquênio",
  "4º Quinquênio",
  "5º Quinquênio",
  "6º Quinquênio",
  "7º Quinquênio",
  "8º Quinquênio",
  "9º Quinquênio",
  "10º Quinquênio",
] as const;

export function rotuloQuinquenio(tipo: number) {
  return QUINQUENIO_ORDINAIS[tipo - 1] ?? `${tipo}º Quinquênio`;
}

export function tiposQuinquenio(): { tipo: number; label: string; percentual: number }[] {
  return Array.from({ length: QUINQUENIO_MAX }, (_, index) => {
    const tipo = index + 1;
    return {
      tipo,
      label: rotuloQuinquenio(tipo),
      percentual: tipo * PERCENTUAL_POR_QUINQUENIO,
    };
  });
}

/** Soma dias em uma data ISO (YYYY-MM-DD) sem sofrer influência de fuso. */
export function somarDias(iso: string, dias: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  const base = Date.UTC(year, month - 1, day);
  const alvo = new Date(base + dias * 86_400_000);
  return alvo.toISOString().slice(0, 10);
}

/** Projeção da data do próximo quinquênio: vigência + 1825 dias. */
export function projetarProximoQuinquenio(dataVigenciaISO: string): string {
  return somarDias(dataVigenciaISO, DIAS_QUINQUENIO);
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatarDataBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  if (!year || !month || !day) return "—";
  return `${day}/${month}/${year}`;
}

export function formatarDataLonga(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function diasEntre(isoA: string, isoB: string): number {
  const a = Date.parse(`${isoA}T00:00:00Z`);
  const b = Date.parse(`${isoB}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function formatarCpf(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "").padStart(11, "0").slice(-11);
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatarTelefone(tel: string | null | undefined): string {
  if (!tel) return "—";
  const digits = tel.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return tel;
}

/** Tempo de serviço em anos/meses/dias a partir de uma data base informada. */
export function tempoDeServico(dataBase: string | null | undefined) {
  if (!dataBase) return null;
  const hoje = hojeISO();
  const dias = diasEntre(dataBase, hoje);
  if (dias < 0) return { anos: 0, meses: 0, dias: 0, totalDias: 0, negativo: true };
  return {
    anos: Math.floor(dias / 365.25),
    meses: Math.floor((dias % 365.25) / 30.44),
    dias: Math.max(0, Math.round(dias % 30.44)),
    totalDias: dias,
    negativo: false,
  };
}

export function idade(dtnasc: string | null | undefined) {
  if (!dtnasc) return null;
  const anos = Math.floor(diasEntre(dtnasc, hojeISO()) / 365.25);
  return anos > 0 && anos < 130 ? anos : null;
}

export type SituacaoKey =
  | "Ativo"
  | "Afastado"
  | "Cedido"
  | "Aposentado"
  | "Exonerado"
  | "Falecido"
  | "Licença"
  | "Aposentado/Pensionista";

export const SITUACOES: SituacaoKey[] = [
  "Ativo",
  "Afastado",
  "Cedido",
  "Aposentado",
  "Exonerado",
  "Falecido",
  "Licença",
  "Aposentado/Pensionista",
];

export const LABELS_CAMPOS: Record<string, string> = {
  nome: "Nome",
  cpf: "CPF",
  rgcin: "RGCIN",
  di: "DI (dígito de identificação)",
  dtnasc: "Data de nascimento",
  tel: "Telefone",
  email: "E-mail",
  classe: "Classe",
  cargo: "Cargo",
  categoria: "Categoria",
  jornada: "Jornada",
  lotacao: "Lotação",
  situacao: "Situação",
};

export type CampoVazio = keyof typeof LABELS_CAMPOS;

/** Normaliza o DI (dígito de identificação do cargo/vínculo). */
export function normalizarDi(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim().toUpperCase().replace(/\s+/g, " ");
  return texto.length ? texto : null;
}

/** Rótulo amigável do vínculo: "DI 2 · Efetivo". */
export function rotuloVinculo(di: string | null | undefined, categoria?: string | null) {
  const partes: string[] = [];
  if (di) partes.push(`DI ${di}`);
  if (categoria) partes.push(categoria);
  return partes.length ? partes.join(" · ") : "vínculo não identificado";
}
