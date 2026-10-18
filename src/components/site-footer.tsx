import { Icon } from "@/components/icons";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Plataforma",
    links: [
      { label: "Visão geral", href: "#visao" },
      { label: "Pré-cadastro em Excel", href: "/gestor/importar" },
      { label: "Diagnóstico de produção", href: "/producao" },
      { label: "Vantagens por tempo", href: "#vantagens" },
      { label: "Módulos", href: "#modulos" },
    ],
  },
  {
    title: "Para o servidor",
    links: [
      { label: "Entrar na minha área", href: "/servidor" },
      { label: "Meus quinquênios (ATS)", href: "/servidor" },
      { label: "Dois ambientes", href: "#ambientes" },
      { label: "Perguntas frequentes", href: "#faq" },
    ],
  },
  {
    title: "Para o gestor",
    links: [
      { label: "Painel de gestão", href: "/gestor" },
      { label: "Importar planilha XLSX", href: "/gestor/importar" },
      { label: "Lançar ATS (quinquênio)", href: "/gestor" },
      { label: "Segurança e auditoria", href: "#seguranca" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-8 border-t border-slate-200 bg-white/90">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-ink-700">
                <Icon name="layers" className="h-5 w-5 text-white" />
              </span>
              <span className="font-display text-[17px] font-extrabold text-white">
                SERVIDOR<span className="text-gold-600">360</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-slate-700">
              Plataforma de gestão do cadastro funcional de servidores públicos e das vantagens
              pessoais adquiridas ao longo da carreira. Servidor acessa sua área exclusiva; o gestor
              alimenta, valida e audita cada informação. Dados protegidos segundo a LGPD.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["LGPD", "LAI", "ICP-Brasil"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="font-display text-[12px] font-bold uppercase tracking-[0.18em] text-brand-600">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13.5px] text-slate-700 transition hover:text-ink-950"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline mt-12 flex flex-col gap-4 pt-6 text-[12px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} SERVIDOR 360 · EE Profa. Marlene Frattini · Gestão de
            pessoas e vantagens funcionais.
          </p>
          <p className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-jade-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-pulse-ring rounded-full bg-jade-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-400" />
              </span>
              Ambiente de produção
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="lock" className="h-3.5 w-3.5" /> Dados reais · LGPD · v1.1
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
