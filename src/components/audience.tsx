"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Section, SectionHeading } from "@/components/section";

type TabId = "servidor" | "gestor";

const TABS: {
  id: TabId;
  label: string;
  badge: string;
  icon: IconName;
  title: string;
  description: string;
  items: { label: string; text: string }[];
}[] = [
  {
    id: "servidor",
    label: "Área exclusiva do servidor",
    badge: "Autoatendimento",
    icon: "fingerprint",
    title: "“Meus dados, minhas vantagens, meu histórico — na palma da mão.”",
    description:
      "Um portal pessoal e intuitivo onde o servidor acompanha a vida funcional sem depender de ofícios, e-mails ou pedidos de informação. Ele consulta, solicita e comprova — tudo com rastreabilidade.",
    items: [
      {
        label: "Painel pessoal em tempo real",
        text: "Tempo de serviço, vencimentos, adicionais, férias e afastamentos atualizados na hora.",
      },
      {
        label: "Extrato de vantagens adquiridas",
        text: "O que já foi conquistado, o valor incorporado e a data prevista do próximo direito.",
      },
      {
        label: "Solicitações 100% digitais",
        text: "Férias, licença-prêmio, certidões, declarações, averbação e atualização cadastral.",
      },
      {
        label: "Documentos e assinatura",
        text: "Dossiê digitalizado com download em PDF, certidões com código de autenticação.",
      },
      {
        label: "Alertas inteligentes",
        text: "Avisos de aniversário de quinquênio, fim de estágio probatório e prazos de licença.",
      },
      {
        label: "Privacidade por padrão",
        text: "Cada servidor vê apenas a própria ficha; acessos sensíveis são registrados em log.",
      },
    ],
  },
  {
    id: "gestor",
    label: "Painel do gestor",
    badge: "Curadoria e comando",
    icon: "building",
    title: "“Alimentar, validar e decidir com a base inteira sob controle.”",
    description:
      "O gestor de pessoas cadastra, corrige, aprova e monitora. Regras estatutárias configuráveis, importação em massa e indicadores para tomada de decisão — com auditoria completa de cada alteração.",
    items: [
      {
        label: "Cadastro guiado e validado",
        text: "Máscaras e checagens de CPF, PIS/PASEP, datas, enquadramento e lotação obrigatória.",
      },
      {
        label: "Importação e conciliação",
        text: "Carga em massa por planilha, conciliação com a folha e detecção de divergências.",
      },
      {
        label: "Motor de regras do órgão",
        text: "Percentuais de quinquênio, licença-prêmio, progressões, sexta-parte e abono.",
      },
      {
        label: "Fluxo de aprovação com alçadas",
        text: "Pareceres, anexos obrigatórios e assinatura do gestor competente em cada ato.",
      },
      {
        label: "Relatórios e obrigações legais",
        text: "Indicadores de RH, massa salarial e exportação para TCE, TCM e Transparência.",
      },
      {
        label: "Auditoria e conformidade",
        text: "Trilha de quem alterou, o quê, quando e por qual justificativa legal.",
      },
    ],
  },
];

export function Audience() {
  const [active, setActive] = useState<TabId>("servidor");
  const current = TABS.find((tab) => tab.id === active) ?? TABS[0];

  return (
    <Section id="ambientes">
      <SectionHeading
        eyebrow="Dois ambientes, um só sistema"
        eyebrowIcon="users"
        title={
          <>
            A mesma base de dados, duas experiências
            <span className="text-gradient"> feitas para quem usa</span>
          </>
        }
        description="O servidor ganha autonomia e transparência. O gestor ganha controle, produtividade e segurança jurídica. Nada é redigitado e todas as informações passam pelo mesmo motor de regras."
      />

      <div
        role="tablist"
        aria-label="Ambientes da plataforma"
        className="mt-12 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2"
      >
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-[14px] font-semibold transition ${
                selected
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-[0_18px_40px_-22px_rgba(22,101,144,0.5)]"
                  : "text-slate-700 hover:bg-white hover:text-ink-950"
              }`}
            >
              <Icon name={tab.icon} className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-start">
        <div key={current.id} className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-600/30 bg-gold-100 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-gold-400">
            {current.badge}
          </span>
          <h3 className="mt-5 font-display text-2xl font-extrabold leading-snug text-white sm:text-[1.75rem]">
            {current.title}
          </h3>
          <p className="mt-4 text-[15.5px] leading-relaxed text-slate-700">
            {current.description}
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {current.items.map((item) => (
              <li
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-4.5 transition hover:border-brand-500/35 hover:bg-brand-50"
              >
                <p className="flex items-center gap-2 font-display text-[14px] font-bold text-white">
                  <Icon name="check" className="h-4 w-4 text-jade-400" strokeWidth={2.2} />
                  {item.label}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-700">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div key={`${current.id}-panel`} className="animate-rise lg:sticky lg:top-24">
          {active === "servidor" ? <ServantPanel /> : <ManagerPanel />}
        </div>
      </div>
    </Section>
  );
}

function PanelFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="glass rounded-[28px] p-5 shadow-[0_50px_120px_-60px_rgba(3,8,20,1)]">
      <div className="flex items-center gap-2.5">
        <span className="flex gap-1.5">
          {["bg-brand-400/70", "bg-gold-400/70", "bg-jade-400/70"].map((color) => (
            <span key={color} className={`h-2.5 w-2.5 rounded-full ${color}`} />
          ))}
        </span>
        <p className="text-[11.5px] text-slate-600">app.servidor360.gov</p>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4.5">
        <p className="font-display text-[15px] font-bold text-white">{title}</p>
        <p className="mt-1 text-[12px] text-slate-600">{subtitle}</p>
        <div className="mt-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function ServantPanel() {
  return (
    <PanelFrame title="Olá, Mariana 👋" subtitle="Sua vida funcional em 12 de maio de 2026">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Tempo de serviço", value: "12 a 4 m", tone: "text-brand-600" },
          { label: "Próximo quinquênio", value: "8 meses", tone: "text-gold-600" },
          { label: "Saldo de férias", value: "30 dias", tone: "text-jade-400" },
          { label: "Licença-prêmio", value: "6 meses", tone: "text-brand-600" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white/5 p-3">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-slate-600">
              {item.label}
            </p>
            <p className={`mt-1 font-display text-[17px] font-extrabold ${item.tone}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {[
        { icon: "calendar" as IconName, text: "Férias 2026/1 aprovadas · 04 a 18 de julho" },
        { icon: "file" as IconName, text: "Certidão de tempo de serviço pronta para download" },
        { icon: "bell" as IconName, text: "Alerta: progressão por titulação abre em 60 dias" },
      ].map((row) => (
        <div
          key={row.text}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-brand-50 px-3.5 py-3"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-brand-600">
            <Icon name={row.icon} className="h-4 w-4" />
          </span>
          <p className="text-[12.5px] text-white">{row.text}</p>
        </div>
      ))}
    </PanelFrame>
  );
}

function ManagerPanel() {
  return (
    <PanelFrame title="Painel do gestor · RH" subtitle="Secretaria Municipal de Administração">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Servidores ativos", value: "3.482" },
          { label: "Pendências de cadastro", value: "27" },
          { label: "Vantagens a vencer", value: "112" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white/5 p-3">
            <p className="font-display text-[18px] font-extrabold text-white">{item.value}</p>
            <p className="mt-1 text-[10.5px] leading-tight text-slate-600">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-brand-50 p-3.5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600">
          Fila de validação
        </p>
        <div className="mt-3 space-y-2.5">
          {[
            { name: "João P. Ferreira", act: "Quinquênio · 5 anos", tag: "Aprovar", tone: "gold" },
            { name: "Célia M. Rocha", act: "Averbação de tempo", tag: "Parecer", tone: "brand" },
            { name: "Rafael T. Lima", act: "Progressão por titulação", tag: "Aprovar", tone: "jade" },
          ].map((row) => (
            <div key={row.name} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold text-white">{row.name}</p>
                <p className="truncate text-[11px] text-slate-600">{row.act}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                  row.tone === "gold"
                    ? "bg-gold-100 text-gold-400"
                    : row.tone === "jade"
                      ? "bg-jade-200 text-jade-400"
                      : "bg-brand-100 text-brand-600"
                }`}
              >
                {row.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-brand-50 px-3.5 py-3">
        <Icon name="shield" className="h-4 w-4 text-jade-400" />
        <p className="text-[12px] text-slate-700">
          Trilha de auditoria ativa · última alteração registrada há 12 minutos
        </p>
      </div>
    </PanelFrame>
  );
}
