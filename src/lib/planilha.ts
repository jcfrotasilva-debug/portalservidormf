import ExcelJS from "exceljs";
import { LABELS_CAMPOS, type CampoVazio } from "@/lib/ats";

export type PayloadServidor = {
  nome: string;
  cpf: string | null;
  rgcin: string | null;
  di: string | null;
  dtnasc: string | null;
  tel: string | null;
  email: string | null;
  classe: string | null;
  cargo: string | null;
  categoria: string | null;
  jornada: string | null;
  lotacao: string | null;
  situacao: string;
};

export type StatusLinha = "nova" | "atualizar" | "duplicada" | "ignorada";

export type LinhaProcessada = {
  linha: number;
  status: StatusLinha;
  motivo: string | null;
  destino: string | null;
  payload: PayloadServidor | null;
  pendencias: string[];
  camposVazios: CampoVazio[];
  tratamentos: string[];
  bruto: Record<string, string>;
};

export type ResultadoProcessamento = {
  arquivo: string;
  formato: "xlsx" | "csv";
  cabecalhosEncontrados: string[];
  cabecalhosDesconhecidos: string[];
  colunasAusentes: string[];
  totalLinhas: number;
  linhasVaziasIgnoradas: number;
  celulasVaziasTratadas: number;
  linhas: LinhaProcessada[];
  resumo: {
    novas: number;
    atualizar: number;
    duplicadas: number;
    ignoradas: number;
    comPendencias: number;
  };
  avisos: string[];
};

/* ------------------------------------------------------------------ */
/* Mapeamento de cabeçalhos                                            */
/* ------------------------------------------------------------------ */

const ALIASES: Record<keyof PayloadServidor, string[]> = {
  nome: ["NOME", "NOME COMPLETO", "NOMEDOSERVIDOR", "SERVIDOR", "SERVIDORA"],
  cpf: ["CPF", "NUCPF", "CPF SERVIDOR", "NUMERO CPF"],
  rgcin: ["RGCIN", "RG", "RGCINRG", "RG CIN", "CIN", "IDENTIDADE", "RG CIN SSP"],
  di: ["DI", "D.I", "DI DATA DE INGRESSO", "DATA DE INGRESSO", "DATA INGRESSO", "DTINGRESSO", "DT DE INGRESSO", "DATAADMISSAO", "DATA DE ADMISSAO", "ADMISSAO"],
  dtnasc: ["DTNASC", "DT NASC", "DATA DE NASCIMENTO", "DATA NASCIMENTO", "DTNASCIMENTO", "NASCIMENTO", "DATA NASC"],
  tel: ["TEL", "TELEFONE", "CELULAR", "FONE", "CONTATO", "TELEFONE CELULAR"],
  email: ["EMAIL", "E MAIL", "EMAIL INSTITUCIONAL", "CORREIO ELETRONICO"],
  classe: ["CLASSE", "CLASSE FUNCIONAL"],
  cargo: ["CARGO", "CARGO EFETIVO", "FUNCAO", "DENOMINACAO DO CARGO"],
  categoria: ["CATEGORIA", "CATEGORIA FUNCIONAL", "REGIME", "VINCULO"],
  jornada: ["JORNADA", "CARGA HORARIA", "CH", "JORNADA DE TRABALHO", "HORAS SEMANAIS"],
  lotacao: ["LOTACAO", "UNIDADE", "SETOR", "LOCAL DE TRABALHO", "LOTACAO ATUAL", "SECRETARIA"],
  situacao: ["SITUACAO", "STATUS", "SITUACAO FUNCIONAL", "SITUACAO DO SERVIDOR"],
};

const CAMPOS = Object.keys(ALIASES) as (keyof PayloadServidor)[];

export function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toUpperCase();
}

function mapearCabecalho(valor: string): keyof PayloadServidor | null {
  const chave = normalizarTexto(valor).replace(/\s+/g, "");
  const bruto = normalizarTexto(valor);
  for (const campo of CAMPOS) {
    for (const alias of ALIASES[campo]) {
      const alvo = normalizarTexto(alias).replace(/\s+/g, "");
      if (chave === alvo || bruto === normalizarTexto(alias)) return campo;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Conversão de células (ExcelJS / CSV)                                */
/* ------------------------------------------------------------------ */

function valorParaTexto(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "SIM" : "NAO";
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
    const day = `${value.getUTCDate()}`.padStart(2, "0");
    return `${day}/${month}/${year}`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("text" in obj && typeof obj.text === "string") return obj.text.trim();
    if ("result" in obj) return valorParaTexto(obj.result);
    if ("richText" in obj && Array.isArray(obj.richText)) {
      return (obj.richText as { text?: string }[])
        .map((part) => part.text ?? "")
        .join("")
        .trim();
    }
    if ("hyperlink" in obj) return valorParaTexto(obj.text ?? obj.hyperlink);
    if ("error" in obj) return "";
  }
  return String(value).trim();
}

/* ------------------------------------------------------------------ */
/* Normalizadores por campo                                            */
/* ------------------------------------------------------------------ */

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function cpfValido(valor: string): boolean {
  const digits = apenasDigitos(valor);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const calc = (fatia: number) => {
    let soma = 0;
    for (let i = 0; i < fatia; i += 1) {
      soma += Number(digits[i]) * (fatia + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

const CONECTORES = new Set(["de", "da", "do", "das", "dos", "e", "di", "du", "del"]);

export function titulo(valor: string): string {
  return valor
    .split(/\s+/)
    .filter(Boolean)
    .map((palavra) => {
      const lower = palavra.toLocaleLowerCase("pt-BR");
      if (CONECTORES.has(lower)) return lower;
      if (/^[A-Z]{2,4}$/.test(palavra)) return palavra;
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}

export function nomeDeBusca(nome: string): string {
  return normalizarTexto(nome).toLowerCase();
}

export function chaveServidor(payload: Pick<PayloadServidor, "cpf" | "nome" | "lotacao">) {
  if (payload.cpf) return `cpf:${payload.cpf}`;
  return `nm:${nomeDeBusca(payload.nome)}|${normalizarTexto(payload.lotacao ?? "")}`;
}

function anoBissexto(ano: number) {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

const MESES: Record<string, number> = {
  JAN: 1, FEV: 2, FEB: 2, MAR: 3, ABR: 4, APR: 4, MAI: 5, MAY: 5, JUN: 6,
  JUL: 7, AGO: 8, AUG: 8, SET: 9, SEP: 9, OUT: 10, OCT: 10, NOV: 11, DEZ: 12, DEC: 12,
};

function montarISO(ano: number, mes: number, dia: number): string | null {
  if (!ano || !mes || !dia) return null;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const limite = [31, anoBissexto(ano) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1];
  if (dia > limite) return null;
  if (ano < 1900 || ano > 2100) return null;
  return `${ano}-${`${mes}`.padStart(2, "0")}-${`${dia}`.padStart(2, "0")}`;
}

/** Aceita Excel serial, Date convertido, dd/mm/aaaa, aaaa-mm-dd, dd.mm.aa, 8 dígitos e "12 de maio de 1990". */
export function parseDataFlexivel(valor: string): string | null {
  const texto = valor.trim();
  if (!texto) return null;

  if (/^\d{5}$/.test(texto)) {
    const serial = Number(texto);
    if (serial > 15000 && serial < 60000) {
      const base = Date.UTC(1899, 11, 30) + serial * 86_400_000;
      return new Date(base).toISOString().slice(0, 10);
    }
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    const [ano, mes, dia] = texto.slice(0, 10).split("-").map(Number);
    return montarISO(ano, mes, dia);
  }

  // aceita "dd/mm/aaaa", "dd.mm.aa", "dd-mm-aaaa" e também "dd/mm/aaaa hh:mm:ss"
  const separado = texto.match(/^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:[ T]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?$/);
  if (separado) {
    let [, a, b, c] = separado;
    let dia = Number(a);
    let mes = Number(b);
    let ano = Number(c);
    if (a.length === 4) {
      return montarISO(Number(a), Number(b), Number(c));
    }
    if (c.length <= 2) ano = ano > 50 ? 1900 + ano : 2000 + ano;
    if (mes > 12 && dia <= 12) {
      const troca = dia;
      dia = mes;
      mes = troca;
    }
    return montarISO(ano, mes, dia);
  }

  const compacto = texto.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compacto) {
    const [, a, b, c] = compacto;
    const candidato1 = montarISO(Number(c), Number(b), Number(a));
    if (candidato1) return candidato1;
    return montarISO(Number(a), Number(b), Number(c));
  }

  const extenso = normalizarTexto(texto).match(/^(\d{1,2})\s+([A-Z]{3,})\s+(\d{4})$/);
  if (extenso) {
    const mes = MESES[extenso[2].slice(0, 3)];
    if (mes) return montarISO(Number(extenso[3]), mes, Number(extenso[1]));
  }

  return null;
}

function normalizarSituacao(valor: string): { situacao: string | null; pendencia?: string } {
  const chave = normalizarTexto(valor);
  if (!chave) return { situacao: null };
  const mapa: Record<string, string> = {
    ATIVO: "Ativo",
    ATIVA: "Ativo",
    "EM EXERCICIO": "Ativo",
    EXERCICIO: "Ativo",
    AFASTADO: "Afastado",
    AFASTADA: "Afastado",
    LICENCA: "Licença",
    "LICENCA PREMIO": "Licença",
    "LICENCA PARA TRATAMENTO DE SAUDE": "Licença",
    CEDIDO: "Cedido",
    CEDIDA: "Cedido",
    APOSENTADO: "Aposentado",
    APOSENTADA: "Aposentado",
    APOSENTADORIA: "Aposentado",
    PENSIONISTA: "Aposentado/Pensionista",
    EXONERADO: "Exonerado",
    EXONERADA: "Exonerado",
    DEMITIDO: "Exonerado",
    FALECIDO: "Falecido",
    OBITO: "Falecido",
    INATIVO: "Exonerado",
  };
  if (mapa[chave]) return { situacao: mapa[chave] };
  return {
    situacao: titulo(valor),
    pendencia: `Situação "${valor}" fora do padrão — revise o cadastro.`,
  };
}

function normalizarJornada(valor: string): { jornada: string | null; pendencia?: string } {
  const texto = valor.trim();
  if (!texto) return { jornada: null };
  const horas = texto.match(/(\d{1,3})(?:[.,](\d{1,2}))?/);
  if (!horas) {
    return {
      jornada: titulo(texto),
      pendencia: `Jornada "${texto}" sem carga horária reconhecível.`,
    };
  }
  const inteiro = Number(horas[1]);
  const frac = horas[2] ? Number(`0.${horas[2]}`) : 0;
  const total = inteiro + frac;
  if (total < 4 || total > 60) {
    return { jornada: `${total}h/semana`, pendencia: `Jornada de ${total}h/semana fora do intervalo usual.` };
  }
  const normalizado = Number.isInteger(total) ? `${total}` : total.toFixed(1).replace(".", ",");
  return { jornada: `${normalizado}h/semana` };
}

function normalizarEmail(valor: string): { email: string | null; pendencia?: string } {
  const texto = valor.trim().toLowerCase().replace(/\s+/g, "");
  if (!texto) return { email: null };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(texto)) {
    return { email: texto, pendencia: `E-mail "${valor}" com formato inválido.` };
  }
  return { email: texto };
}

function normalizarTelefone(valor: string): { tel: string | null; pendencia?: string } {
  const digits = apenasDigitos(valor);
  if (!digits) return { tel: null };
  if (digits.length < 10 || digits.length > 11) {
    return { tel: digits, pendencia: `Telefone "${valor}" com quantidade de dígitos incomum.` };
  }
  return { tel: digits };
}

const LINHAS_RODAPE = /^(TOTAL|TOTAIS|SUBTOTAL|RODAPE|FIM|LEGENDA|OBS|OBSERVACAO)/;

/* ------------------------------------------------------------------ */
/* Leitura do arquivo                                                  */
/* ------------------------------------------------------------------ */

async function lerXlsx(buffer: Buffer): Promise<{ linhas: string[][]; avisos: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const planilha = workbook.worksheets[0];
  if (!planilha) return { linhas: [], avisos: ["O arquivo não contém nenhuma planilha."] };

  const linhas: string[][] = [];
  const maxColunas = Math.max(planilha.columnCount, 15);
  for (let r = 1; r <= planilha.rowCount; r += 1) {
    const row = planilha.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= maxColunas; c += 1) {
      cells.push(valorParaTexto(row.getCell(c).value));
    }
    linhas.push(cells);
  }
  return {
    linhas,
    avisos: planilha.rowCount > 2000 ? ["Arquivo grande: apenas as primeiras 2.000 linhas são processadas."] : [],
  };
}

function detectarDelimitador(amostra: string): string {
  const candidatos = [";", ",", "\t", "|"];
  let melhor = ";";
  let melhorContagem = -1;
  for (const candidato of candidatos) {
    const contagem = amostra.split(candidato).length;
    if (contagem > melhorContagem) {
      melhorContagem = contagem;
      melhor = candidato;
    }
  }
  return melhor;
}

function lerCsv(texto: string): { linhas: string[][]; avisos: string[] } {
  const limpo = texto.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const delimitador = detectarDelimitador(limpo.split("\n").slice(0, 5).join("\n"));
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;

  for (let i = 0; i < limpo.length; i += 1) {
    const char = limpo[i];
    if (aspas) {
      if (char === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          aspas = false;
        }
      } else {
        campo += char;
      }
      continue;
    }
    if (char === '"') {
      aspas = true;
    } else if (char === delimitador) {
      linha.push(campo.trim());
      campo = "";
    } else if (char === "\n") {
      linha.push(campo.trim());
      linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += char;
    }
  }
  if (campo || linha.length) {
    linha.push(campo.trim());
    linhas.push(linha);
  }
  return { linhas, avisos: [`Delimitador detectado: "${delimitador === "\t" ? "TAB" : delimitador}".`] };
}

/* ------------------------------------------------------------------ */
/* Pipeline principal                                                  */
/* ------------------------------------------------------------------ */

export async function processarPlanilha(
  buffer: Buffer,
  arquivo: string,
  existentes: { cpfs: Set<string>; chaves: Set<string> } = { cpfs: new Set(), chaves: new Set() },
  limiteLinhas = 2000,
): Promise<ResultadoProcessamento> {
  const ehCsv = /\.(csv|txt|tsv)$/i.test(arquivo);
  const leitura = ehCsv
    ? lerCsv(buffer.toString("utf8"))
    : await lerXlsx(buffer);

  const linhas = leitura.linhas.slice(0, limiteLinhas);
  const avisos = [...leitura.avisos];

  // localiza a linha de cabeçalho (tolera linhas de título acima da tabela)
  let indiceCabecalho = -1;
  let mapaColunas = new Map<number, keyof PayloadServidor>();
  for (let i = 0; i < Math.min(linhas.length, 15); i += 1) {
    const mapa = new Map<number, keyof PayloadServidor>();
    linhas[i].forEach((celula, indice) => {
      const campo = mapearCabecalho(celula);
      if (campo && !mapa.has(indice)) mapa.set(indice, campo);
    });
    if (mapa.size >= 3) {
      indiceCabecalho = i;
      mapaColunas = mapa;
      break;
    }
  }

  if (indiceCabecalho === -1) {
    return {
      arquivo,
      formato: ehCsv ? "csv" : "xlsx",
      cabecalhosEncontrados: [],
      cabecalhosDesconhecidos: [],
      colunasAusentes: CAMPOS.map((campo) => LABELS_CAMPOS[campo]),
      totalLinhas: 0,
      linhasVaziasIgnoradas: 0,
      celulasVaziasTratadas: 0,
      linhas: [],
      resumo: { novas: 0, atualizar: 0, duplicadas: 0, ignoradas: 0, comPendencias: 0 },
      avisos: [
        "Não foi possível localizar a linha de cabeçalho. Garanta que existam ao menos 3 colunas reconhecidas, como NOME, CPF e CARGO.",
      ],
    };
  }

  const encontrados = [...mapaColunas.values()];
  const cabecalhosEncontrados = encontrados.map((campo) => LABELS_CAMPOS[campo]);
  const colunasAusentes = CAMPOS.filter((campo) => !encontrados.includes(campo)).map(
    (campo) => LABELS_CAMPOS[campo],
  );
  const brutoCabecalho = linhas[indiceCabecalho];
  const cabecalhosDesconhecidos = brutoCabecalho
    .map((celula, indice) => (celula && !mapaColunas.has(indice) ? celula : ""))
    .filter(Boolean);

  const processadas: LinhaProcessada[] = [];
  const chavesNoArquivo = new Map<string, number>();
  let linhasVaziasIgnoradas = 0;
  let celulasVaziasTratadas = 0;

  for (let i = indiceCabecalho + 1; i < linhas.length; i += 1) {
    const bruto: Record<string, string> = {};
    mapaColunas.forEach((campo, indice) => {
      bruto[campo] = (linhas[i][indice] ?? "").trim();
    });

    const numeroLinha = i + 1;
    const algumValor = Object.values(bruto).some((valor) => valor.length > 0);
    if (!algumValor) {
      linhasVaziasIgnoradas += 1;
      continue;
    }

    const pendencias: string[] = [];
    const tratamentos: string[] = [];
    const camposVazios: CampoVazio[] = [];

    const registrarVazio = (campo: CampoVazio, tratamento?: string) => {
      camposVazios.push(campo);
      celulasVaziasTratadas += 1;
      if (tratamento) tratamentos.push(tratamento);
    };

    const nomeBruto = bruto.nome ?? "";
    if (!nomeBruto) {
      processadas.push({
        linha: numeroLinha,
        status: "ignorada",
        motivo: "Célula NOME vazia — linha sem identificação não pode ser cadastrada.",
        destino: null,
        payload: null,
        pendencias: ["Preencher o nome do servidor e reenviar a linha."],
        camposVazios: ["nome"],
        tratamentos: [],
        bruto,
      });
      continue;
    }
    if (LINHAS_RODAPE.test(normalizarTexto(nomeBruto))) {
      processadas.push({
        linha: numeroLinha,
        status: "ignorada",
        motivo: "Linha de total/rodapé detectada automaticamente.",
        destino: null,
        payload: null,
        pendencias: [],
        camposVazios: [],
        tratamentos: [],
        bruto,
      });
      continue;
    }

    const nome = titulo(nomeBruto.replace(/\s+/g, " "));

    const cpfTexto = bruto.cpf ?? "";
    let cpf: string | null = null;
    if (!cpfTexto) {
      registrarVazio("cpf", "CPF vazio: deduplicação feita por nome + lotação.");
      pendencias.push("CPF não informado — complemente o cadastro para habilitar o acesso do servidor.");
    } else if (cpfValido(cpfTexto)) {
      cpf = apenasDigitos(cpfTexto);
    } else {
      registrarVazio("cpf", "CPF inválido descartado e sinalizado para conferência.");
      pendencias.push(`CPF inválido na planilha ("${cpfTexto}") — confira com o RH.`);
    }

    const rgcin = bruto.rgcin?.trim() || null;
    if (!rgcin) registrarVazio("rgcin");

    const diBruto = bruto.di ?? "";
    const di = diBruto ? parseDataFlexivel(diBruto) : null;
    if (!diBruto) {
      registrarVazio("di");
      pendencias.push("DI vazia: não é possível gerar quinquênios automaticamente para este servidor.");
    } else if (!di) {
      pendencias.push(`DI ilegível ("${diBruto}") — use o formato dd/mm/aaaa.`);
    }

    const nascBruto = bruto.dtnasc ?? "";
    const dtnasc = nascBruto ? parseDataFlexivel(nascBruto) : null;
    if (!nascBruto) {
      registrarVazio("dtnasc");
      pendencias.push("Data de nascimento vazia — acesso do servidor liberado apenas por CPF.");
    } else if (!dtnasc) {
      pendencias.push(`Data de nascimento ilegível ("${nascBruto}").`);
    }

    const telBruto = bruto.tel ?? "";
    const telefone = telBruto ? normalizarTelefone(telBruto) : { tel: null };
    if (!telBruto) registrarVazio("tel");
    if (telefone.pendencia) pendencias.push(telefone.pendencia);

    const emailBruto = bruto.email ?? "";
    const email = emailBruto ? normalizarEmail(emailBruto) : { email: null };
    if (!emailBruto) registrarVazio("email");
    if (email.pendencia) pendencias.push(email.pendencia);

    const classe = bruto.classe ? titulo(bruto.classe) : null;
    if (!classe) registrarVazio("classe");
    const cargo = bruto.cargo ? titulo(bruto.cargo) : null;
    if (!cargo) {
      registrarVazio("cargo");
      pendencias.push("Cargo não informado — obrigatório para cálculo de vantagens por classe.");
    }
    const categoria = bruto.categoria ? titulo(bruto.categoria) : null;
    if (!categoria) {
      registrarVazio("categoria");
      pendencias.push("Categoria/regime não informado.");
    }

    const jornadaBruta = bruto.jornada ?? "";
    const jornada = jornadaBruta ? normalizarJornada(jornadaBruta) : { jornada: null };
    if (!jornadaBruta) {
      registrarVazio("jornada");
      pendencias.push("Jornada vazia — informe a carga horária semanal.");
    }
    if (jornada.pendencia) pendencias.push(jornada.pendencia);

    const lotacao = bruto.lotacao ? titulo(bruto.lotacao) : null;
    if (!lotacao) {
      registrarVazio("lotacao");
      pendencias.push("Lotação vazia — aloque o servidor em uma unidade.");
    }

    const situacaoBruta = bruto.situacao ?? "";
    const situacao = normalizarSituacao(situacaoBruta);
    if (situacao.pendencia) pendencias.push(situacao.pendencia);
    if (!situacao.situacao) {
      registrarVazio("situacao", "Situação vazia: assumido \"Ativo\" como padrão de importação.");
      pendencias.push('Situação não informada — registrado como "Ativo" até revisão do RH.');
    }

    const payload: PayloadServidor = {
      nome,
      cpf,
      rgcin,
      di,
      dtnasc,
      tel: telefone.tel,
      email: email.email,
      classe,
      cargo,
      categoria,
      jornada: jornada.jornada,
      lotacao,
      situacao: situacao.situacao ?? "Ativo",
    };

    const chave = chaveServidor(payload);
    let status: StatusLinha = "nova";
    let destino: string | null = "Cadastro novo";
    let motivo: string | null = null;

    const chaveAnterior = chavesNoArquivo.get(chave);
    if (chaveAnterior) {
      status = "duplicada";
      motivo = `Mesmo registro da linha ${chaveAnterior} (${cpf ? "CPF" : "nome + lotação"} repetido).`;
      destino = null;
    } else if (payload.cpf && existentes.cpfs.has(payload.cpf)) {
      status = "atualizar";
      destino = "Servidor já cadastrado (CPF) — dados serão atualizados";
    } else if (existentes.chaves.has(chave)) {
      status = "atualizar";
      destino = "Servidor já cadastrado (nome + lotação) — dados serão atualizados";
    } else {
      chavesNoArquivo.set(chave, numeroLinha);
    }

    processadas.push({
      linha: numeroLinha,
      status,
      motivo,
      destino,
      payload,
      pendencias,
      camposVazios,
      tratamentos,
      bruto,
    });
  }

  processadas.sort((a, b) => a.linha - b.linha);

  return {
    arquivo,
    formato: ehCsv ? "csv" : "xlsx",
    cabecalhosEncontrados,
    cabecalhosDesconhecidos,
    colunasAusentes,
    totalLinhas: processadas.length,
    linhasVaziasIgnoradas,
    celulasVaziasTratadas,
    linhas: processadas,
    resumo: {
      novas: processadas.filter((linha) => linha.status === "nova").length,
      atualizar: processadas.filter((linha) => linha.status === "atualizar").length,
      duplicadas: processadas.filter((linha) => linha.status === "duplicada").length,
      ignoradas: processadas.filter((linha) => linha.status === "ignorada").length,
      comPendencias: processadas.filter((linha) => linha.pendencias.length > 0).length,
    },
    avisos,
  };
}
