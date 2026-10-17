"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { formatarCpf, formatarDataBR } from "@/lib/ats";

type Status = {
  ambiente: string;
  servidores: number;
  quinquenios: number;
  evolucoes: number;
  importacoes: number;
  certidoes: number;
  fruicoes: number;
  ultimaAtualizacao: string | null;
  credenciais: { nome: string; cpf: string; dtnasc: string; perfil: string }[];
  servidoresLista: {
    id: number;
    nome: string;
    cpf: string | null;
    dtnasc: string | null;
    cargo: string | null;
    lotacao: string | null;
    situacao: string;
    origem: string;
    pendencias: number;
  }[];
  rotas: Record<string, string>;
};

const ROTEIRO: { titulo: string; passos: string[]; href: string; cta: string; icon: IconName }[] = [
  {
    titulo: "1 · Carga do pré-cadastro",
    icon: "download",
    href: "/gestor/importar",
    cta: "Abrir importação",
    passos: [
      "Baixe o modelo XLSX (já vem com linhas incompletas de propósito).",
      "Solte o arquivo na área de upload e confira a pré-visualização.",
      "Veja as células vazias tratadas e as pendências geradas.",
      "Confirme a importação e abra o painel.",
    ],
  },
  {
    titulo: "2 · ATS (quinquênio)",
    icon: "clock",
    href: "/gestor",
    cta: "Abrir painel do gestor",
    passos: [
      "Escolha um servidor e clique em “ATS”.",
      "Selecione o tipo (1º ao 10º) e a data de vigência.",
      "Confirme a projeção automática de vigência + 1825 dias.",
      "Salve e veja o ATS refletido na tabela e na ficha.",
    ],
  },
  {
    titulo: "3 · Evolução funcional",
    icon: "graduation",
    href: "/gestor",
    cta: "Lançar evolução",
    passos: [
      "Clique em “Evolução funcional”.",
      "Alterne entre Tabela 1 (Docentes) e Tabela 2 (Suporte Pedagógico).",
      "Veja interstício, pontuação mínima e pesos ×4/×4/×2 ou ×3/×3/×4.",
      "Informe vigência e DOE; a próxima data é calculada pelo interstício.",
    ],
  },
  {
    titulo: "5 · Licença-prêmio",
    icon: "plane",
    href: "/gestor",
    cta: "Abrir licença-prêmio",
    passos: [
      "Clique em “Licença-prêmio” e selecione o servidor.",
      "Cadastre a certidão: número, ano, período inicial/final e DOE (saldo de 90 dias).",
      "Lance o gozo de 15 a 90 dias com início, fim e autorização em DOE.",
      "Registre a pecúnia de 30 dias (ano + DOE opcional) e confira o saldo debitado.",
    ],
  },
  {
    titulo: "4 · Área exclusiva do servidor",
    icon: "fingerprint",
    href: "/servidor",
    cta: "Entrar como servidor",
    passos: [
      "Use uma das credenciais de teste listadas abaixo.",
      "Consulte dados funcionais, ATS e evolução.",
      "Confira a contagem regressiva até o próximo direito.",
      "Teste também o acesso só por CPF de um cadastro incompleto.",
    ],
  },
];

export function SandboxPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [resetando, setResetando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    const resposta = await fetch("/api/sandbox", { cache: "no-store" });
    const dados = (await resposta.json()) as Status & { erro?: string };
    if (resposta.ok) setStatus(dados);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const resetar = async () => {
    setResetando(true);
    setMensagem(null);
    try {
      const resposta = await fetch("/api/sandbox", { method: "POST" });
      const dados = (await resposta.json()) as {
        ok?: boolean;
        erro?: string;
        servidores?: number;
        quinquenios?: number;
        evolucoes?: number;
        certidoes?: number;
        fruicoes?: number;
      };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao reiniciar.");
      setMensagem({
        tom: "ok",
        texto: `Sandbox reiniciado: ${dados.servidores} servidores, ${dados.quinquenios} quinquênios, ${dados.evolucoes} evoluções e ${dados.certidoes} certidões de licença-prêmio.`,
      });
      await carregar();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setResetando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass relative overflow-hidden rounded-3xl border border-jade-400/30 p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-jade-400/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-jade-400/16 text-jade-400">
              <Icon name="shield" className="h-5.5 w-5.5" />
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-3.5 w-3.5 animate-pulse-ring rounded-full bg-jade-400" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-jade-400 ring-2 ring-ink-950" />
              </span>
            </span>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-jade-400/35 bg-jade-400/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-jade-400">
                Sandbox liberado
              </span>
              <h1 className="mt-2 font-display text-2xl font-extrabold text-white">
                Ambiente de testes aberto
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-brand-50/70">
                Sem login obrigatório, sem aprovação e com dados fictícios. Todas as telas de gestão
                estão acessíveis e podem ser reiniciadas a qualquer momento. Nada aqui contém
                informação real de servidores.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetar}
            disabled={resetando}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-4 py-3 text-[13px] font-semibold text-ink-950 disabled:opacity-55"
          >
            <Icon name="refresh" className="h-4 w-4" />
            {resetando ? "Reiniciando…" : "Recriar base de demonstração"}
          </button>
        </div>

        {mensagem ? (
          <p
            className={`relative mt-4 rounded-xl px-3.5 py-2.5 text-[12.5px] ${
              mensagem.tom === "ok"
                ? "border border-jade-400/30 bg-jade-400/10 text-jade-400"
                : "border border-red-400/35 bg-red-400/10 text-red-200"
            }`}
          >
            {mensagem.texto}
          </p>
        ) : null}

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Servidores", valor: status?.servidores ?? 0 },
            { label: "Quinquênios (ATS)", valor: status?.quinquenios ?? 0 },
            { label: "Evoluções funcionais", valor: status?.evolucoes ?? 0 },
            { label: "Certidões de licença", valor: status?.certidoes ?? 0 },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-ink-950/55 p-4">
              <p className="font-display text-2xl font-extrabold text-white">
                {carregando ? "…" : card.valor}
              </p>
              <p className="mt-0.5 text-[11.5px] text-brand-50/62">{card.label}</p>
            </div>
          ))}
        </div>

        {status?.ultimaAtualizacao ? (
          <p className="relative mt-3 text-[11.5px] text-brand-50/50">
            Última atividade registrada: {new Date(status.ultimaAtualizacao).toLocaleString("pt-BR")} ·{" "}
            {status.ambiente}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass-soft rounded-3xl p-5">
          <p className="font-display text-[15px] font-bold text-white">Credenciais de teste</p>
          <p className="mt-1 text-[12px] text-brand-50/60">
            A área do servidor pede CPF + data de nascimento. Servidores sem data de nascimento entram
            apenas com o CPF.
          </p>
          <ul className="mt-4 space-y-2.5">
            {(status?.credenciais ?? []).map((item) => (
              <li key={item.cpf} className="rounded-xl border border-white/10 bg-white/4 p-3.5">
                <p className="text-[13px] font-semibold text-white">{item.nome}</p>
                <p className="mt-1 text-[12px] text-brand-50/72">
                  CPF <strong className="font-semibold text-white">{item.cpf}</strong> · nascimento{" "}
                  <strong className="font-semibold text-white">{item.dtnasc}</strong>
                </p>
                <p className="mt-0.5 text-[11px] text-jade-400/85">{item.perfil}</p>
              </li>
            ))}
            {carregando ? <li className="text-[12.5px] text-brand-50/60">Carregando…</li> : null}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/servidor"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[12.5px] font-semibold text-white"
            >
              <Icon name="fingerprint" className="h-4 w-4" />
              Abrir área do servidor
            </Link>
            <a
              href="/api/sandbox"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/14 px-4 py-2.5 text-[12.5px] font-semibold text-brand-50/85"
            >
              <Icon name="database" className="h-4 w-4" />
              Ver status em JSON
            </a>
          </div>
        </div>

        <div className="glass-soft rounded-3xl p-5">
          <p className="font-display text-[15px] font-bold text-white">Atalhos do ambiente</p>
          <ul className="mt-4 space-y-2.5">
            {[
              { href: "/", label: "Tela de apresentação", icon: "layers" as IconName },
              { href: "/gestor", label: "Painel do gestor (aberto)", icon: "chart" as IconName },
              { href: "/gestor/importar", label: "Importar planilha XLSX/CSV", icon: "download" as IconName },
              { href: "/api/importacoes/modelo", label: "Baixar modelo de planilha", icon: "file" as IconName, novaAba: true },
              { href: "/servidor", label: "Área exclusiva do servidor", icon: "fingerprint" as IconName },
              { href: "/api/health", label: "Healthcheck da aplicação", icon: "server" as IconName },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/4 px-3.5 py-3 text-[12.5px] text-brand-50/85 transition hover:border-brand-400/45 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon name={item.icon} className="h-4 w-4 text-brand-200" />
                    {item.label}
                  </span>
                  <Icon name="arrow-right" className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-soft rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-[15px] font-bold text-white">
              Servidores na base · teste real em outra aba
            </p>
            <p className="mt-1 text-[12px] text-brand-50/60">
              Inclui todos os servidores importados da planilha. O botão abre a área exclusiva já
              autenticada, inclusive para cadastros sem CPF.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/gestor/importar"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/14 px-4 py-2.5 text-[12.5px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
            >
              <Icon name="download" className="h-4 w-4" />
              Importar planilha ↗
            </a>
            <a
              href="/gestor"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[12.5px] font-semibold text-white"
            >
              <Icon name="chart" className="h-4 w-4" />
              Painel do gestor ↗
            </a>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="bg-ink-950/60 text-[10.5px] uppercase tracking-[0.12em] text-brand-50/55">
                <th className="px-3 py-2.5">Servidor</th>
                <th className="px-3 py-2.5">CPF / nascimento</th>
                <th className="px-3 py-2.5">Cargo / lotação</th>
                <th className="px-3 py-2.5">Origem</th>
                <th className="px-3 py-2.5">Situação</th>
                <th className="px-3 py-2.5">Teste</th>
              </tr>
            </thead>
            <tbody>
              {(status?.servidoresLista ?? []).map((item) => (
                <tr key={item.id} className="border-t border-white/8 align-top">
                  <td className="px-3 py-2.5">
                    <p className="text-[12.5px] font-semibold text-white">{item.nome}</p>
                    {item.pendencias > 0 ? (
                      <p className="text-[10.5px] text-gold-300">{item.pendencias} pendência(s)</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-brand-50/75">
                    {item.cpf ? formatarCpf(item.cpf) : "sem CPF"}
                    <span className="mt-0.5 block text-[10.5px] text-brand-50/50">
                      {item.dtnasc ? formatarDataBR(item.dtnasc) : "sem nascimento"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-brand-50/75">
                    {item.cargo ?? "—"}
                    <span className="mt-0.5 block text-[10.5px] text-brand-50/50">{item.lotacao ?? "—"}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-brand-50/70">
                      {item.origem}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-brand-50/75">{item.situacao}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <a
                        href={`/api/sandbox/entrar?servidorId=${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-jade-400/40 bg-jade-400/12 px-2.5 py-1.5 text-[10.5px] font-semibold text-jade-400 transition hover:bg-jade-400/22"
                      >
                        Área do servidor ↗
                      </a>
                      <a
                        href={`/gestor/servidores/${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-white/14 px-2.5 py-1.5 text-[10.5px] font-semibold text-brand-50/80 transition hover:border-brand-400/50 hover:text-white"
                      >
                        Ficha ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {carregando ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-brand-50/60">
                    Carregando servidores…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {ROTEIRO.map((bloco) => (
          <div key={bloco.titulo} className="glass-soft rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-display text-[14.5px] font-bold text-white">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/14 text-brand-200">
                  <Icon name={bloco.icon} className="h-4 w-4" />
                </span>
                {bloco.titulo}
              </p>
              <Link
                href={bloco.href}
                className="shrink-0 rounded-lg border border-white/14 px-3 py-1.5 text-[11.5px] font-semibold text-brand-50/85 transition hover:border-brand-400/50 hover:text-white"
              >
                {bloco.cta}
              </Link>
            </div>
            <ol className="mt-3.5 space-y-1.5">
              {bloco.passos.map((passo, indice) => (
                <li key={passo} className="flex gap-2.5 text-[12px] leading-relaxed text-brand-50/72">
                  <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-brand-200">
                    {indice + 1}
                  </span>
                  {passo}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <p className="rounded-2xl border border-white/10 bg-ink-950/50 px-4 py-3 text-[11.5px] leading-relaxed text-brand-50/55">
        <Icon name="lock" className="mr-1.5 inline h-3.5 w-3.5" />
        Este sandbox é público e reiniciável. Não insira dados pessoais reais, informações de saúde ou
        qualquer dado sensível: a base é recriada periodicamente e pode ser apagada por outros
        testadores.
      </p>
    </div>
  );
}
