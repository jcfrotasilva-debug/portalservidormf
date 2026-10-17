import { Icon, type IconName } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";

const PROBLEMS: { icon: IconName; title: string; text: string; tag: string }[] = [
  {
    icon: "database",
    tag: "Fragmentação",
    title: "O cadastro vive em planilhas paralelas",
    text: "Fichas funcionais em pastas de rede, dados duplicados e versões conflitantes. Cada relatório exige uma nova conferência manual e gera retrabalho para o RH.",
  },
  {
    icon: "clock",
    tag: "Perda de direito",
    title: "Vantagens vencem sem ninguém perceber",
    text: "Quinquênios, licenças-prêmio, progressões e sexta-parte dependem de contagem manual. Quando o erro aparece, o passivo já está formado.",
  },
  {
    icon: "users",
    tag: "Opacidade",
    title: "O servidor não vê a própria história",
    text: "Sem acesso aos próprios dados, o servidor depende de ofícios e protocolos para saber seu tempo de serviço, férias e vantagens já adquiridas.",
  },
];

const PILLARS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "file",
    title: "Cadastro único e fidedigno",
    text: "Um dossiê funcional por servidor, com validação por campo, anexos digitalizados e histórico de todo ato administrativo.",
  },
  {
    icon: "scale",
    title: "Motor de regras de vantagens",
    text: "O sistema aplica o estatuto do órgão, calcula o que foi adquirido e projeta o próximo direito com data prevista.",
  },
  {
    icon: "eye",
    title: "Transparência ativa",
    text: "Área exclusiva do servidor com seus dados, enquanto o gestor mantém a curadoria e a auditoria da base.",
  },
];

export function Diagnosis() {
  return (
    <Section id="visao">
      <SectionHeading
        eyebrow="O diagnóstico"
        eyebrowIcon="search"
        title={
          <>
            O problema não é falta de informação.
            <span className="text-gradient"> É informação sem um lugar certo.</span>
          </>
        }
        description="Órgãos públicos lidam com milhares de vidas funcionais e dezenas de regras de vantagens. Sem uma plataforma central, cada ato administrativo vira um risco jurídico e cada vantagem conquistada vira uma negociação manual."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {PROBLEMS.map((problem, index) => (
          <Reveal key={problem.title} delay={index * 90} as="article">
            <div className="glass-soft card-hover h-full rounded-3xl p-7">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-400/25 bg-brand-500/12 text-brand-200">
                  <Icon name={problem.icon} className="h-5.5 w-5.5" />
                </span>
                <span className="rounded-full border border-white/12 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-brand-50/55">
                  {problem.tag}
                </span>
              </div>
              <h3 className="mt-6 font-display text-[19px] font-bold leading-snug text-white">
                {problem.title}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-brand-50/68">{problem.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120} className="mt-16">
        <div className="glass relative overflow-hidden rounded-[32px] p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-12 h-56 w-56 rounded-full bg-gold-400/15 blur-3xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-gold-400">
                A proposta
              </p>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-[1.75rem]">
                Uma plataforma, três compromissos
              </h3>
            </div>
            <a
              href="#ambientes"
              className="group inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/5 px-5 py-3 text-[13.5px] font-semibold text-white transition hover:border-brand-400/60 hover:bg-white/10"
            >
              Ver os dois ambientes
              <Icon
                name="arrow-right"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </a>
          </div>

          <div className="relative mt-9 grid gap-6 sm:grid-cols-3">
            {PILLARS.map((pillar, index) => (
              <div key={pillar.title} className="rounded-2xl border border-white/10 bg-ink-950/45 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400/25 to-gold-400/20 text-white">
                    <Icon name={pillar.icon} className="h-4.5 w-4.5" />
                  </span>
                  <span className="font-display text-[13px] font-bold text-brand-200">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-4 font-display text-[15.5px] font-bold text-white">
                  {pillar.title}
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-brand-50/68">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
