import { Icon, type IconName } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";

const MODULES: {
  icon: IconName;
  title: string;
  text: string;
  chips: string[];
}[] = [
  {
    icon: "file",
    title: "Cadastro funcional completo",
    text: "Dados pessoais, documentos, dependentes, formação, cargo, vínculo, lotação e jornada em uma ficha única e validada.",
    chips: ["CPF e PIS validados", "Histórico de lotação", "Dependentes"],
  },
  {
    icon: "refresh",
    title: "Vida funcional e movimentações",
    text: "Posse, exercício, transferências, remoções, redistribuições, cessões e enquadramentos registrados como eventos datados.",
    chips: ["Timeline funcional", "Eventos datados", "Anexos por evento"],
  },
  {
    icon: "award",
    title: "Vantagens e benefícios",
    text: "Motor de regras que identifica automaticamente os direitos adquiridos, incorpora valores e projeta o próximo marco.",
    chips: ["Quinquênios", "Licença-prêmio", "Sexta-parte"],
  },
  {
    icon: "layers",
    title: "Dossiê digital e assinatura",
    text: "Digitalização de processos, reconhecimento de texto, versionamento e assinatura eletrônica ICP-Brasil.",
    chips: ["OCR e busca", "Versionamento", "ICP-Brasil"],
  },
  {
    icon: "graduation",
    title: "Progressão, promoção e titulação",
    text: "Requisitos de escolaridade, avaliações de desempenho, comissões e prazos interstícios controlados pelo sistema.",
    chips: ["Avaliação", "Interstício", "Comissão"],
  },
  {
    icon: "calendar",
    title: "Férias, licenças e afastamentos",
    text: "Escalas, saldos, substituições, licença para tratamento de saúde, licença-prêmio e capacitação com fluxo próprio.",
    chips: ["Escala de férias", "Saldos", "Substituições"],
  },
  {
    icon: "coins",
    title: "Remuneração e consignações",
    text: "Rubricas, ficha financeira do servidor, simulações de ganho, consignados e espelho de pagamento mensal.",
    chips: ["Ficha financeira", "Simulador", "Consignados"],
  },
  {
    icon: "chart",
    title: "Indicadores e obrigações legais",
    text: "Painéis gerenciais de RH, massa salarial, absenteísmo e exportações para TCE, TCM e Portal da Transparência.",
    chips: ["Dashboards", "TCE / TCM", "Transparência"],
  },
  {
    icon: "shield",
    title: "Auditoria, perfis e segurança",
    text: "Perfis granulares, alçadas de aprovação, segregação de funções, logs imutáveis e rotinas de backup.",
    chips: ["Logs imutáveis", "Alçadas", "Backups"],
  },
];

export function ModulesGrid() {
  return (
    <Section id="modulos">
      <SectionHeading
        eyebrow="Módulos da plataforma"
        eyebrowIcon="layers"
        title={
          <>
            Nove módulos que cobrem a carreira inteira,
            <span className="text-gradient"> do concurso à aposentadoria</span>
          </>
        }
        description="Cada módulo funciona de forma independente, mas compartilha o mesmo cadastro e o mesmo motor de regras. Implante por etapas e ative novos recursos sem retrabalho."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module, index) => (
          <Reveal key={module.title} delay={(index % 3) * 80} as="article">
            <div className="glass-soft card-hover group h-full rounded-3xl p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/22 to-gold-400/16 text-brand-800 ring-1 ring-inset ring-brand-700/12">
                  <Icon name={module.icon} className="h-5.5 w-5.5" />
                </span>
                <span className="font-display text-[12px] font-bold text-slate-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 font-display text-[16.5px] font-bold leading-snug text-ink-950">
                {module.title}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-700">
                {module.text}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {module.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 transition group-hover:border-brand-500/25"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
