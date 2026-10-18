"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import {
  DIAS_QUINQUENIO,
  PERCENTUAL_POR_QUINQUENIO,
  diasEntre,
  formatarCpf,
  formatarDataBR,
  formatarDataLonga,
  formatarTelefone,
  hojeISO,
  idade,
  rotuloVinculo,
} from "@/lib/ats";
import { resumoVazio, rotuloTipoEvolucao } from "@/lib/evolucao";
import { resumirCertidao } from "@/lib/licenca";
import { RequerimentosServidor } from "@/components/portal/requerimentos-servidor";
import type {
  AtsQuinquenio,
  Evolucao,
  LicencaCertidao,
  LicencaFruicao,
  ResumoAts,
  ResumoEvolucao,
  ResumoLicenca,
  Servidor,
} from "@/lib/tipos";

type Dados = {
  autenticado: boolean;
  servidor?: Servidor;
  quinquenios?: AtsQuinquenio[];
  evolucoes?: Evolucao[];
  certidoes?: LicencaCertidao[];
  fruicoes?: LicencaFruicao[];
  resumo?: ResumoAts;
  resumoEvolucao?: ResumoEvolucao;
  resumoLicenca?: ResumoLicenca;
  tempo?: { anos: number; meses: number; dias: number; totalDias: number } | null;
  celulasVazias?: string[];
};

export function PortalServidor() {
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState<Dados | null>(null);
  const [cpf, setCpf] = useState("");
  const [dtnasc, setDtnasc] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const resposta = await fetch("/api/portal/me", { cache: "no-store" });
    if (resposta.ok) {
      setDados((await resposta.json()) as Dados);
    } else {
      setDados(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const entrar = async () => {
    setEntrando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, dtnasc }),
      });
      const json = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(json.erro ?? "Não foi possível acessar.");
      setCpf("");
      setDtnasc("");
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setEntrando(false);
    }
  };

  const sair = async () => {
    await fetch("/api/portal/login", { method: "DELETE" });
    setDados(null);
  };

  if (carregando) {
    return (
      <div className="glass-soft mx-auto max-w-md rounded-3xl p-8 text-center text-[13px] text-slate-700">
        Carregando sua área exclusiva…
      </div>
    );
  }

  if (!dados?.autenticado || !dados.servidor || !dados.resumo) {
    return (
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="glass rounded-3xl p-7">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400/30 to-gold-400/20 text-ink-950">
            <Icon name="fingerprint" className="h-5.5 w-5.5" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-950">
            Área exclusiva do servidor
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-700">
            Acesse com o CPF do seu cadastro funcional e a data de nascimento. Você verá seus dados,
            seus quinquênios (ATS) e a projeção da data do próximo direito.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                CPF ou nome completo
              </span>
              <input
                value={cpf}
                onChange={(evento) => setCpf(evento.target.value)}
                placeholder="000.000.000-00 ou nome do cadastro"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500/70"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                Data de nascimento
              </span>
              <input
                type="date"
                value={dtnasc}
                onChange={(evento) => setDtnasc(evento.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-[14px] text-ink-950 outline-none focus:border-brand-500/70"
              />
            </label>
            {erro ? (
              <p className="rounded-xl border border-red-400/40 bg-red-200 px-4 py-2.5 text-[12.5px] text-red-400">
                {erro}
              </p>
            ) : null}
            <button
              type="button"
              onClick={entrar}
              disabled={entrando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_22px_50px_-26px_rgba(22,101,144,0.5)] disabled:opacity-55"
            >
              <Icon name="key" className="h-4.5 w-4.5" />
              {entrando ? "Verificando…" : "Entrar na minha área"}
            </button>
          </div>

          <p className="mt-4 text-[11.5px] text-slate-600">
            Servidores importados da planilha podem entrar pelo CPF <strong className="text-ink-950">ou pelo nome completo</strong>.
            Quando a data de nascimento veio vazia, o acesso é liberado só com a identificação e a
            pendência fica registrada para o RH completar o cadastro.
          </p>
        </div>

        <div className="glass-soft rounded-3xl p-7">
          <p className="font-display text-[15.5px] font-bold text-ink-950">O que você encontra aqui</p>
          <ul className="mt-4 space-y-3">
            {[
              { icon: "clock" as const, texto: "Tempo de serviço e ATS acumulado (quinquênios)." },
              { icon: "trending" as const, texto: "Projeção da data do próximo quinquênio (vigência + 1825 dias)." },
              { icon: "file" as const, texto: "Ficha com CPF, RGCIN, DI, nascimento, telefone, e-mail, classe, cargo, categoria, jornada e lotação." },
              { icon: "badge-check" as const, texto: "Apontamento de dados pendentes para regularização com o RH." },
            ].map((item) => (
              <li key={item.texto} className="flex gap-3 text-[12.5px] leading-relaxed text-ink-950">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                {item.texto}
              </li>
            ))}
          </ul>

        </div>
      </div>
    );
  }

  const servidor = dados.servidor;
  const resumo = dados.resumo;
  const quinquenios = dados.quinquenios ?? [];
  const evolucoesLista = dados.evolucoes ?? [];
  const resumoEv = dados.resumoEvolucao ?? resumoVazio();
  const certidoesLista = dados.certidoes ?? [];
  const fruicoesLista = dados.fruicoes ?? [];
  const resumoLp = dados.resumoLicenca ?? {
    certidoes: 0,
    diasConcedidos: 0,
    diasGozo: 0,
    diasPecunia: 0,
    saldo: 0,
    emGozo: 0,
    temCertidao: false,
  };
  const tempo = dados.tempo ?? null;
  const anos = idade(servidor.dtnasc);
  const ultimo = quinquenios[quinquenios.length - 1];
  const progresso = ultimo
    ? Math.max(
        0,
        Math.min(100, Math.round((diasEntre(ultimo.dataVigencia, hojeISO()) / DIAS_QUINQUENIO) * 100)),
      )
    : 0;
  const diasRestantes = resumo.diasParaProxima ?? null;

  return (
    <div className="space-y-6">
      <div className="glass relative overflow-hidden rounded-3xl p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-200 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 font-display text-lg font-bold text-white">
              {servidor.nome
                .split(" ")
                .slice(0, 2)
                .map((palavra) => palavra[0])
                .join("")}
            </span>
            <div>
              <p className="text-[11.5px] uppercase tracking-[0.2em] text-brand-600">
                Bem-vindo(a) à sua área exclusiva
              </p>
              <h1 className="mt-1 font-display text-2xl font-extrabold text-ink-950">{servidor.nome}</h1>
              <p className="mt-1 text-[13px] text-slate-700">
                {servidor.cargo ?? "cargo não informado"} · {servidor.lotacao ?? "lotação não informada"}
              </p>
              <p className="mt-2 text-[12px] text-slate-600">
                Registro {servidor.id} · CPF {formatarCpf(servidor.cpf)} · Situação {servidor.situacao}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <a
              href="#requerimentos"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[12.5px] font-semibold text-white"
            >
              <Icon name="file" className="h-4 w-4" />
              Requerimento
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-700/16 px-4 py-2.5 text-[12.5px] font-semibold text-ink-950 transition hover:border-brand-500/50 hover:text-ink-950"
            >
              <Icon name="file" className="h-4 w-4" />
              Imprimir meu extrato
            </button>
            <button
              type="button"
              onClick={sair}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-700/16 px-4 py-2.5 text-[12.5px] font-semibold text-ink-950 transition hover:border-red-400/40 hover:text-red-400"
            >
              <Icon name="lock" className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Tempo de serviço",
              valor: tempo ? `${tempo.anos} anos e ${tempo.meses} meses` : "aguardando ATS",
              detalhe: tempo ? "estimado pelo 1º quinquênio" : "sem quinquênio lançado",
              tom: "text-ink-950",
            },
            {
              label: "ATS acumulado",
              valor: `${resumo.quantidade} quinquênio(s)`,
              detalhe: `+${resumo.percentual}% (${PERCENTUAL_POR_QUINQUENIO}% por quinquênio)`,
              tom: "text-gold-600",
            },
            {
              label: "Próximo quinquênio",
              valor: formatarDataBR(resumo.proximaProjetada),
              detalhe:
                diasRestantes === null
                  ? "sem lançamento"
                  : diasRestantes >= 0
                    ? `faltam ${diasRestantes} dias`
                    : "data já alcançada — procure o RH",
              tom: "text-brand-600",
            },
            {
              label: "Idade",
              valor: anos ? `${anos} anos` : "não informada",
              detalhe: `nascimento ${formatarDataBR(servidor.dtnasc)}`,
              tom: "text-ink-950",
            },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600">{card.label}</p>
              <p className={`mt-1.5 font-display text-[17px] font-extrabold ${card.tom}`}>
                {card.valor}
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-600">{card.detalhe}</p>
            </div>
          ))}
        </div>
      </div>

      <RequerimentosServidor />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-soft rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-[15px] font-bold text-ink-950">
              Minhas vantagens · ATS (quinquênios)
            </p>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-700">
              {quinquenios.length} de 10 lançados
            </span>
          </div>

          {ultimo ? (
            <div className="mt-4 rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-500/16 to-transparent p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11.5px] uppercase tracking-[0.16em] text-brand-600">
                    Ciclo atual do {ultimo.tipo}º quinquênio
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold text-ink-950">
                    Próximo em {formatarDataLonga(resumo.proximaProjetada)}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-700">
                    vigência {formatarDataBR(ultimo.dataVigencia)} + {DIAS_QUINQUENIO} dias
                  </p>
                </div>
                <p className="font-display text-2xl font-extrabold text-gold-600">{progresso}%</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/12">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-gold-400 transition-all duration-700"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          ) : null}

          <ol className="mt-4 space-y-2.5">
            {quinquenios.length === 0 ? (
              <li className="rounded-xl border border-dashed border-brand-700/16 p-4 text-center text-[12.5px] text-slate-700">
                Nenhum quinquênio lançado ainda. Assim que o RH registrar seus direitos, eles
                aparecerão aqui com vigência, DOE e projeção.
              </li>
            ) : null}
            {quinquenios.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-[13px] font-bold text-ink-950">
                    {item.tipo}º Quinquênio · vigência {formatarDataBR(item.dataVigencia)}
                  </p>
                  <span className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-[10.5px] font-semibold text-gold-400">
                    +{item.tipo * PERCENTUAL_POR_QUINQUENIO}%
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-slate-700">
                  DOE {formatarDataBR(item.dataDoe)} · projeção do próximo:{" "}
                  {formatarDataBR(item.dataProximoProjetada)}
                </p>
                {item.observacao ? (
                  <p className="mt-1 text-[11px] text-slate-600">{item.observacao}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6">
          <div className="glass-soft rounded-3xl border border-jade-400/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-[15px] font-bold text-ink-950">Minha evolução funcional</p>
              <span className="rounded-full border border-jade-400/35 bg-jade-100 px-3 py-1 text-[11px] font-semibold text-jade-400">
                {resumoEv.nivelAtualRotulo}
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-slate-600">
              {resumoEv.quadroLabel ?? "Quadro funcional a definir pelo RH"} ·{" "}
              {resumoEv.temEvolucao
                ? `próxima evolução prevista em ${formatarDataBR(resumoEv.dataProxima)}`
                : "nenhuma concessão publicada ainda"}
            </p>

            {resumoEv.proximaRegra ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600">
                  Requisitos da próxima faixa
                </p>
                <p className="mt-1 font-display text-[13px] font-bold text-ink-950">
                  Nível {resumoEv.proximaRegra.origem} → {resumoEv.proximaRegra.destino}
                </p>
                <p className="mt-0.5 text-[11.5px] text-slate-700">
                  {resumoEv.proximaRegra.intersticioAnos} anos de interstício ·{" "}
                  {resumoEv.proximaRegra.pontuacaoMinima} pontos mínimos
                </p>
                <p className="mt-1 text-[11px] text-brand-600">
                  Pesos: ×{resumoEv.proximaRegra.pesos.atualizacao} atualização · ×
                  {resumoEv.proximaRegra.pesos.aperfeicoamento} aperfeiçoamento · ×
                  {resumoEv.proximaRegra.pesos.producao} produção profissional
                </p>
              </div>
            ) : null}

            <ul className="mt-3 space-y-2">
              {evolucoesLista.length === 0 ? (
                <li className="rounded-xl border border-dashed border-brand-700/16 p-3.5 text-center text-[12px] text-slate-700">
                  Suas evoluções aparecerão aqui assim que o RH publicar a concessão.
                </li>
              ) : null}
              {evolucoesLista.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-[12.5px] font-bold text-ink-950">
                      {rotuloTipoEvolucao(item.tipo)} · Nível {item.nivelOrigem} → {item.nivelDestino}
                    </p>
                    <span className="shrink-0 rounded-full bg-jade-200 px-2 py-0.5 text-[10px] font-semibold text-jade-400">
                      {item.intersticioAnos} anos
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-700">
                    Vigência {formatarDataBR(item.dataVigencia)} · DOE {formatarDataBR(item.dataDoe)} · próxima{" "}
                    {formatarDataBR(item.dataProxima)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-soft rounded-3xl border border-gold-600/25 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-[15px] font-bold text-ink-950">Minha licença-prêmio</p>
              <span className="rounded-full border border-gold-600/30 bg-gold-100 px-3 py-1 text-[11px] font-semibold text-gold-400">
                {resumoLp.saldo} dia(s) de saldo
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                { label: "certidões", valor: resumoLp.certidoes, tom: "text-ink-950" },
                { label: "gozo", valor: resumoLp.diasGozo, tom: "text-jade-400" },
                { label: "pecúnia", valor: resumoLp.diasPecunia, tom: "text-gold-600" },
                { label: "concedidos", valor: resumoLp.diasConcedidos, tom: "text-brand-600" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-2">
                  <p className={`font-display text-[14px] font-bold ${card.tom}`}>{card.valor}</p>
                  <p className="text-[10px] text-slate-600">{card.label}</p>
                </div>
              ))}
            </div>

            <ul className="mt-3 space-y-2">
              {certidoesLista.length === 0 ? (
                <li className="rounded-xl border border-dashed border-brand-700/16 p-3.5 text-center text-[12px] text-slate-700">
                  Nenhuma certidão de licença-prêmio registrada.
                </li>
              ) : null}
              {certidoesLista.map((certidao) => {
                const resumoCertidao = resumirCertidao(
                  certidao,
                  fruicoesLista.filter((item) => item.certidaoId === certidao.id),
                );
                const fruicoesCertidao = fruicoesLista.filter((item) => item.certidaoId === certidao.id);
                return (
                  <li key={certidao.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-[12.5px] font-bold text-ink-950">
                        Certidão {certidao.numero}/{certidao.ano}
                      </p>
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-gold-400">
                        {resumoCertidao.saldo} de {resumoCertidao.diasConcedidos} dias
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-700">
                      Período {formatarDataBR(certidao.periodoInicial)} a {formatarDataBR(certidao.periodoFinal)} ·
                      DOE {formatarDataBR(certidao.dataDoe)}
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/12">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-jade-400 to-gold-400"
                        style={{ width: `${resumoCertidao.percentualUtilizado}%` }}
                      />
                    </div>
                    {fruicoesCertidao.length ? (
                      <ul className="mt-2 space-y-1">
                        {fruicoesCertidao.map((fruicao) => (
                          <li key={fruicao.id} className="text-[10.5px] text-slate-600">
                            • {fruicao.tipo === "gozo" ? "Gozo" : "Pecúnia"} de {fruicao.dias} dias
                            {fruicao.tipo === "gozo"
                              ? ` · ${formatarDataBR(fruicao.dataInicio)} a ${formatarDataBR(fruicao.dataFim)}`
                              : ` · ano ${fruicao.ano ?? "—"}`}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="glass-soft rounded-3xl p-5">
            <p className="font-display text-[15px] font-bold text-ink-950">Meus dados cadastrais</p>
            <dl className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {(
                [
                  ["Nome", servidor.nome],
                  ["CPF", formatarCpf(servidor.cpf)],
                  ["RGCIN", servidor.rgcin ?? "—"],
                  ["DI (dígito de identificação)", servidor.di ?? "—"],
                  ["Nascimento", formatarDataBR(servidor.dtnasc)],
                  ["Telefone", formatarTelefone(servidor.tel)],
                  ["E-mail", servidor.email ?? "—"],
                  ["Classe", servidor.classe ?? "—"],
                  ["Cargo", servidor.cargo ?? "—"],
                  ["Categoria", servidor.categoria ?? "—"],
                  ["Jornada", servidor.jornada ?? "—"],
                  ["Lotação", servidor.lotacao ?? "—"],
                ] as const
              ).map(([rotulo, valor]) => (
                <div key={rotulo} className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2">
                  <dt className="text-[11.5px] text-slate-600">{rotulo}</dt>
                  <dd className="text-right text-[12.5px] font-medium text-ink-950">{valor}</dd>
                </div>
              ))}
            </dl>
          </div>

          {(dados.celulasVazias ?? []).length > 0 || (servidor.pendencias ?? []).length > 0 ? (
            <div className="glass-soft rounded-3xl border border-gold-600/25 p-5">
              <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink-950">
                <Icon name="bell" className="h-4.5 w-4.5 text-gold-600" />
                Regularize seu cadastro
              </p>
              <p className="mt-2 text-[12.5px] text-slate-700">
                Estes dados chegaram incompletos na carga da planilha e precisam de confirmação:
              </p>
              <ul className="mt-3 space-y-1.5">
                {(servidor.pendencias ?? []).map((pendencia) => (
                  <li key={pendencia} className="text-[12px] text-ink-950/85">
                    • {pendencia}
                  </li>
                ))}
              </ul>
              {(dados.celulasVazias ?? []).length ? (
                <p className="mt-3 text-[11.5px] text-slate-600">
                  Campos vazios: {(dados.celulasVazias ?? []).join(", ")}.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="glass-soft rounded-3xl border border-jade-400/30 p-5">
              <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink-950">
                <Icon name="badge-check" className="h-4.5 w-4.5 text-jade-400" />
                Cadastro completo
              </p>
              <p className="mt-2 text-[12.5px] text-slate-700">
                Seus dados funcionais estão íntegros. Qualquer dúvida sobre ATS, licenças ou
                progressões, procure o setor de Gestão de Pessoas.
              </p>
            </div>
          )}

          <div className="glass-soft rounded-3xl p-5">
            <p className="font-display text-[15px] font-bold text-ink-950">Próximos direitos previstos</p>
            <ul className="mt-3 space-y-2.5">
              <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <Icon name="clock" className="mt-0.5 h-4 w-4 text-gold-600" />
                <div>
                  <p className="text-[12.5px] font-semibold text-ink-950">
                    {resumo.proximoTipo ?? 1}º Quinquênio (+{(resumo.proximoTipo ?? 1) * PERCENTUAL_POR_QUINQUENIO}% de ATS)
                  </p>
                  <p className="text-[11.5px] text-slate-700">
                    previsão em {formatarDataLonga(resumo.proximaProjetada)} (última vigência +{" "}
                    {DIAS_QUINQUENIO} dias)
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <Icon name="plane" className="mt-0.5 h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-[12.5px] font-semibold text-ink-950">
                    Licença-prêmio: {resumo.quantidade * 3} meses adquiridos
                  </p>
                  <p className="text-[11.5px] text-slate-700">
                    3 meses por quinquênio completo, conforme o estatuto do órgão
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <Icon name="calendar" className="mt-0.5 h-4 w-4 text-jade-400" />
                <div>
                  <p className="text-[12.5px] font-semibold text-ink-950">
                    Férias: {(tempo?.anos ?? 0) * 30} dias acumulados em carreira
                  </p>
                  <p className="text-[11.5px] text-slate-700">
                    30 dias por ano de exercício + 1/3 constitucional
                  </p>
                </div>
              </li>
            </ul>
            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
              <Icon name="scale" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Valores e datas são projeções calculadas pelo motor de regras da plataforma (vigência +
              {" "}
              {DIAS_QUINQUENIO} dias). A concessão depende de publicação no Diário Oficial e
              homologação do RH.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-[11.5px] text-slate-600">
        Precisa de um documento oficial?{" "}
        <Link href="/gestor" className="font-semibold text-brand-600">
          Fale com a Gestão de Pessoas
        </Link>
        .
      </p>
    </div>
  );
}
