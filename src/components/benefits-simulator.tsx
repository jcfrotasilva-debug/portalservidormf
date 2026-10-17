"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { computeBenefits, formatBRL, MAX_YEARS, MILESTONES } from "@/lib/benefits";

const PRESETS = [
  { label: "Recém-empossado", years: 1 },
  { label: "Estágio concluído", years: 4 },
  { label: "Meio da carreira", years: 15 },
  { label: "Reto final", years: 27 },
];

const TAG_STYLE: Record<string, string> = {
  financeiro: "bg-gold-400/15 text-gold-300 border-gold-400/25",
  licenca: "bg-brand-500/18 text-brand-200 border-brand-400/25",
  carreira: "bg-jade-400/15 text-jade-400 border-jade-400/25",
  tempo: "bg-white/8 text-brand-50/75 border-white/14",
};

const TAG_LABEL: Record<string, string> = {
  financeiro: "Financeiro",
  licenca: "Licença",
  carreira: "Carreira",
  tempo: "Tempo",
};

export function BenefitsSimulator() {
  const [years, setYears] = useState(12);
  const [basePay, setBasePay] = useState(8240);

  const result = useMemo(() => computeBenefits(years, basePay), [years, basePay]);
  const progress = (years / MAX_YEARS) * 100;

  return (
    <Section id="vantagens" className="scroll-mt-20">
      <SectionHeading
        eyebrow="Vantagens adquiridas ao longo do tempo"
        eyebrowIcon="award"
        title={
          <>
            Veja, em segundos, o que a carreira do servidor
            <span className="text-gradient"> já garantiu e o que vem a seguir</span>
          </>
        }
        description="A plataforma conta o tempo de serviço de cada vínculo e aplica automaticamente as regras do estatuto: adicionais por tempo de serviço, licença-prêmio, progressões, sexta-parte e abono de permanência. Arraste o tempo de serviço abaixo e veja o motor de regras em ação."
      />

      <Reveal delay={100} className="mt-12">
        <div className="glass relative overflow-hidden rounded-[32px] p-6 sm:p-9">
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-500/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-gold-400/14 blur-3xl" />

          <div className="relative grid gap-9 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setYears(preset.years)}
                    className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
                      years === preset.years
                        ? "border-brand-400/60 bg-brand-500/18 text-white"
                        : "border-white/12 text-brand-50/65 hover:border-brand-400/40 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <label
                htmlFor="anos"
                className="mt-8 block text-[12px] font-semibold uppercase tracking-[0.2em] text-brand-200/80"
              >
                Tempo de serviço
              </label>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold text-white">{years}</span>
                <span className="text-lg text-brand-50/65">{years === 1 ? "ano" : "anos"}</span>
                <span className="ml-auto rounded-full border border-white/12 bg-ink-950/60 px-3 py-1 text-[12px] text-brand-50/72">
                  {result.quinquenios} quinquênio{result.quinquenios === 1 ? "" : "s"} completo
                  {result.quinquenios === 1 ? "" : "s"}
                </span>
              </div>

              <input
                id="anos"
                type="range"
                className="slider mt-5 w-full"
                min={0}
                max={MAX_YEARS}
                step={1}
                value={years}
                onChange={(event) => setYears(Number(event.target.value))}
                style={{
                  background: `linear-gradient(90deg, #5aa8ff 0%, #f5c451 ${progress}%, rgba(255,255,255,0.14) ${progress}%, rgba(255,255,255,0.14) 100%)`,
                }}
              />
              <div className="mt-2 flex justify-between text-[11px] text-brand-50/45">
                <span>0</span>
                <span>{MAX_YEARS} anos</span>
              </div>

              <label
                htmlFor="vencimento"
                className="mt-7 block text-[12px] font-semibold uppercase tracking-[0.2em] text-brand-200/80"
              >
                Vencimento base (R$)
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="vencimento"
                  type="number"
                  min={1000}
                  max={40000}
                  step={100}
                  value={basePay}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setBasePay(Number.isFinite(value) ? Math.max(0, value) : 0);
                  }}
                  className="w-40 rounded-xl border border-white/14 bg-ink-950/70 px-4 py-3 font-display text-[15px] font-bold text-white outline-none transition focus:border-brand-400/70"
                />
                <div className="flex flex-wrap gap-2">
                  {[4200, 8240, 12500].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBasePay(value)}
                      className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11.5px] text-brand-50/68 transition hover:border-brand-400/45 hover:text-white"
                    >
                      {formatBRL(value)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Adicional por tempo de serviço",
                    value: `+${result.adicionais}%`,
                    helper: formatBRL(result.impacto),
                    tone: "text-gold-400",
                  },
                  {
                    label: "Licença-prêmio acumulada",
                    value: `${result.licencaPremioMeses} meses`,
                    helper: `${result.quinquenios * 3} meses em 3 por quinquênio`,
                    tone: "text-brand-200",
                  },
                  {
                    label: "Férias já desfrutadas",
                    value: `${result.feriasDias} dias`,
                    helper: "30 dias por ano + 1/3",
                    tone: "text-jade-400",
                  },
                  {
                    label: "Sexta-parte",
                    value: result.sextaParte ? "+25%" : "não elegível",
                    helper: result.sextaParte ? "carreiras elegíveis" : "requer 20 anos",
                    tone: result.sextaParte ? "text-gold-400" : "text-brand-50/50",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-white/10 bg-ink-950/55 p-4 transition hover:border-brand-400/35"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-brand-50/55">
                      {card.label}
                    </p>
                    <p className={`mt-1.5 font-display text-xl font-extrabold ${card.tone}`}>
                      {card.value}
                    </p>
                    <p className="mt-1 text-[11.5px] text-brand-50/55">{card.helper}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-brand-400/25 bg-gradient-to-r from-brand-500/18 to-transparent p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11.5px] uppercase tracking-[0.18em] text-brand-200/80">
                      Remuneração estimada com vantagens
                    </p>
                    <p className="mt-1.5 font-display text-3xl font-extrabold text-white">
                      {formatBRL(result.total)}
                    </p>
                  </div>
                  <p className="text-right text-[12px] text-brand-50/62">
                    base {formatBRL(result.basePay)}
                    <span className="block font-semibold text-jade-400">
                      + {formatBRL(result.impacto)} de adicional
                    </span>
                  </p>
                </div>

                {result.nextMilestone ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[12px] text-brand-50/70">
                      <span>
                        Próximo marco: {result.nextMilestone.title} (
                        {result.nextMilestone.years} anos)
                      </span>
                      <span className="font-semibold text-gold-400">
                        faltam {result.nextMilestone.years - years}{" "}
                        {result.nextMilestone.years - years === 1 ? "ano" : "anos"}
                      </span>
                    </div>
                    <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/12">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-gold-400 transition-all duration-500"
                        style={{ width: `${result.progressToNext}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[12.5px] text-brand-200">
                      Vantagem prevista: {result.nextMilestone.benefit}
                    </p>
                  </div>
                ) : (
                  <p className="mt-5 text-[12.5px] font-semibold text-jade-400">
                    Teto legal de adicional por tempo de serviço atingido para este vínculo.
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="font-display text-[15.5px] font-bold text-white">
                  Linha do tempo da carreira
                </p>
                <span className="rounded-full border border-white/12 px-3 py-1 text-[11.5px] text-brand-50/62">
                  {result.unlocked.length}/{MILESTONES.length} marcos alcançados
                </span>
              </div>

              <ol className="no-scrollbar mt-5 max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {MILESTONES.map((milestone) => {
                  const reached = milestone.years <= years;
                  return (
                    <li key={milestone.years}>
                      <div
                        className={`flex gap-4 rounded-2xl border p-4 transition ${
                          reached
                            ? "border-white/14 bg-white/6"
                            : "border-white/8 bg-ink-950/45 opacity-55"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                              reached
                                ? "bg-gradient-to-br from-brand-400/30 to-gold-400/22 text-white"
                                : "bg-white/6 text-brand-50/45"
                            }`}
                          >
                            <Icon name={milestone.icon} className="h-4.5 w-4.5" />
                          </span>
                          <span className="mt-2 text-[11px] font-semibold text-brand-50/50">
                            {milestone.years}a
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-display text-[14.5px] font-bold text-white">
                              {milestone.title}
                            </p>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${TAG_STYLE[milestone.tag]}`}
                            >
                              {TAG_LABEL[milestone.tag]}
                            </span>
                            {reached ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-jade-400/15 px-2 py-0.5 text-[10.5px] font-semibold text-jade-400">
                                <Icon name="check" className="h-3 w-3" strokeWidth={2.4} /> adquirido
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-[12.5px] font-medium text-brand-200">
                            {milestone.benefit}
                          </p>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-brand-50/62">
                            {milestone.detail}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-brand-50/48">
                <Icon name="scale" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Simulação ilustrativa baseada nas regras de quinquênio de 5%, licença-prêmio de 3
                meses a cada 5 anos e sexta-parte aos 20 anos. Na plataforma, cada órgão configura
                os próprios percentuais, prazos e critérios por lei específica.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
