"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { formatarDataBR } from "@/lib/ats";
import {
  DIAS_CERTIDAO,
  DIAS_PECUNIA,
  OPCOES_GOZO,
  calcularDataFimGozo,
  diasDoPeriodo,
  resumirCertidao,
} from "@/lib/licenca";
import type { LicencaCertidao, LicencaFruicao, ResumoLicenca, ServidorComAts } from "@/lib/tipos";

type CertidaoComResumo = LicencaCertidao & { resumo: ReturnType<typeof resumirCertidao> };

type Props = {
  aberto: boolean;
  servidores: ServidorComAts[];
  servidorInicial?: number | null;
  onFechar: () => void;
  onAtualizado: () => void;
};

const ANO_ATUAL = new Date().getFullYear();

export function LicencaModal({ aberto, servidores, servidorInicial, onFechar, onAtualizado }: Props) {
  const [servidorId, setServidorId] = useState<number | "">("");
  const [buscaServidor, setBuscaServidor] = useState("");
  const [aba, setAba] = useState<"certidoes" | "fruicoes">("certidoes");
  const [certidoes, setCertidoes] = useState<CertidaoComResumo[]>([]);
  const [fruicoes, setFruicoes] = useState<LicencaFruicao[]>([]);
  const [resumo, setResumo] = useState<ResumoLicenca | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);

  // certidão
  const [numero, setNumero] = useState("");
  const [ano, setAno] = useState(String(ANO_ATUAL));
  const [periodoInicial, setPeriodoInicial] = useState("");
  const [periodoFinal, setPeriodoFinal] = useState("");
  const [doeCertidao, setDoeCertidao] = useState("");
  const [obsCertidao, setObsCertidao] = useState("");

  // fruição
  const [certidaoId, setCertidaoId] = useState<number | "">("");
  const [tipo, setTipo] = useState<"gozo" | "pecunia">("gozo");
  const [dias, setDias] = useState(30);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [doeAutorizacao, setDoeAutorizacao] = useState("");
  const [anoPecunia, setAnoPecunia] = useState(String(ANO_ATUAL));
  const [doePecunia, setDoePecunia] = useState("");
  const [obsFruicao, setObsFruicao] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setMensagem(null);
    setServidorId(servidorInicial ?? "");
    setAba("certidoes");
  }, [aberto, servidorInicial]);

  useEffect(() => {
    if (!aberto || !servidorId) {
      setCertidoes([]);
      setFruicoes([]);
      setResumo(null);
      return;
    }
    let ativo = true;
    setCarregando(true);
    fetch(`/api/licenca-premio?servidorId=${servidorId}`, { cache: "no-store" })
      .then((resposta) => resposta.json())
      .then((dados: { certidoes?: CertidaoComResumo[]; fruicoes?: LicencaFruicao[]; resumo?: ResumoLicenca }) => {
        if (!ativo) return;
        setCertidoes(dados.certidoes ?? []);
        setFruicoes(dados.fruicoes ?? []);
        setResumo(dados.resumo ?? null);
        const disponivel = (dados.certidoes ?? []).filter((item) => item.resumo.saldo > 0);
        setCertidaoId(disponivel[0]?.id ?? "");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [aberto, servidorId]);

  const servidorSelecionado = useMemo(
    () => servidores.find((item) => item.id === servidorId) ?? null,
    [servidores, servidorId],
  );

  const listaFiltrada = useMemo(() => {
    const termo = buscaServidor.trim().toLowerCase();
    if (!termo) return servidores.slice(0, 60);
    return servidores
      .filter(
        (item) =>
          item.nome.toLowerCase().includes(termo) ||
          (item.cpf ?? "").includes(termo.replace(/\D/g, "")) ||
          (item.cargo ?? "").toLowerCase().includes(termo),
      )
      .slice(0, 60);
  }, [buscaServidor, servidores]);

  const certidaoSelecionada = certidoes.find((item) => item.id === certidaoId) ?? null;
  const saldoCertidao = certidaoSelecionada?.resumo.saldo ?? 0;
  const diasEfetivos = tipo === "pecunia" ? DIAS_PECUNIA : dias;
  const fimCalculado = dataInicio ? calcularDataFimGozo(dataInicio, diasEfetivos) : "";
  const diasPeriodo = dataInicio && dataFim ? diasDoPeriodo(dataInicio, dataFim) : 0;
  const saldoInsuficiente = diasEfetivos > saldoCertidao;

  if (!aberto) return null;

  const recarregar = async () => {
    if (!servidorId) return;
    const resposta = await fetch(`/api/licenca-premio?servidorId=${servidorId}`, { cache: "no-store" });
    const dados = (await resposta.json()) as {
      certidoes?: CertidaoComResumo[];
      fruicoes?: LicencaFruicao[];
      resumo?: ResumoLicenca;
    };
    setCertidoes(dados.certidoes ?? []);
    setFruicoes(dados.fruicoes ?? []);
    setResumo(dados.resumo ?? null);
  };

  const salvarCertidao = async () => {
    setMensagem(null);
    if (!servidorId) return setMensagem({ tom: "erro", texto: "Selecione o servidor." });
    setOcupado(true);
    try {
      const resposta = await fetch("/api/licenca-premio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "certidao",
          servidorId: Number(servidorId),
          numero,
          ano: Number(ano),
          periodoInicial,
          periodoFinal,
          dataDoe: doeCertidao || null,
          observacao: obsCertidao || null,
        }),
      });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao cadastrar a certidão.");
      setMensagem({
        tom: "ok",
        texto: `Certidão ${numero}/${ano} cadastrada com saldo de ${DIAS_CERTIDAO} dias.`,
      });
      setNumero("");
      setPeriodoInicial("");
      setPeriodoFinal("");
      setDoeCertidao("");
      setObsCertidao("");
      await recarregar();
      onAtualizado();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  const salvarFruicao = async () => {
    setMensagem(null);
    if (!servidorId) return setMensagem({ tom: "erro", texto: "Selecione o servidor." });
    if (!certidaoId) return setMensagem({ tom: "erro", texto: "Selecione a certidão a ser debitada." });
    if (saldoInsuficiente) {
      return setMensagem({
        tom: "erro",
        texto: `Saldo insuficiente: a certidão tem ${saldoCertidao} dia(s) e a fruição é de ${diasEfetivos}.`,
      });
    }
    if (tipo === "gozo" && !dataInicio) {
      return setMensagem({ tom: "erro", texto: "Informe a data de início do gozo." });
    }

    setOcupado(true);
    try {
      const resposta = await fetch("/api/licenca-premio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "fruicao",
          servidorId: Number(servidorId),
          certidaoId: Number(certidaoId),
          tipo,
          dias: tipo === "pecunia" ? DIAS_PECUNIA : dias,
          dataInicio: tipo === "gozo" ? dataInicio : null,
          dataFim: tipo === "gozo" ? dataFim || fimCalculado : null,
          dataDoeAutorizacao: tipo === "gozo" ? doeAutorizacao || null : null,
          ano: tipo === "pecunia" ? Number(anoPecunia) : null,
          dataDoePecunia: tipo === "pecunia" ? doePecunia || null : null,
          observacao: obsFruicao || null,
        }),
      });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao lançar a fruição.");
      setMensagem({
        tom: "ok",
        texto:
          tipo === "gozo"
            ? `Gozo de ${dias} dia(s) registrado e debitado do saldo da certidão.`
            : `Pecúnia de ${DIAS_PECUNIA} dias registrada e debitada do saldo.`,
      });
      setDataInicio("");
      setDataFim("");
      setDoeAutorizacao("");
      setDoePecunia("");
      setObsFruicao("");
      await recarregar();
      onAtualizado();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  const excluir = async (tipoExclusao: "certidao" | "fruicao", id: number) => {
    setOcupado(true);
    try {
      const query = tipoExclusao === "certidao" ? `id=${id}` : `fruicaoId=${id}`;
      const resposta = await fetch(`/api/licenca-premio?${query}`, { method: "DELETE" });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao excluir.");
      setMensagem({
        tom: "ok",
        texto: tipoExclusao === "certidao" ? "Certidão excluída." : "Fruição excluída e saldo devolvido.",
      });
      await recarregar();
      onAtualizado();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink-950/80 px-4 py-8 backdrop-blur-sm">
      <div className="glass w-full max-w-6xl rounded-[28px] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gold-400/30 to-brand-500/25 text-white ring-1 ring-inset ring-white/12">
              <Icon name="plane" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-white">Licença-Prêmio</h2>
              <p className="mt-1 text-[12.5px] text-brand-50/65">
                Certidões de {DIAS_CERTIDAO} dias · gozo em {OPCOES_GOZO.join("/")} dias · pecúnia de {DIAS_PECUNIA} dias
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-brand-50/80 transition hover:bg-white/8 hover:text-white"
            aria-label="Fechar"
          >
            <Icon name="close" className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-200/80">
                Servidor
              </span>
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-brand-50/45" />
                <input
                  value={buscaServidor}
                  onChange={(evento) => setBuscaServidor(evento.target.value)}
                  placeholder="Filtrar por nome, CPF ou cargo"
                  className="mb-2 w-full rounded-xl border border-white/12 bg-ink-950/70 py-2.5 pl-10 pr-3 text-[13px] text-white outline-none placeholder:text-brand-50/35 focus:border-brand-400/70"
                />
                <select
                  value={servidorId}
                  onChange={(evento) => {
                    setServidorId(evento.target.value ? Number(evento.target.value) : "");
                    setMensagem(null);
                  }}
                  size={4}
                  className="w-full rounded-xl border border-white/12 bg-ink-950/70 p-2 text-[13px] text-white outline-none focus:border-brand-400/70"
                >
                  <option value="" className="bg-ink-900">
                    — selecione o servidor —
                  </option>
                  {listaFiltrada.map((item) => (
                    <option key={item.id} value={item.id} className="bg-ink-900">
                      {item.nome} · {item.cargo ?? "sem cargo"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {servidorSelecionado ? (
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-[15px] font-bold text-white">{servidorSelecionado.nome}</p>
                    <p className="text-[12px] text-brand-50/65">
                      {servidorSelecionado.cargo ?? "cargo não informado"} · {servidorSelecionado.lotacao ?? "sem lotação"}
                    </p>
                  </div>
                  <span className="rounded-full border border-gold-400/30 bg-gold-400/12 px-3 py-1 text-[11px] font-semibold text-gold-300">
                    Saldo {resumo?.saldo ?? 0} dia(s)
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "certidões", valor: resumo?.certidoes ?? 0, tom: "text-white" },
                    { label: "concedidos", valor: resumo?.diasConcedidos ?? 0, tom: "text-brand-200" },
                    { label: "gozo", valor: resumo?.diasGozo ?? 0, tom: "text-jade-400" },
                    { label: "pecúnia", valor: resumo?.diasPecunia ?? 0, tom: "text-gold-400" },
                  ].map((card) => (
                    <div key={card.label} className="rounded-xl border border-white/8 bg-ink-950/50 p-2">
                      <p className={`font-display text-[14px] font-bold ${card.tom}`}>{card.valor}</p>
                      <p className="text-[10px] text-brand-50/60">{card.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-2 rounded-xl border border-white/10 bg-ink-950/55 p-1.5">
              {(
                [
                  ["certidoes", "Certidões concedidas"],
                  ["fruicoes", "Fruições (gozo / pecúnia)"],
                ] as const
              ).map(([chave, rotulo]) => (
                <button
                  key={chave}
                  type="button"
                  onClick={() => setAba(chave)}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-[12.5px] font-semibold transition ${
                    aba === chave
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                      : "text-brand-50/70 hover:text-white"
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>

            {aba === "certidoes" ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-ink-950/40 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo rotulo="Nº da certidão">
                    <input
                      value={numero}
                      onChange={(evento) => setNumero(evento.target.value)}
                      placeholder="Ex.: 014"
                      className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
                    />
                  </Campo>
                  <Campo rotulo="Ano da certidão">
                    <input
                      value={ano}
                      onChange={(evento) => setAno(evento.target.value)}
                      inputMode="numeric"
                      className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
                    />
                  </Campo>
                  <Campo rotulo="Data do período inicial">
                    <input
                      type="date"
                      value={periodoInicial}
                      onChange={(evento) => setPeriodoInicial(evento.target.value)}
                      className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
                    />
                  </Campo>
                  <Campo rotulo="Data do período final">
                    <input
                      type="date"
                      value={periodoFinal}
                      onChange={(evento) => setPeriodoFinal(evento.target.value)}
                      className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
                    />
                  </Campo>
                  <Campo rotulo="Publicação em DOE (livre)">
                    <input
                      type="date"
                      value={doeCertidao}
                      onChange={(evento) => setDoeCertidao(evento.target.value)}
                      className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
                    />
                    <span className="mt-1 block text-[10.5px] leading-snug text-brand-50/50">
                      Aceita DOE anterior ao fim do período aquisitivo.
                    </span>
                  </Campo>
                  <Campo rotulo="Saldo da certidão">
                    <div className="flex items-center gap-2 rounded-lg border border-jade-400/30 bg-jade-400/10 px-3 py-2.5">
                      <Icon name="check" className="h-4 w-4 text-jade-400" strokeWidth={2.4} />
                      <span className="font-display text-[13px] font-bold text-white">
                        {DIAS_CERTIDAO} dias positivos
                      </span>
                    </div>
                  </Campo>
                </div>
                {periodoInicial && periodoFinal ? (
                  <p className="text-[11.5px] text-brand-50/60">
                    Período aquisitivo de {diasDoPeriodo(periodoInicial, periodoFinal)} dias corridos.
                  </p>
                ) : null}
                <Campo rotulo="Observação (opcional)">
                  <input
                    value={obsCertidao}
                    onChange={(evento) => setObsCertidao(evento.target.value)}
                    placeholder="Processo administrativo, livro, folha do DOE…"
                    className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-brand-50/35 focus:border-brand-400/70"
                  />
                </Campo>
                <button
                  type="button"
                  onClick={salvarCertidao}
                  disabled={ocupado}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-[13.5px] font-semibold text-white disabled:opacity-55"
                >
                  <Icon name="file" className="h-4 w-4" />
                  Cadastrar certidão
                </button>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-ink-950/40 p-4">
                <Campo rotulo="Certidão a debitar">
                  <select
                    value={certidaoId}
                    onChange={(evento) => setCertidaoId(evento.target.value ? Number(evento.target.value) : "")}
                    className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
                  >
                    <option value="" className="bg-ink-900">
                      — selecione a certidão —
                    </option>
                    {certidoes.map((item) => (
                      <option key={item.id} value={item.id} className="bg-ink-900">
                        Certidão {item.numero}/{item.ano} · saldo {item.resumo.saldo} dias
                      </option>
                    ))}
                  </select>
                </Campo>

                {certidaoSelecionada ? (
                  <div className="rounded-xl border border-white/10 bg-white/4 p-3">
                    <div className="flex items-center justify-between text-[11.5px] text-brand-50/70">
                      <span>
                        Período {formatarDataBR(certidaoSelecionada.periodoInicial)} a{" "}
                        {formatarDataBR(certidaoSelecionada.periodoFinal)}
                      </span>
                      <span className="font-semibold text-gold-300">{certidaoSelecionada.resumo.saldo} dias</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/12">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-jade-400 to-gold-400"
                        style={{ width: `${certidaoSelecionada.resumo.percentualUtilizado}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10.5px] text-brand-50/55">
                      {certidaoSelecionada.resumo.diasUtilizados} de {certidaoSelecionada.resumo.diasConcedidos} dias
                      utilizados ({certidaoSelecionada.resumo.diasGozo} em gozo · {certidaoSelecionada.resumo.diasPecunia} em pecúnia)
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["gozo", "Gozo em dias", "plane"],
                      ["pecunia", "Pecúnia", "coins"],
                    ] as const
                  ).map(([valor, rotulo, icone]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setTipo(valor)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold transition ${
                        tipo === valor
                          ? "border-brand-400/60 bg-brand-500/18 text-white"
                          : "border-white/12 text-brand-50/70 hover:text-white"
                      }`}
                    >
                      <Icon name={icone} className="h-4 w-4" />
                      {rotulo}
                    </button>
                  ))}
                </div>

                {tipo === "gozo" ? (
                  <>
                    <Campo rotulo="Dias de gozo">
                      <div className="flex flex-wrap gap-2">
                        {OPCOES_GOZO.map((opcao) => (
                          <button
                            key={opcao}
                            type="button"
                            onClick={() => setDias(opcao)}
                            disabled={opcao > saldoCertidao}
                            className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                              dias === opcao
                                ? "border-brand-400/60 bg-brand-500/18 text-white"
                                : "border-white/12 text-brand-50/70 hover:text-white"
                            }`}
                          >
                            {opcao} dias
                          </button>
                        ))}
                      </div>
                    </Campo>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Campo rotulo="Data início do gozo">
                        <input
                          type="date"
                          value={dataInicio}
                          onChange={(evento) => {
                            setDataInicio(evento.target.value);
                            if (evento.target.value) setDataFim(calcularDataFimGozo(evento.target.value, dias));
                          }}
                          className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
                        />
                      </Campo>
                      <Campo rotulo="Data fim do gozo">
                        <input
                          type="date"
                          value={dataFim}
                          onChange={(evento) => setDataFim(evento.target.value)}
                          className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
                        />
                      </Campo>
                    </div>
                    {dataInicio ? (
                      <p className="text-[11.5px] text-brand-200">
                        Fim calculado para {dias} dias: {formatarDataBR(fimCalculado)}
                        {diasPeriodo ? ` · período informado tem ${diasPeriodo} dias` : ""}
                      </p>
                    ) : null}
                    <Campo rotulo="Autorização em DOE">
                      <input
                        type="date"
                        value={doeAutorizacao}
                        onChange={(evento) => setDoeAutorizacao(evento.target.value)}
                        className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
                      />
                    </Campo>
                  </>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Campo rotulo="Ano da pecúnia">
                        <input
                          value={anoPecunia}
                          onChange={(evento) => setAnoPecunia(evento.target.value)}
                          inputMode="numeric"
                          className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
                        />
                      </Campo>
                      <Campo rotulo="DOE da pecúnia (opcional)">
                        <input
                          type="date"
                          value={doePecunia}
                          onChange={(evento) => setDoePecunia(evento.target.value)}
                          className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
                        />
                      </Campo>
                    </div>
                    <p className="rounded-xl border border-gold-400/30 bg-gold-400/10 px-3 py-2.5 text-[11.5px] text-gold-200">
                      Conversão em pecúnia equivale a {DIAS_PECUNIA} dias, debitados do saldo da certidão
                      selecionada.
                    </p>
                  </>
                )}

                <Campo rotulo="Observação (opcional)">
                  <input
                    value={obsFruicao}
                    onChange={(evento) => setObsFruicao(evento.target.value)}
                    placeholder="Portaria de autorização, processo, substituição…"
                    className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-brand-50/35 focus:border-brand-400/70"
                  />
                </Campo>

                {saldoInsuficiente && certidaoSelecionada ? (
                  <p className="rounded-lg border border-red-400/35 bg-red-400/10 px-3 py-2 text-[11.5px] text-red-200">
                    Saldo insuficiente: {saldoCertidao} dia(s) disponível(is) nesta certidão.
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={salvarFruicao}
                  disabled={ocupado || saldoInsuficiente || !certidaoId}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-4 py-3 text-[13.5px] font-semibold text-ink-950 disabled:opacity-50"
                >
                  <Icon name={tipo === "gozo" ? "plane" : "coins"} className="h-4 w-4" />
                  {tipo === "gozo" ? "Registrar gozo" : "Registrar pecúnia"} ({diasEfetivos} dias)
                </button>
              </div>
            )}

            {mensagem ? (
              <p
                className={`rounded-xl px-3.5 py-2.5 text-[12.5px] ${
                  mensagem.tom === "ok"
                    ? "border border-jade-400/30 bg-jade-400/10 text-jade-400"
                    : "border border-red-400/35 bg-red-400/10 text-red-200"
                }`}
              >
                {mensagem.texto}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-ink-950/45 p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-[14px] font-bold text-white">Certidões do servidor</p>
                <span className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] text-brand-50/65">
                  {certidoes.length}
                </span>
              </div>
              {carregando ? (
                <p className="mt-3 text-[12.5px] text-brand-50/60">Carregando…</p>
              ) : !servidorId ? (
                <p className="mt-3 text-[12.5px] text-brand-50/60">Selecione um servidor.</p>
              ) : certidoes.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-white/15 p-4 text-center text-[12px] text-brand-50/68">
                  Nenhuma certidão cadastrada. Cada certidão concede {DIAS_CERTIDAO} dias de licença-prêmio.
                </p>
              ) : (
                <ul className="mt-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                  {certidoes.map((item) => (
                    <li key={item.id} className="rounded-xl border border-white/10 bg-white/4 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-[12.5px] font-bold text-white">
                            Certidão {item.numero}/{item.ano}
                          </p>
                          <p className="text-[11px] text-brand-50/62">
                            {formatarDataBR(item.periodoInicial)} a {formatarDataBR(item.periodoFinal)} · DOE{" "}
                            {formatarDataBR(item.dataDoe)}
                          </p>
                          <p className="mt-1 text-[11px] text-gold-300">
                            saldo {item.resumo.saldo} de {item.resumo.diasConcedidos} dias
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => excluir("certidao", item.id)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/12 text-brand-50/75 transition hover:border-red-400/50 hover:text-red-200"
                          aria-label="Excluir certidão"
                        >
                          <Icon name="close" className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/12">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-jade-400 to-gold-400"
                          style={{ width: `${item.resumo.percentualUtilizado}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-950/45 p-4">
              <p className="font-display text-[14px] font-bold text-white">Fruições lançadas</p>
              {fruicoes.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-white/15 p-4 text-center text-[12px] text-brand-50/68">
                  Nenhum gozo ou pecúnia registrado. Cada lançamento baixa automaticamente do saldo.
                </p>
              ) : (
                <ul className="mt-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                  {fruicoes.map((item) => {
                    const certidao = certidoes.find((registro) => registro.id === item.certidaoId);
                    return (
                      <li key={item.id} className="rounded-xl border border-white/10 bg-white/4 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-[12.5px] font-bold text-white">
                              {item.tipo === "gozo" ? "Gozo" : "Pecúnia"} · {item.dias} dias
                            </p>
                            <p className="text-[11px] text-brand-50/62">
                              Certidão {certidao?.numero ?? "—"}/{certidao?.ano ?? "—"} ·{" "}
                              {item.tipo === "gozo"
                                ? `${formatarDataBR(item.dataInicio)} a ${formatarDataBR(item.dataFim)}`
                                : `ano ${item.ano ?? "—"}`}
                            </p>
                            <p className="text-[11px] text-brand-50/55">
                              DOE{" "}
                              {formatarDataBR(
                                item.tipo === "gozo" ? item.dataDoeAutorizacao : item.dataDoePecunia,
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => excluir("fruicao", item.id)}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/12 text-brand-50/75 transition hover:border-red-400/50 hover:text-red-200"
                            aria-label="Excluir fruição"
                          >
                            <Icon name="close" className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-jade-400/25 bg-jade-400/8 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-jade-400">
                Regras aplicadas
              </p>
              <ul className="mt-2 space-y-1.5 text-[11.5px] text-brand-50/72">
                <li>• Certidão nasce com {DIAS_CERTIDAO} dias positivos.</li>
                <li>• Gozo vinculado ao servidor + certidão, em {OPCOES_GOZO.join(", ")} dias.</li>
                <li>• Pecúnia fixa em {DIAS_PECUNIA} dias, com ano e DOE opcional.</li>
                <li>• Todo lançamento baixa o saldo; o sistema bloqueia saldo negativo.</li>
                <li>• Exclusão de fruição devolve os dias ao saldo da certidão.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-200/75">
        {rotulo}
      </span>
      {children}
    </label>
  );
}
