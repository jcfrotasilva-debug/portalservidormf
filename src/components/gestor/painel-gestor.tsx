"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { AtsModal } from "@/components/gestor/ats-modal";
import { EvolucaoModal } from "@/components/gestor/evolucao-modal";
import { LicencaModal } from "@/components/gestor/licenca-modal";
import {
  PERCENTUAL_POR_QUINQUENIO,
  formatarCpf,
  formatarDataBR,
  formatarTelefone,
} from "@/lib/ats";
import type { MetricasBase, ServidorComAts } from "@/lib/tipos";

type Atividade = {
  id: number;
  servidorId: number;
  nome: string;
  tipo: number;
  dataVigencia: string;
  dataDoe: string | null;
  dataProximoProjetada: string;
  criadoPor: string;
  criadoEm: string;
};

type Importacao = {
  id: number;
  arquivo: string;
  formato: string;
  totalLinhas: number;
  novas: number;
  atualizadas: number;
  ignoradas: number;
  comPendencias: number;
  celulasVaziasTratadas: number;
  criadoEm: string;
};

export function PainelGestor() {
  const [servidores, setServidores] = useState<ServidorComAts[]>([]);
  const [situacoes, setSituacoes] = useState<string[]>([]);
  const [metricas, setMetricas] = useState<MetricasBase | null>(null);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("todas");
  const [somenteAts, setSomenteAts] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<{ aberto: boolean; servidor: number | null }>({
    aberto: false,
    servidor: null,
  });
  const [modalEvolucao, setModalEvolucao] = useState<{ aberto: boolean; servidor: number | null }>({
    aberto: false,
    servidor: null,
  });
  const [modalLicenca, setModalLicenca] = useState<{ aberto: boolean; servidor: number | null }>({
    aberto: false,
    servidor: null,
  });
  const [novoServidor, setNovoServidor] = useState(false);
  const [form, setForm] = useState({ nome: "", cpf: "", cargo: "", lotacao: "", di: "", situacao: "Ativo" });
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (situacao !== "todas") params.set("situacao", situacao);
    if (somenteAts) params.set("somenteAts", "1");

    const [respostaServidores, respostaPainel] = await Promise.all([
      fetch(`/api/servidores?${params.toString()}`, { cache: "no-store" }),
      fetch("/api/painel", { cache: "no-store" }),
    ]);
    const dadosServidores = (await respostaServidores.json()) as {
      servidores?: ServidorComAts[];
      situacoes?: string[];
    };
    const dadosPainel = (await respostaPainel.json()) as {
      metricas?: MetricasBase;
      atividades?: Atividade[];
      importacoes?: Importacao[];
    };
    setServidores(dadosServidores.servidores ?? []);
    setSituacoes(dadosServidores.situacoes ?? []);
    setMetricas(dadosPainel.metricas ?? null);
    setAtividades(dadosPainel.atividades ?? []);
    setImportacoes(dadosPainel.importacoes ?? []);
    setCarregando(false);
  }, [busca, situacao, somenteAts]);

  useEffect(() => {
    const timer = setTimeout(carregar, 220);
    return () => clearTimeout(timer);
  }, [carregar]);

  const comPendencia = useMemo(
    () => servidores.filter((item) => (item.pendencias ?? []).length > 0),
    [servidores],
  );

  const cadastrarManual = async () => {
    setAviso(null);
    const resposta = await fetch("/api/servidores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const dados = (await resposta.json()) as { erro?: string };
    if (!resposta.ok) {
      setAviso(dados.erro ?? "Não foi possível cadastrar.");
      return;
    }
    setAviso("Servidor cadastrado com sucesso.");
    setForm({ nome: "", cpf: "", cargo: "", lotacao: "", di: "", situacao: "Ativo" });
    setNovoServidor(false);
    carregar();
  };

  const excluir = async (item: ServidorComAts) => {
    const resposta = await fetch(`/api/servidores/${item.id}`, { method: "DELETE" });
    if (resposta.ok) carregar();
  };

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Servidores na base",
            valor: metricas?.totalServidores ?? 0,
            detalhe: `${metricas?.ativos ?? 0} ativos`,
            icon: "users" as const,
            tom: "text-white",
          },
          {
            label: "Quinquênios lançados",
            valor: metricas?.totalQuinquenios ?? 0,
            detalhe: `ATS médio +${metricas?.percentualMedioAts ?? 0}%`,
            icon: "clock" as const,
            tom: "text-gold-400",
          },
          {
            label: "Projeções em 12 meses",
            valor: metricas?.proximos12Meses ?? 0,
            detalhe: "vencimentos de novos quinquênios",
            icon: "trending" as const,
            tom: "text-brand-200",
          },
          {
            label: "Evoluções funcionais",
            valor: metricas?.totalEvolucoes ?? 0,
            detalhe: `${metricas?.evolucoesProximas12Meses ?? 0} interstícios vencendo em 12 meses`,
            icon: "graduation" as const,
            tom: "text-jade-400",
          },
          {
            label: "Licença-prêmio",
            valor: metricas?.saldoLicencaTotal ?? 0,
            detalhe: `${metricas?.totalCertidoes ?? 0} certidões · ${metricas?.diasPecuniaTotal ?? 0} dias em pecúnia`,
            icon: "plane" as const,
            tom: "text-gold-300",
          },
        ].map((card) => (
          <div key={card.label} className="glass-soft rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/6 text-brand-200">
                <Icon name={card.icon} className="h-4.5 w-4.5" />
              </span>
              <span className={`font-display text-3xl font-extrabold ${card.tom}`}>{card.valor}</span>
            </div>
            <p className="mt-3 text-[13px] font-semibold text-white">{card.label}</p>
            <p className="mt-0.5 text-[11.5px] text-brand-50/60">{card.detalhe}</p>
          </div>
        ))}
      </div>

      <div className="glass-soft rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-brand-50/45"
            />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, CPF, cargo ou lotação"
              className="w-full rounded-xl border border-white/12 bg-ink-950/70 py-3 pl-10 pr-3 text-[13px] text-white outline-none placeholder:text-brand-50/35 focus:border-brand-400/70"
            />
          </div>
          <select
            value={situacao}
            onChange={(evento) => setSituacao(evento.target.value)}
            className="rounded-xl border border-white/12 bg-ink-950/70 px-3.5 py-3 text-[13px] text-white outline-none focus:border-brand-400/70"
          >
            <option value="todas" className="bg-ink-900">
              Todas as situações
            </option>
            {situacoes.map((item) => (
              <option key={item} value={item} className="bg-ink-900">
                {item}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-white/12 bg-ink-950/70 px-3.5 py-3 text-[12.5px] text-brand-50/80">
            <input
              type="checkbox"
              checked={somenteAts}
              onChange={(evento) => setSomenteAts(evento.target.checked)}
              className="h-4 w-4 accent-[#2f86f6]"
            />
            somente com ATS
          </label>
          <button
            type="button"
            onClick={() => setModal({ aberto: true, servidor: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-[13px] font-semibold text-white shadow-[0_18px_40px_-22px_rgba(47,134,246,1)] transition hover:from-brand-400"
          >
            <Icon name="clock" className="h-4 w-4" />
            Lançar ATS / quinquênio
          </button>
          <button
            type="button"
            onClick={() => setModalEvolucao({ aberto: true, servidor: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-4 py-3 text-[13px] font-semibold text-ink-950 shadow-[0_18px_40px_-22px_rgba(16,185,129,1)]"
          >
            <Icon name="graduation" className="h-4 w-4" />
            Evolução funcional
          </button>
          <button
            type="button"
            onClick={() => setModalLicenca({ aberto: true, servidor: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-3 text-[13px] font-semibold text-ink-950 shadow-[0_18px_40px_-22px_rgba(224,169,53,1)]"
          >
            <Icon name="plane" className="h-4 w-4" />
            Licença-prêmio
          </button>
          <button
            type="button"
            onClick={() => setNovoServidor((valor) => !valor)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/14 px-4 py-3 text-[13px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
          >
            <Icon name="users" className="h-4 w-4" />
            Cadastro manual
          </button>
          <Link
            href="/gestor/importar"
            className="inline-flex items-center gap-2 rounded-xl border border-white/14 px-4 py-3 text-[13px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
          >
            <Icon name="download" className="h-4 w-4" />
            Importar planilha
          </Link>
        </div>

        {novoServidor ? (
          <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-ink-950/50 p-4 sm:grid-cols-3 lg:grid-cols-6">
            <Campo rotulo="Nome">
              <input
                value={form.nome}
                onChange={(evento) => setForm({ ...form, nome: evento.target.value })}
                className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
              />
            </Campo>
            <Campo rotulo="CPF">
              <input
                value={form.cpf}
                onChange={(evento) => setForm({ ...form, cpf: evento.target.value })}
                className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
              />
            </Campo>
            <Campo rotulo="Cargo">
              <input
                value={form.cargo}
                onChange={(evento) => setForm({ ...form, cargo: evento.target.value })}
                className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
              />
            </Campo>
            <Campo rotulo="Lotação">
              <input
                value={form.lotacao}
                onChange={(evento) => setForm({ ...form, lotacao: evento.target.value })}
                className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
              />
            </Campo>
            <Campo rotulo="DI">
              <input
                type="date"
                value={form.di}
                onChange={(evento) => setForm({ ...form, di: evento.target.value })}
                className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
              />
            </Campo>
            <div className="flex items-end">
              <button
                type="button"
                onClick={cadastrarManual}
                className="w-full rounded-lg bg-gradient-to-r from-jade-500 to-jade-400 px-3 py-2.5 text-[13px] font-semibold text-ink-950"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : null}

        {aviso ? <p className="mt-3 text-[12.5px] text-gold-300">{aviso}</p> : null}
      </div>

      <div className="glass-soft overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <p className="font-display text-[15px] font-bold text-white">
            Cadastro funcional
            <span className="ml-2 text-[12px] font-medium text-brand-50/55">
              {carregando ? "carregando…" : `${servidores.length} registro(s)`}
            </span>
          </p>
          <span className="text-[11.5px] text-brand-50/55">
            projeção do próximo quinquênio = vigência + 1825 dias
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="bg-ink-950/60 text-[11px] uppercase tracking-[0.14em] text-brand-50/55">
                <th className="px-4 py-3">Servidor</th>
                <th className="px-4 py-3">CPF / RGCIN</th>
                <th className="px-4 py-3">Cargo / classe</th>
                <th className="px-4 py-3">Lotação</th>
                <th className="px-4 py-3">Jornada</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3">ATS</th>
                <th className="px-4 py-3">Próximo quinquênio</th>
                <th className="px-4 py-3">Evolução funcional</th>
                <th className="px-4 py-3">Licença-prêmio</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {servidores.map((item) => (
                <tr key={item.id} className="border-t border-white/8 align-top transition hover:bg-white/4">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/gestor/servidores/${item.id}`}
                      className="font-display text-[13.5px] font-bold text-white hover:text-brand-200"
                    >
                      {item.nome}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-brand-50/55">
                      DI {formatarDataBR(item.di)} · {formatarTelefone(item.tel)}
                    </p>
                    {(item.pendencias ?? []).length > 0 ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-2 py-0.5 text-[10.5px] font-semibold text-gold-300">
                        <Icon name="bell" className="h-3 w-3" />
                        {item.pendencias.length} pendência(s)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] text-brand-50/78">
                    {formatarCpf(item.cpf)}
                    <span className="mt-0.5 block text-[11px] text-brand-50/50">
                      {item.rgcin ?? "RGCIN não informado"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] text-brand-50/78">
                    {item.cargo ?? "—"}
                    <span className="mt-0.5 block text-[11px] text-brand-50/50">
                      {item.classe ?? "—"} · {item.categoria ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] text-brand-50/78">
                    {item.lotacao ?? "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] text-brand-50/78">
                    {item.jornada ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        item.situacao === "Ativo"
                          ? "bg-jade-400/15 text-jade-400"
                          : "bg-white/8 text-brand-50/75"
                      }`}
                    >
                      {item.situacao}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {item.ats.temAts ? (
                      <>
                        <p className="font-display text-[13px] font-bold text-gold-400">
                          +{item.ats.percentual}%
                        </p>
                        <p className="text-[11px] text-brand-50/58">
                          {item.ats.quantidade}º quinquênio · {PERCENTUAL_POR_QUINQUENIO}% cada
                        </p>
                      </>
                    ) : (
                      <span className="text-[11.5px] text-brand-50/50">sem lançamento</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {item.ats.proximaProjetada ? (
                      <>
                        <p className="text-[12.5px] font-semibold text-white">
                          {formatarDataBR(item.ats.proximaProjetada)}
                        </p>
                        <p className="text-[11px] text-brand-50/55">
                          {item.ats.diasParaProxima !== null && item.ats.diasParaProxima >= 0
                            ? `em ${item.ats.diasParaProxima} dias`
                            : "data já vencida — lançar"}
                        </p>
                      </>
                    ) : (
                      <span className="text-[11.5px] text-brand-50/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[12.5px] font-semibold text-white">
                      Nível {item.evolucao.nivelAtual}
                    </p>
                    <p className="text-[11px] text-brand-50/58">
                      {item.evolucao.temEvolucao
                        ? `${item.evolucao.quantidade} concessão(ões) · próxima ${formatarDataBR(item.evolucao.dataProxima)}`
                        : "sem concessão publicada"}
                    </p>
                    {item.evolucao.proximaRegra ? (
                      <p className="text-[10.5px] text-jade-400/85">
                        {item.evolucao.proximaRegra.origem} → {item.evolucao.proximaRegra.destino} ·{" "}
                        {item.evolucao.proximaRegra.pontuacaoMinima} pts
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[12.5px] font-semibold text-white">
                      {item.licenca.saldo} dia(s) de saldo
                    </p>
                    <p className="text-[11px] text-brand-50/58">
                      {item.licenca.certidoes} certidão(ões) · {item.licenca.diasGozo} gozo ·{" "}
                      {item.licenca.diasPecunia} pecúnia
                    </p>
                    {item.licenca.emGozo > 0 ? (
                      <p className="text-[10.5px] text-jade-400/85">em gozo agora</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ aberto: true, servidor: item.id })}
                        className="rounded-lg border border-brand-400/40 bg-brand-500/12 px-3 py-1.5 text-[11.5px] font-semibold text-brand-100 transition hover:bg-brand-500/22"
                      >
                        ATS
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalEvolucao({ aberto: true, servidor: item.id })}
                        className="rounded-lg border border-jade-400/40 bg-jade-400/12 px-3 py-1.5 text-[11.5px] font-semibold text-jade-400 transition hover:bg-jade-400/22"
                      >
                        Evolução
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalLicenca({ aberto: true, servidor: item.id })}
                        className="rounded-lg border border-gold-400/40 bg-gold-400/12 px-3 py-1.5 text-[11.5px] font-semibold text-gold-300 transition hover:bg-gold-400/22"
                      >
                        Licença
                      </button>
                      <Link
                        href={`/gestor/servidores/${item.id}`}
                        className="rounded-lg border border-white/12 px-3 py-1.5 text-[11.5px] font-semibold text-brand-50/80 transition hover:border-brand-400/50 hover:text-white"
                      >
                        Ficha
                      </Link>
                      <a
                        href={`/api/sandbox/entrar?servidorId=${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-white/12 px-3 py-1.5 text-[11.5px] font-semibold text-brand-50/80 transition hover:border-jade-400/50 hover:text-jade-400"
                        title="Testar a área exclusiva deste servidor em outra aba"
                      >
                        Testar ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => excluir(item)}
                        className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11.5px] text-brand-50/70 transition hover:border-red-400/50 hover:text-red-200"
                        aria-label="Excluir servidor"
                      >
                        <Icon name="close" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {servidores.length === 0 && !carregando ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-[13px] text-brand-50/60">
                    Nenhum servidor encontrado.{" "}
                    <Link href="/gestor/importar" className="font-semibold text-brand-200">
                      Importe a planilha de pré-cadastro
                    </Link>{" "}
                    ou faça um cadastro manual.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-soft rounded-2xl p-5">
          <p className="font-display text-[15px] font-bold text-white">Últimos lançamentos de ATS</p>
          <ul className="mt-4 space-y-3">
            {atividades.length === 0 ? (
              <li className="text-[12.5px] text-brand-50/60">
                Nenhum quinquênio lançado ainda.
              </li>
            ) : null}
            {atividades.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/4 p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-400/15 text-gold-400">
                  <Icon name="clock" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">
                    {item.tipo}º Quinquênio · {item.nome}
                  </p>
                  <p className="text-[11.5px] text-brand-50/62">
                    Vigência {formatarDataBR(item.dataVigencia)} · DOE {formatarDataBR(item.dataDoe)}{" "}
                    · projeção {formatarDataBR(item.dataProximoProjetada)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-brand-50/45">
                    {item.criadoPor} · {new Date(item.criadoEm).toLocaleString("pt-BR")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="glass-soft rounded-2xl p-5">
            <p className="font-display text-[15px] font-bold text-white">Cargas de planilha</p>
            <ul className="mt-4 space-y-3">
              {importacoes.length === 0 ? (
                <li className="text-[12.5px] text-brand-50/60">Nenhuma importação realizada.</li>
              ) : null}
              {importacoes.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/10 bg-white/4 p-3.5">
                  <p className="text-[13px] font-semibold text-white">{item.arquivo}</p>
                  <p className="mt-1 text-[11.5px] text-brand-50/62">
                    {item.novas} novos · {item.atualizadas} atualizados · {item.ignoradas} ignorados ·{" "}
                    {item.celulasVaziasTratadas} células vazias tratadas
                  </p>
                  <p className="mt-0.5 text-[11px] text-brand-50/45">
                    {new Date(item.criadoEm).toLocaleString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-soft rounded-2xl p-5">
            <p className="font-display text-[15px] font-bold text-white">
              Pendências para saneamento
            </p>
            <p className="mt-1 text-[12px] text-brand-50/60">
              Servidores com células vazias ou dados a confirmar na carga da planilha.
            </p>
            <ul className="mt-4 space-y-2.5">
              {comPendencia.slice(0, 6).map((item) => (
                <li key={item.id} className="rounded-xl border border-gold-400/20 bg-gold-400/8 p-3.5">
                  <p className="text-[12.5px] font-semibold text-white">{item.nome}</p>
                  <ul className="mt-1.5 space-y-1">
                    {(item.pendencias ?? []).slice(0, 3).map((pendencia) => (
                      <li key={pendencia} className="text-[11.5px] text-gold-100/85">
                        • {pendencia}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              {comPendencia.length === 0 ? (
                <li className="text-[12.5px] text-brand-50/60">
                  Nenhuma pendência registrada na base filtrada.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <AtsModal
        aberto={modal.aberto}
        servidores={servidores}
        servidorInicial={modal.servidor}
        onFechar={() => setModal({ aberto: false, servidor: null })}
        onAtualizado={carregar}
      />
      <EvolucaoModal
        aberto={modalEvolucao.aberto}
        servidores={servidores}
        servidorInicial={modalEvolucao.servidor}
        onFechar={() => setModalEvolucao({ aberto: false, servidor: null })}
        onAtualizado={carregar}
      />
      <LicencaModal
        aberto={modalLicenca.aberto}
        servidores={servidores}
        servidorInicial={modalLicenca.servidor}
        onFechar={() => setModalLicenca({ aberto: false, servidor: null })}
        onAtualizado={carregar}
      />
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-200/75">
        {rotulo}
      </span>
      {children}
    </label>
  );
}
