import Image from "next/image";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";

const TRUST = [
  "Login único gov.br",
  "Trilha de auditoria por evento",
  "Criptografia em repouso e trânsito",
  "Exportação para TCE / TCM",
  "Conformidade LGPD",
  "Assinatura digital ICP-Brasil",
];

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/images/hero-light.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f4f8fb]/45 via-[#f4f8fb]/30 to-[#f4f7fa]" />
        <div className="grid-overlay absolute inset-0" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-600">
              <Icon name="sparkles" className="h-3.5 w-3.5 text-gold-600" />
EE Profa. Marlene Frattini
            </span>
          </Reveal>

          <Reveal delay={80}>
            <p className="mt-6 font-display text-[15px] font-bold uppercase tracking-[0.16em] text-brand-700">
              EE Profa. Marlene Frattini
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-ink-950 sm:text-5xl lg:text-[3.6rem]">
              Todo o cadastro funcional dos servidores
              <span className="text-gradient"> e cada vantagem conquistada</span> em um só lugar.
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-950">
              O <strong className="font-semibold text-ink-950">SERVIDOR 360</strong> reúne o dossiê
              completo do servidor, a vida funcional e a evolução automática das vantagens pessoais
              adquiridas ao longo da carreira — com área exclusiva para o servidor consultar seus
              dados e um painel para o gestor alimentar e auditar cada informação.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#contato"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_24px_60px_-26px_rgba(22,101,144,0.5)] transition hover:from-brand-400 hover:to-brand-500"
              >
                Solicitar implantação na minha unidade
                <Icon
                  name="arrow-right"
                  className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1"
                />
              </a>
              <a
                href="#vantagens"
                className="inline-flex items-center gap-2.5 rounded-full border border-brand-300 bg-white px-6 py-3.5 text-[15px] font-semibold text-brand-800 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-900"
              >
                <Icon name="clock" className="h-4.5 w-4.5 text-gold-600" />
                Simular vantagens por tempo de serviço
              </a>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <dl className="mt-11 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[
                { k: "1 dossiê", v: "funcional por servidor" },
                { k: "Automático", v: "cálculo de quinquênios" },
                { k: "24/7", v: "portal de autoatendimento" },
                { k: "100%", v: "auditável e rastreável" },
              ].map((item) => (
                <div key={item.k}>
                  <dt className="font-display text-xl font-extrabold text-ink-950">{item.k}</dt>
                  <dd className="mt-1 text-[12.5px] leading-snug text-slate-700">{item.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={160} className="relative">
          <div className="relative mx-auto w-full max-w-md lg:ml-auto">
            <div className="absolute -inset-6 -z-10 rounded-[42px] bg-gradient-to-br from-brand-300/40 via-transparent to-gold-400/30 blur-2xl" />

            <div className="glass animate-float-slow rounded-[30px] p-5 shadow-[0_34px_70px_-42px_rgba(16,79,115,0.4)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 font-display text-base font-bold text-white">
                    MS
                  </span>
                  <div>
                    <p className="font-display text-[15px] font-bold text-ink-950">
                      Mariana A. de Souza
                    </p>
                    <p className="text-[12px] text-ink-850">
                      PEB II · DI 1 · Efetivo
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-jade-300 bg-jade-100 px-2.5 py-1 text-[11px] font-semibold text-jade-500">
                  Ativo
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-brand-600">
                      Tempo de serviço
                    </p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-ink-950">
                      12 anos e 4 meses
                    </p>
                  </div>
                  <p className="text-right text-[12px] text-ink-850">
                    2º quinquênio
                    <span className="block font-semibold text-gold-600">+10% de adicional</span>
                  </p>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-brand-50">
                  <div
                    className="h-full w-[68%] rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-gold-400"
                    role="presentation"
                  />
                </div>
                <p className="mt-2 flex items-center justify-between text-[11.5px] text-ink-850">
                  <span>Próximo marco: 3º quinquênio</span>
                  <span className="font-semibold text-brand-600">8 meses restantes</span>
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Vencimento base", value: "R$ 8.240", icon: "coins" as const },
                  { label: "Adicional por tempo", value: "R$ 824", icon: "clock" as const },
                  { label: "Gratificação", value: "R$ 1.180", icon: "award" as const },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-brand-400"
                  >
                    <Icon name={item.icon} className="h-4 w-4 text-brand-600" />
                    <p className="mt-2 font-display text-[13.5px] font-bold text-ink-950">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-[10.5px] leading-tight text-ink-800">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Licença-prêmio: 6 meses", "Férias: 30 dias + 1/3", "Progressão por titulação"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] text-brand-800"
                    >
                      {chip}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="glass-soft animate-float-fast absolute -left-4 bottom-10 hidden w-60 rounded-2xl p-3.5 shadow-2xl sm:block lg:-left-14">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-jade-200 text-jade-500">
                  <Icon name="badge-check" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-ink-950">
                    Nova vantagem habilitada
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-800">
                    3º quinquênio reconhecido automaticamente e notificado ao servidor.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-soft animate-float-slow absolute -right-3 -top-6 hidden w-52 rounded-2xl p-3.5 shadow-2xl sm:block lg:-right-10">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-brand-600">
                <Icon name="shield" className="h-3.5 w-3.5 text-brand-600" /> Auditoria
              </p>
              <p className="mt-1.5 font-display text-lg font-extrabold text-ink-950">214 eventos</p>
              <p className="text-[11px] text-ink-850">registrados nos últimos 7 dias</p>
              <div className="mt-2.5 flex h-8 items-end gap-1">
                {[38, 52, 34, 66, 48, 78, 60, 88, 72].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-full rounded-sm bg-gradient-to-t from-brand-500/60 to-brand-300"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="relative overflow-hidden border-y border-slate-200 bg-white py-4">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
          {[...TRUST, ...TRUST].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="flex items-center gap-2.5 text-[12.5px] uppercase tracking-[0.2em] text-slate-600"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400/70" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
