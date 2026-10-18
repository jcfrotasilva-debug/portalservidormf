import type { requerimentoAnexos, requerimentos } from "@/db/schema";

export type Requerimento = typeof requerimentos.$inferSelect;
export type RequerimentoAnexo = typeof requerimentoAnexos.$inferSelect;

export type StatusRequerimento = "protocolado" | "em_analise" | "deferido" | "indeferido";

export const STATUS: StatusRequerimento[] = [
  "protocolado",
  "em_analise",
  "deferido",
  "indeferido",
];

export const STATUS_ROTULO: Record<string, string> = {
  protocolado: "Protocolado",
  em_analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

export const STATUS_COR: Record<string, string> = {
  protocolado: "border-brand-300 bg-brand-100 text-brand-800",
  em_analise: "border-gold-600/30 bg-gold-100 text-gold-600",
  deferido: "border-jade-300 bg-jade-100 text-jade-500",
  indeferido: "border-red-300 bg-red-200/70 text-red-400",
};

/** Assuntos mais comuns; o servidor também pode descrever livremente. */
export const TIPOS_REQUERIMENTO = [
  "Licença-prêmio — gozo",
  "Licença-prêmio — conversão em pecúnia",
  "ATS / quinquênio — contagem ou revisão",
  "Evolução funcional — enquadramento",
  "Certidão de tempo de serviço",
  "Declaração funcional",
  "Averbação de tempo de serviço",
  "Atualização de dados cadastrais",
  "Férias — agendamento ou alteração",
  "Outros",
] as const;

export function ehStatus(valor: string): valor is StatusRequerimento {
  return (STATUS as string[]).includes(valor);
}

export function statusFinalizado(status: string) {
  return status === "deferido" || status === "indeferido";
}

/** Protocolo no formato REQ-2026-000123. */
export function montarProtocolo(id: number, ano = new Date().getUTCFullYear()) {
  return `REQ-${ano}-${String(id).padStart(6, "0")}`;
}

/* ----------------------------- anexos ----------------------------- */

export const TAMANHO_MAX_ANEXO = 5 * 1024 * 1024; // 5 MB
export const MAX_ANEXOS = 10;

export const MIMES_ACEITOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function mimeAceito(mime: string) {
  return MIMES_ACEITOS.includes(mime);
}

export function extensoesAceitas() {
  return ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";
}

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validarArquivo(nome: string, mime: string, tamanho: number) {
  if (!mimeAceito(mime)) {
    return `Formato não aceito em "${nome}". Envie PDF, imagem (JPG/PNG/WEBP) ou Word.`;
  }
  if (tamanho > TAMANHO_MAX_ANEXO) {
    return `O arquivo "${nome}" tem ${formatarTamanho(tamanho)} — o limite é ${formatarTamanho(
      TAMANHO_MAX_ANEXO,
    )}.`;
  }
  if (tamanho === 0) return `O arquivo "${nome}" está vazio.`;
  return null;
}

export type RequerimentoCompleto = Requerimento & {
  anexos: Omit<RequerimentoAnexo, "conteudo">[];
  servidorNome?: string;
  servidorCpf?: string | null;
  servidorDi?: string | null;
  servidorCargo?: string | null;
  servidorLotacao?: string | null;
};
