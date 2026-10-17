"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Section, SectionHeading } from "@/components/section";

const ITEMS = [
  {
    q: "A plataforma substitui o sistema de folha de pagamento?",
    a: "Não. Ela é a fonte oficial do cadastro funcional e do cálculo das vantagens, e conversa com a folha por integração ou exportação de arquivos. O objetivo é que a folha receba o dado pronto, já validado e auditado, sem redigitação.",
  },
  {
    q: "Como as vantagens são calculadas?",
    a: "Existe um motor de regras configurável: percentual de adicional por tempo de serviço, periodicidade dos quinquênios, licença-prêmio, progressões por titulação e mérito, sexta-parte, abono de permanência e vedações de acumulação. Cada órgão cadastra a própria norma, com vigência histórica, e o sistema recalcula o legado.",
  },
  {
    q: "O servidor precisa de treinamento para usar a área exclusiva?",
    a: "Não. A área do servidor foi desenhada para uso imediato: painel único, linguagem simples e nenhuma etapa obrigatória de configuração. O acesso é feito por login único gov.br ou por CPF e matrícula, com autenticação em dois fatores.",
  },
  {
    q: "O que acontece com os dados que hoje estão em papel e em planilhas?",
    a: "A implantação inclui carga assistida do cadastro existente, saneamento de duplicidades, vinculação de documentos digitalizados e conciliação com a folha. Um lote piloto é processado em paralelo para conferência antes do go-live.",
  },
  {
    q: "Quem consegue ver os dados de um servidor?",
    a: "O próprio servidor vê integralmente a sua ficha. Os demais acessos são limitados por perfil, por campo e por unidade: chefia imediata, RH, contabilidade e auditoria têm visões distintas, e todo acesso sensível é registrado em log com finalidade declarada, conforme a LGPD.",
  },
  {
    q: "Serve para câmaras, autarquias, fundações e institutos?",
    a: "Sim. A plataforma é multi-órgão e multi-regime: suporta estatutários, comissionados, celetistas, temporários, aposentados e pensionistas, com regras próprias por entidade e consolidação de indicadores na visão central.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <SectionHeading
          eyebrow="Perguntas frequentes"
          eyebrowIcon="search"
          title={
            <>
              Dúvidas de quem vive
              <span className="text-gradient"> o dia a dia do RH público</span>
            </>
          }
          description="Se a sua pergunta não estiver aqui, fale com a nossa equipe de implantação — respondemos com foco na realidade do seu órgão."
          className="lg:sticky lg:top-24"
        />

        <div className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-ink-950/45">
          {ITEMS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-5 px-5 py-5 text-left transition hover:bg-white/4 sm:px-6"
                >
                  <span
                    className={`font-display text-[15.5px] font-bold leading-snug transition ${
                      isOpen ? "text-white" : "text-brand-50/85"
                    }`}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${
                      isOpen
                        ? "rotate-180 border-brand-400/60 bg-brand-500/18 text-white"
                        : "border-white/15 text-brand-50/70"
                    }`}
                  >
                    <Icon name="chevron-down" className="h-3.5 w-3.5" />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-6 text-[14px] leading-relaxed text-brand-50/70 sm:px-6">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
