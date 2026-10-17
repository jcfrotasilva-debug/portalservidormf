import type { IconName } from "@/components/icons";

export type Milestone = {
  years: number;
  title: string;
  benefit: string;
  detail: string;
  icon: IconName;
  tag: "tempo" | "financeiro" | "licenca" | "carreira";
};

/**
 * Marcos ilustrativos de uma carreira estatutária brasileira.
 * Os percentuais seguem as regras mais utilizadas por municípios e estados
 * (adicional por tempo de serviço de 5% por quinquênio, licença-prêmio de
 * 3 meses a cada 5 anos, sexta-parte aos 20 anos). A plataforma permite que
 * cada órgão configure a própria regra de negócio.
 */
export const MILESTONES: Milestone[] = [
  {
    years: 0,
    title: "Posse, exercício e dossiê digital",
    benefit: "Férias de 30 dias + 1/3 constitucional",
    detail:
      "Cadastro funcional completo, documentação digitalizada, ficha financeira inicial e férias anuais garantidas.",
    icon: "file",
    tag: "carreira",
  },
  {
    years: 3,
    title: "Fim do estágio probatório",
    benefit: "Estabilidade no cargo efetivo",
    detail:
      "Três avaliações de desempenho homologadas registram a estabilidade e liberam progressões por mérito.",
    icon: "badge-check",
    tag: "carreira",
  },
  {
    years: 5,
    title: "1º quinquênio",
    benefit: "+5% de adicional por tempo de serviço",
    detail:
      "Início da série de adicionais por tempo de serviço e direito a 3 meses de licença-prêmio por quinquênio completo.",
    icon: "clock",
    tag: "financeiro",
  },
  {
    years: 10,
    title: "2º quinquênio e capacitação",
    benefit: "+10% de adicional + licença para capacitação",
    detail:
      "Consolidação do adicional, acúmulo de 6 meses de licença-prêmio e habilitação para afastamento de capacitação.",
    icon: "graduation",
    tag: "licenca",
  },
  {
    years: 15,
    title: "3º quinquênio",
    benefit: "+15% de adicional e 9 meses de licença-prêmio",
    detail:
      "Progressão funcional por titulação aplicada ao vencimento e revisão automática das médias de gratificações.",
    icon: "trending",
    tag: "financeiro",
  },
  {
    years: 20,
    title: "4º quinquênio e sexta-parte",
    benefit: "+20% e mais 25% de sexta-parte para carreiras elegíveis",
    detail:
      "O sistema identifica automaticamente o enquadramento na sexta-parte e gera o processo de implantação.",
    icon: "award",
    tag: "financeiro",
  },
  {
    years: 25,
    title: "5º quinquênio",
    benefit: "+25% de adicional e 15 meses de licença-prêmio",
    detail:
      "Simulação de aposentadoria, contagem de tempo especial e conferência de averbações em um clique.",
    icon: "layers",
    tag: "tempo",
  },
  {
    years: 30,
    title: "6º quinquênio e abono de permanência",
    benefit: "+30% de adicional e análise de abono",
    detail:
      "Notificação do servidor no início do período de opção pelo abono de permanência, com cálculo comparativo.",
    icon: "coins",
    tag: "financeiro",
  },
  {
    years: 35,
    title: "7º quinquênio — teto do adicional",
    benefit: "+35% de adicional por tempo de serviço",
    detail:
      "Limite máximo previsto na maioria das legislações, com alerta de interrupção automática e trilha de auditoria.",
    icon: "shield",
    tag: "tempo",
  },
];

export const MAX_YEARS = 35;

export function quinqueniosCompletos(years: number) {
  return Math.max(0, Math.floor(years / 5));
}

export function computeBenefits(years: number, basePay: number) {
  const quinquenios = quinqueniosCompletos(years);
  const adicionais = Math.min(quinquenios * 5, 35);
  const licencaPremioMeses = quinquenios * 3;
  const feriasDias = years * 30;
  const sextaParte = years >= 20 ? 25 : 0;
  const impacto = (basePay * adicionais) / 100;
  const total = basePay + impacto;
  const nextMilestone =
    MILESTONES.find((milestone) => milestone.years > years && milestone.years <= MAX_YEARS) ?? null;
  const progressToNext = nextMilestone
    ? Math.min(100, Math.round(((years - (nextMilestone.years - 5)) / 5) * 100))
    : 100;
  const unlocked = MILESTONES.filter((milestone) => milestone.years <= years);

  return {
    years,
    quinquenios,
    adicionais,
    licencaPremioMeses,
    feriasDias,
    sextaParte,
    basePay,
    impacto,
    total,
    nextMilestone,
    progressToNext: Math.max(0, Math.min(100, progressToNext)),
    unlocked,
    locked: MILESTONES.filter((milestone) => milestone.years > years),
  };
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatYearsMonths(years: number, months = 0) {
  const y = Math.floor(years);
  const m = Math.round(months);
  const labelY = y === 1 ? "ano" : "anos";
  if (m <= 0) return `${y} ${labelY}`;
  return `${y} ${labelY} e ${m} ${m === 1 ? "mês" : "meses"}`;
}
