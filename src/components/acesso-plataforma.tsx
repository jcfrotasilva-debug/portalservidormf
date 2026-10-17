import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";

const ACESSOS: {
  href: string;
  cta: string;
  titulo: string;
  texto: string;
  icon: IconName;
  itens: string[];
  destaque: string;
}[] = [
  {
    href: "/gestor/importar",
    cta: "Importar planilha",
    titulo: "Pré-cadastro por planilha do Excel",
    texto:
      "Carga das colunas NOME, CPF, RGCIN, DI, DTNASC, TEL, E-MAIL, CLASSE, CARGO, CATEGORIA, JORNADA, LOTACAO e SITUACAO, com pré-visualização antes de gravar.",
    icon: "download",
    itens: [
      "Células vazias tratadas automaticamente e virando pendências do RH",
      "Datas em qualquer formato (serial do Excel, dd/mm/aaaa, ISO)",
      "CPF validado, telefone e e-mail higienizados",
      "Duplicidades apontadas antes da gravação",
      "Linhas de total e rodapé descartadas",
    ],
    destaque: "Modelo XLSX pronto para download",
  },
  {
    href: "/gestor",
    cta: "Abrir painel do gestor",
    titulo: "ATS · adicional por tempo de serviço",
    texto:
      "O gestor seleciona o servidor e inclui todos os quinquênios já obtidos. O sistema calcula a projeção do próximo automaticamente.",
    icon: "clock",
    itens: [
      "Tipo: 1º ao 10º quinquênio, com percentual acumulado",
      "Data de vigência e data do DOE em cada lançamento",
      "Projeção do próximo = vigência + 1825 dias",
      "Geração automática dos quinquênios pela DI do servidor",
      "Correção, exclusão e trilha de auditoria por lançamento",
    ],
    destaque: "Projeção calculada em tempo real no modal",
  },
  {
    href: "/servidor",
    cta: "Entrar na área do servidor",
    titulo: "Área exclusiva do servidor",
    texto:
      "Acesso por CPF e data de nascimento. O servidor vê a própria ficha, o ATS acumulado e quando vence o próximo direito.",
    icon: "fingerprint",
    itens: [
      "Tempo de serviço desde a DI e idade calculada",
      "Quinquênios com vigência, DOE e percentual incorporado",
      "Contagem regressiva até o próximo quinquênio",
      "Dados pendentes apontados para regularização",
      "Extrato pronto para impressão",
    ],
    destaque: "Acesso de demonstração: CPF 529.982.247-25",
  },
];

export function AcessoPlataforma() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Ambiente em funcionamento"
        eyebrowIcon="database"
        title={
          <>
            Já está no ar: importe a planilha,
            <span className="text-gradient"> lance o ATS e abra a área do servidor</span>
          </>
        }
        description="As três frentes do primeiro ciclo da plataforma estão operacionais nesta demonstração: carga do pré-cadastro por Excel, gestão dos quinquênios (ATS) pelo gestor e consulta exclusiva pelo servidor."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {ACESSOS.map((acesso, index) => (
          <Reveal key={acesso.href} delay={index * 90} as="article">
            <div className="glass-soft card-hover flex h-full flex-col rounded-3xl p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/25 to-gold-400/18 text-white ring-1 ring-inset ring-white/12">
                <Icon name={acesso.icon} className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 font-display text-[17px] font-bold leading-snug text-white">
                {acesso.titulo}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-brand-50/70">{acesso.texto}</p>

              <ul className="mt-4 space-y-2">
                {acesso.itens.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[12.5px] leading-relaxed text-brand-50/72">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade-400" strokeWidth={2.4} />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-5 rounded-xl border border-white/10 bg-ink-950/50 px-3.5 py-2.5 text-[11.5px] text-brand-200">
                {acesso.destaque}
              </p>

              <Link
                href={acesso.href}
                className="group mt-5 inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_18px_40px_-22px_rgba(47,134,246,1)] transition hover:from-brand-400"
              >
                {acesso.cta}
                <Icon
                  name="arrow-right"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
