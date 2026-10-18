import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CABECALHOS = [
  "NOME",
  "CPF",
  "RGCIN",
  "DI",
  "DTNASC",
  "TEL",
  "E-MAIL",
  "CLASSE",
  "CARGO",
  "CATEGORIA",
  "JORNADA",
  "LOTACAO",
  "SITUACAO",
];

/** Linhas propositalmente heterogêneas: datas em formatos diferentes e células vazias. */
const EXEMPLOS: (string | number | null)[][] = [
  [
    "MARIANA ALVES DE SOUZA",
    "52998224725",
    "12.345.678-9 SSP/SP",
    "1",
    "18/07/1988",
    "(11) 98877-6655",
    "mariana.souza@orgao.gov.br",
    "CLASSE B",
    "ANALISTA DE GESTAO PUBLICA",
    "EFETIVO",
    "40",
    "SECRETARIA DE ADMINISTRACAO",
    "ATIVO",
  ],
  [
    "joao pedro ferreira",
    "11144477735",
    "MG-9988776",
    "2",
    "02/02/1990",
    "31988887777",
    "JOAO.FERREIRA@ORGAO.GOV.BR",
    "CLASSE A",
    "AGENTE ADMINISTRATIVO",
    "EFETIVO",
    "30h",
    "SECRETARIA DE SAUDE",
    null,
  ],
  [
    "CÉLIA MARIA ROCHA",
    "39053344705",
    null,
    "ACT-F",
    "30/09/1979",
    "11 3344 5566",
    "celia.rocha@orgao",
    "CLASSE C",
    "PROFESSORA",
    "EFETIVO",
    null,
    "SECRETARIA DE EDUCACAO",
    "AFASTADO",
  ],
  [
    "Rafael Teixeira Lima",
    null,
    "1234567-8",
    null,
    null,
    null,
    null,
    null,
    "FISCAL DE POSTURAS",
    null,
    "40h/semana",
    null,
    "ATIVO",
  ],
  [
    "Antônia da Silva Barros",
    "15350946056",
    "CIN 4455667",
    "1",
    "11/11/1971",
    "62991112233",
    "antonia.barros@orgao.gov.br",
    "CLASSE D",
    "TECNICA EM ENFERMAGEM",
    "EFETIVO",
    "36 horas",
    "HOSPITAL MUNICIPAL",
    "LICENCA PREMIO",
  ],
  ["TOTAL DE SERVIDORES", 5, null, null, null, null, null, null, null, null, null, null, null],
];

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SERVIDOR 360";
  const planilha = workbook.addWorksheet("Pre-cadastro");

  planilha.addRow(["PLATAFORMA SERVIDOR 360 - MODELO DE PRE-CADASTRO DE SERVIDORES"]);
  planilha.addRow([
    "Uma linha por VINCULO. O DI (digito de identificacao do cargo) diferencia vinculos do mesmo servidor.",
  ]);
  planilha.addRow([]);

  const cabecalho = planilha.addRow(CABECALHOS);
  cabecalho.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cabecalho.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF122A5C" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  planilha.getRow(1).font = { bold: true, size: 13 };
  planilha.getRow(4).height = 22;

  EXEMPLOS.forEach((linha) => planilha.addRow(linha));

  planilha.columns.forEach((coluna) => {
    coluna.width = 24;
  });

  const saida = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(saida as unknown as ArrayBuffer);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-pre-cadastro-servidor360.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
