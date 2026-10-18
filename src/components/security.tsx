import { Icon, type IconName } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";

const CONTROLS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "key",
    title: "Perfis e alçadas granulares",
    text: "Servidor, chefia imediata, RH, contador e auditor com permissões por campo e por unidade, sem acesso amplo por padrão.",
  },
  {
    icon: "shield",
    title: "Trilha de auditoria imutável",
    text: "Todo cadastro, alteração e exclusão gera log com autor, data, IP e justificativa legal. Nada desaparece silenciosamente.",
  },
  {
    icon: "fingerprint",
    title: "Autenticação forte",
    text: "Login único gov.br, autenticação em dois fatores, expiração de sessão e bloqueio por tentativas inválidas.",
  },
  {
    icon: "database",
    title: "Dados criptografados",
    text: "Criptografia em trânsito e em repouso, dados sensíveis tokenizados e rotinas de backup com teste de restauração.",
  },
  {
    icon: "scale",
    title: "Conformidade legal",
    text: "Desenhado para LGPD, Lei de Acesso à Informação, e-Social e regimes próprios de previdência (RPPS).",
  },
  {
    icon: "eye",
    title: "Transparência responsável",
    text: "Publicação de dados abertos conforme a LAI, mantendo dados pessoais e de saúde protegidos conforme a LGPD.",
  },
];

const BADGES = [
  { label: "LGPD", detail: "Lei 13.709/2018" },
  { label: "LAI", detail: "Lei 12.527/2011" },
  { label: "ICP-Brasil", detail: "assinatura válida" },
  { label: "e-Social", detail: "eventos de RH" },
  { label: "TCE / TCM", detail: "exportação auditável" },
];

export function Security() {
  return (
    <Section id="seguranca">
      <div className="glass relative overflow-hidden rounded-[36px] p-6 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-jade-100 blur-3xl" />
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionHeading
              eyebrow="Segurança e conformidade"
              eyebrowIcon="lock"
              title={
                <>
                  Dados funcionais exigem o padrão de cuidado
                  <span className="text-gradient"> de quem trata informação pública</span>
                </>
              }
              description="A plataforma foi desenhada com o princípio da minimização de dados, segregação de funções e auditabilidade total — porque cada informação aqui impacta remuneração, aposentadoria e a vida de uma pessoa."
            />

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {CONTROLS.slice(0, 4).map((control) => (
                <div
                  key={control.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-jade-400/40"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-jade-200 text-jade-400">
                    <Icon name={control.icon} className="h-4.5 w-4.5" />
                  </span>
                  <p className="mt-4 font-display text-[14.5px] font-bold text-ink-950">
                    {control.title}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                    {control.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/5 px-3.5 py-2 text-[12px] text-slate-700"
                >
                  <Icon name="badge-check" className="h-3.5 w-3.5 text-jade-400" />
                  <strong className="font-semibold text-ink-950">{badge.label}</strong>
                  <span className="text-slate-600">{badge.detail}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <Reveal delay={80}>
              <div className="relative overflow-hidden rounded-3xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/8124246/pexels-photo-8124246.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=760&w=1000"
                  alt="Equipe de servidores analisando documentos funcionais com a cidade ao fundo"
                  loading="lazy"
                  className="h-64 w-full object-cover sm:h-72"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                  <div className="glass-soft rounded-2xl px-4 py-3">
                    <p className="font-display text-lg font-extrabold text-ink-950">100%</p>
                    <p className="text-[11px] text-slate-700">das alterações auditadas</p>
                  </div>
                  <div className="glass-soft rounded-2xl px-4 py-3">
                    <p className="font-display text-lg font-extrabold text-jade-400">Sigilo</p>
                    <p className="text-[11px] text-slate-700">dados de saúde protegidos</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {CONTROLS.slice(4).map((control) => (
              <Reveal key={control.title} delay={140}>
                <div className="glass-soft flex gap-4 rounded-2xl p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
                    <Icon name={control.icon} className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="font-display text-[14.5px] font-bold text-ink-950">
                      {control.title}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">
                      {control.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
