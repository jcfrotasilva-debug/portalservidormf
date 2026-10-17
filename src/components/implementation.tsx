import { Icon, type IconName } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";

const STEPS: { step: string; title: string; text: string; icon: IconName; time: string }[] = [
  {
    step: "01",
    title: "Diagnóstico e desenho das regras",
    text: "Mapeamos o estatuto, os decretos e as leis específicas do órgão: quinquênios, licenças, progressões, adicional de titulação e vedações de acumulação.",
    icon: "search",
    time: "1 a 2 semanas",
  },
  {
    step: "02",
    title: "Carga e saneamento da base",
    text: "Importamos o cadastro existente, tratamos duplicidades, vinculamos documentos digitalizados e conciliamos os dados com a folha de pagamento.",
    icon: "database",
    time: "2 a 3 semanas",
  },
  {
    step: "03",
    title: "Configuração e validação assistida",
    text: "Ajustamos perfis, alçadas de aprovação e o motor de vantagens. Um lote de vidas funcionais é processado em paralelo para conferência do RH e da contabilidade.",
    icon: "scale",
    time: "1 semana",
  },
  {
    step: "04",
    title: "Go-live com treinamento e suporte",
    text: "Treinamento do RH e das chefias, liberação da área exclusiva para os servidores e acompanhamento assistido no primeiro ciclo de folha.",
    icon: "sparkles",
    time: "contínuo",
  },
];

const VOICES: { quote: string; author: string; role: string }[] = [
  {
    quote:
      "Antes a gente caçava o tempo de serviço em três sistemas e duas planilhas. Agora abre o dossiê e o adicional já está calculado com a data do próximo quinquênio.",
    author: "Coordenação de Gestão de Pessoas",
    role: "Autarquia municipal · 1.240 servidores",
  },
  {
    quote:
      "O ganho maior foi de confiança. O servidor acessa o próprio histórico, entende o que já conquistou e para de abrir protocolo só para conferir informação.",
    author: "Secretaria de Administração",
    role: "Região metropolitana · 3,5 mil vínculos",
  },
];

export function Implementation() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Como a implantação acontece"
        eyebrowIcon="refresh"
        title={
          <>
            Um caminho claro, com a base sob controle
            <span className="text-gradient"> em menos de dois meses</span>
          </>
        }
        description="Nada é lançado às cegas: a plataforma entra em produção por etapas, com validação paralela do cadastro e treinamento das equipes antes do primeiro processamento oficial."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal key={step.step} delay={index * 80} as="article">
            <div className="glass-soft card-hover relative h-full rounded-3xl p-6">
              <span className="absolute right-5 top-5 font-display text-[13px] font-bold text-brand-50/30">
                {step.step}
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/25 to-gold-400/18 text-white ring-1 ring-inset ring-white/12">
                <Icon name={step.icon} className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 font-display text-[16px] font-bold leading-snug text-white">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-brand-50/68">{step.text}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1 text-[11px] text-brand-200">
                <Icon name="clock" className="h-3.5 w-3.5" />
                {step.time}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {VOICES.map((voice, index) => (
          <Reveal key={voice.author} delay={index * 100}>
            <figure className="glass relative h-full overflow-hidden rounded-3xl p-7">
              <Icon name="quote" className="h-8 w-8 text-gold-400/50" />
              <blockquote className="mt-4 font-display text-[17px] font-semibold leading-relaxed text-white/92">
                “{voice.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500/35 to-gold-400/25 text-[12px] font-bold text-white">
                  {voice.author
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")}
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold text-white">
                    {voice.author}
                  </span>
                  <span className="block text-[12px] text-brand-50/58">{voice.role}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
