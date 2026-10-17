"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { formatarDataBR } from "@/lib/ats";
import {
  QUADROS,
  TABELAS,
  TIPO_EVOLUCAO_MAX,
  formatarRegra,
  projetarProximaEvolucao,
  regraPorNivel,
  regraPorTipo,
  rotuloTipoEvolucao,
  tiposEvolucao,
  type QuadroKey,
} from "@/lib/evolucao";
import type { Evolucao, ServidorComAts } from "@/lib/tipos";

type Props = {
  aberto: boolean;
  servidores: ServidorComAts[];
  servidorInicial?: number | null;
  onFechar: () => void;
  onAtualizado: () => void;
};

const TIPOS = tiposEvolucao();

export function EvolucaoModal({ aberto, servidores, servidorInicial, onFechar, onAtualizado }: Props) {
  const [servidorId, setServidorId] = useState<number | "">("");
  const [buscaServidor, setBuscaServidor] = useState("");
  const [quadro, setQuadro] = useState<QuadroKey>("docente");
  const [tipo, setTipo] = useState(1);
  const [dataVigencia, setDataVigencia] = useState("");
  const [dataDoe, setDataDoe] = useState("");
  const [dataProxima, setDataProxima] = useState("");
  const [proximaManual, setProximaManual] = useState(false);
  const [pontuacao, setPontuacao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [registros, setRegistros] = useState<Evolucao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [verTabela, setVerTabela] = useState<QuadroKey | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setMensagem(null);
    setServidorId(servidorInicial ?? "");
  }, [aberto, servidorInicial]);

  useEffect(() => {
    if (!aberto || !servidorId) {
      setRegistros([]);
      return;
    }
    let ativo = true;
    setCarregando(true);
    fetch(`/api/evolucoes?servidorId=${servidorId}`, { cache: "no-store" })
      .then((resposta) => resposta.json())
      .then((dados: { evolucoes?: Evolucao[] }) => {
        if (!ativo) return;
        const lista = dados.evolucoes ?? [];
        setRegistros(lista);
        const ultimo = lista[lista.length - 1];
        const proximoTipo = Math.min((ultimo?.tipo ?? 0) + 1, TIPO_EVOLUCAO_MAX);
        setTipo(proximoTipo);
        if (ultimo) {
          setQuadro(ultimo.quadro === "suporte" ? "suporte" : "docente");
        }
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

  const regra = regraPorTipo(quadro, tipo);
  const proximaCalculada = dataVigencia ? projetarProximaEvolucao(dataVigencia, regra.intersticioAnos) : "";
  const proximaExibida = proximaManual ? dataProxima : proximaCalculada;
  const duplicado = registros.some((item) => item.tipo === tipo && item.id !== editando);
  const ultimo = registros[registros.length - 1] ?? null;
  const proximaRegraAtual = ultimo ? regraPorNivel(quadro, ultimo.nivelDestino) : TABELAS[quadro][0];
  const pontos = Number(pontuacao.replace(",", "."));
  const atendePontuacao = pontuacao.trim() === "" ? null : pontos >= regra.pontuacaoMinima;
  const proximaVencida = ultimo ? ultimo.dataProxima < new Date().toISOString().slice(0, 10) : false;

  if (!aberto) return null;

  const limpar = () => {
    setEditando(null);
    setDataVigencia("");
    setDataDoe("");
    setDataProxima("");
    setPontuacao("");
    setObservacao("");
    setProximaManual(false);
  };

  const salvar = async () => {
    setMensagem(null);
    if (!servidorId) return setMensagem({ tom: "erro", texto: "Selecione o servidor." });
    if (!dataVigencia) return setMensagem({ tom: "erro", texto: "Informe a DATA DE VIGÊNCIA do ato." });
    if (!proximaExibida) return setMensagem({ tom: "erro", texto: "Informe a data da próxima evolução." });
    if (dataDoe && dataDoe < dataVigencia) {
      return setMensagem({ tom: "erro", texto: "O DOE não pode ser anterior à vigência." });
    }
    if (proximaExibida <= dataVigencia) {
      return setMensagem({ tom: "erro", texto: "A próxima evolução deve ser posterior à vigência." });
    }

    setOcupado(true);
    try {
      const resposta = await fetch(editando ? `/api/evolucoes/${editando}` : "/api/evolucoes", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servidorId: Number(servidorId),
          tipo,
          quadro,
          dataVigencia,
          dataDoe: dataDoe || null,
          dataProxima: proximaManual ? proximaExibida : null,
          pontuacaoComprovada: pontuacao.trim() === "" ? null : Math.round(pontos),
          observacao: observacao || null,
        }),
      });
      const dados = (await resposta.json()) as { erro?: string; evolucoes?: Evolucao[] };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao registrar a evolução.");
      setRegistros(dados.evolucoes ?? []);
      setMensagem({
        tom: "ok",
        texto: `${rotuloTipoEvolucao(tipo)} registrada · Nível ${regra.origem} → ${regra.destino} · próxima em ${formatarDataBR(proximaExibida)}.`,
      });
      limpar();
      onAtualizado();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  const excluir = async (item: Evolucao) => {
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/evolucoes/${item.id}`, { method: "DELETE" });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao excluir.");
      setRegistros((atual) => atual.filter((registro) => registro.id !== item.id));
      setMensagem({ tom: "ok", texto: `${rotuloTipoEvolucao(item.tipo)} excluída.` });
      onAtualizado();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-white/90 px-4 py-8 backdrop-blur-sm">
      <div className="glass w-full max-w-6xl rounded-[28px] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-jade-400/30 to-brand-500/25 text-white ring-1 ring-inset ring-brand-700/12">
              <Icon name="graduation" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-white">Evolução Funcional</h2>
              <p className="mt-1 text-[12.5px] text-slate-700">
                Registro das concessões já publicadas · interstício, pontuação mínima e pesos por fator
                aplicados pela tabela do quadro
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="grid h-10 w-10 place-items-center rounded-xl border border-brand-700/16 text-white transition hover:bg-brand-50 hover:text-white"
            aria-label="Fechar"
          >
            <Icon name="close" className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                Servidor
              </span>
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-600" />
                <input
                  value={buscaServidor}
                  onChange={(evento) => setBuscaServidor(evento.target.value)}
                  placeholder="Filtrar por nome, CPF ou cargo"
                  className="mb-2 w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-brand-500/70"
                />
                <select
                  value={servidorId}
                  onChange={(evento) => {
                    setServidorId(evento.target.value ? Number(evento.target.value) : "");
                    limpar();
                    setMensagem(null);
                  }}
                  size={5}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 p-2 text-[13px] text-white outline-none focus:border-brand-500/70"
                >
                  <option value="" className="bg-brand-100">
                    — selecione o servidor —
                  </option>
                  {listaFiltrada.map((item) => (
                    <option key={item.id} value={item.id} className="bg-brand-100">
                      {item.nome} · {item.cargo ?? "sem cargo"} · Nível {item.evolucao.nivelAtual}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {servidorSelecionado ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-[15px] font-bold text-white">{servidorSelecionado.nome}</p>
                    <p className="text-[12px] text-slate-700">
                      {servidorSelecionado.cargo ?? "cargo não informado"} · {servidorSelecionado.lotacao ?? "lotação não informada"}
                    </p>
                  </div>
                  <span className="rounded-full border border-jade-400/35 bg-jade-100 px-3 py-1 text-[11px] font-semibold text-jade-400">
                    Nível atual {servidorSelecionado.evolucao.nivelAtual}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <p className="font-display text-base font-bold text-white">{servidorSelecionado.evolucao.quantidade}</p>
                    <p className="text-[10.5px] text-slate-600">evoluções</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <p className="font-display text-[13px] font-bold text-brand-600">
                      {formatarDataBR(servidorSelecionado.evolucao.dataProxima)}
                    </p>
                    <p className="text-[10.5px] text-slate-600">próxima</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <p className="font-display text-[13px] font-bold text-gold-600">
                      {proximaRegraAtual ? `Nível ${proximaRegraAtual.destino}` : "teto"}
                    </p>
                    <p className="text-[10.5px] text-slate-600">próximo nível</p>
                  </div>
                </div>
                {proximaVencida ? (
                  <p className="mt-3 rounded-xl border border-gold-600/30 bg-gold-100 px-3 py-2 text-[11.5px] text-gold-200">
                    Interstício cumprido desde {formatarDataBR(ultimo?.dataProxima)} — confira a publicação
                    da próxima concessão.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Quadro / tabela
                </span>
                <select
                  value={quadro}
                  onChange={(evento) => setQuadro(evento.target.value as QuadroKey)}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2.5 text-[12.5px] text-white outline-none focus:border-brand-500/70"
                >
                  <option value="docente" className="bg-brand-100">
                    Tabela 1 · Docentes (PEB-I e PEB-II)
                  </option>
                  <option value="suporte" className="bg-brand-100">
                    Tabela 2 · Suporte Pedagógico
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Tipo
                </span>
                <select
                  value={tipo}
                  onChange={(evento) => setTipo(Number(evento.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-brand-500/70"
                >
                  {TIPOS.map((item) => (
                    <option key={item.tipo} value={item.tipo} className="bg-brand-100">
                      {item.label} · Nível {regraPorTipo(quadro, item.tipo).origem} →{" "}
                      {regraPorTipo(quadro, item.tipo).destino}
                    </option>
                  ))}
                </select>
                {duplicado ? (
                  <span className="mt-1.5 block text-[11px] text-gold-400">
                    Já existe lançamento deste tipo — salvar irá atualizá-lo.
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Data de vigência
                </span>
                <input
                  type="date"
                  value={dataVigencia}
                  onChange={(evento) => setDataVigencia(evento.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-[13.5px] text-white outline-none [color-scheme:dark] focus:border-brand-500/70"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Data do DOE
                </span>
                <input
                  type="date"
                  value={dataDoe}
                  onChange={(evento) => setDataDoe(evento.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-[13.5px] text-white outline-none [color-scheme:dark] focus:border-brand-500/70"
                />
              </label>

              <div className="sm:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                    Data da próxima evolução
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProximaManual((valor) => !valor);
                      setDataProxima(proximaCalculada);
                    }}
                    className="text-[11px] font-semibold text-brand-700 hover:text-ink-950"
                  >
                    {proximaManual ? "usar cálculo automático" : "ajustar manualmente"}
                  </button>
                </div>
                <div className="flex flex-col gap-2.5 rounded-xl border border-gold-600/30 bg-gold-50 px-3.5 py-3 sm:flex-row sm:items-center">
                  <Icon name="trending" className="h-4 w-4 shrink-0 text-gold-600" />
                  {proximaManual ? (
                    <input
                      type="date"
                      value={dataProxima}
                      onChange={(evento) => setDataProxima(evento.target.value)}
                      className="w-full rounded-lg border border-brand-700/16 bg-white/70 px-3 py-2 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-500/70"
                    />
                  ) : (
                    <div>
                      <p className="font-display text-[15px] font-bold text-white">
                        {proximaCalculada ? formatarDataBR(proximaCalculada) : "informe a vigência"}
                      </p>
                      <p className="text-[10.5px] text-slate-700">
                        vigência + interstício de {regra.intersticioAnos} anos
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Pontuação comprovada (opcional · mín. {regra.pontuacaoMinima})
                </span>
                <input
                  value={pontuacao}
                  onChange={(evento) => setPontuacao(evento.target.value)}
                  inputMode="numeric"
                  placeholder={`${regra.pontuacaoMinima}`}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-brand-500/70"
                />
                {atendePontuacao !== null ? (
                  <span className={`mt-1.5 block text-[11px] ${atendePontuacao ? "text-jade-400" : "text-gold-400"}`}>
                    {atendePontuacao
                      ? `Requisito atendido: ${pontos} de ${regra.pontuacaoMinima} pontos.`
                      : `Faltam ${(regra.pontuacaoMinima - pontos).toFixed(0)} pontos para o mínimo exigido.`}
                  </span>
                ) : null}
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                Observação (opcional)
              </span>
              <input
                value={observacao}
                onChange={(evento) => setObservacao(evento.target.value)}
                placeholder="Ex.: DOE nº 2.845, processo 2026/003471, comissão de avaliação"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-brand-500/70"
              />
            </label>

            {mensagem ? (
              <p
                className={`rounded-xl px-3.5 py-2.5 text-[12.5px] ${
                  mensagem.tom === "ok"
                    ? "border border-jade-400/35 bg-jade-100 text-jade-400"
                    : "border border-red-400/40 bg-red-200 text-red-400"
                }`}
              >
                {mensagem.texto}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={salvar}
                disabled={ocupado}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-5 py-3 text-[13.5px] font-semibold text-white shadow-[0_20px_50px_-26px_rgba(30,122,83,0.4)] disabled:opacity-55"
              >
                <Icon name={editando ? "refresh" : "check"} className="h-4 w-4" strokeWidth={2.4} />
                {editando ? "Salvar correção" : "Registrar evolução"}
              </button>
              {editando ? (
                <button
                  type="button"
                  onClick={limpar}
                  className="rounded-xl border border-brand-700/16 px-4 py-3 text-[13px] text-white transition hover:text-white"
                >
                  Cancelar edição
                </button>
              ) : null}
              <span className="text-[12px] text-slate-600">
                {rotuloTipoEvolucao(tipo)} = Nível {regra.origem} → {regra.destino}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-jade-400/30 bg-jade-400/8 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-jade-400">
                Requisitos desta faixa · {QUADROS[quadro].curto}
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="font-display text-base font-bold text-white">{regra.intersticioAnos} anos</p>
                  <p className="text-[10.5px] text-slate-600">interstício</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="font-display text-base font-bold text-gold-600">{regra.pontuacaoMinima}</p>
                  <p className="text-[10.5px] text-slate-600">pontos mínimos</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="font-display text-[13px] font-bold text-brand-600">
                    ×{regra.pesos.atualizacao} · ×{regra.pesos.aperfeicoamento}
                  </p>
                  <p className="text-[10.5px] text-slate-600">atualização · aperfeiçoamento</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="font-display text-[13px] font-bold text-brand-600">×{regra.pesos.producao}</p>
                  <p className="text-[10.5px] text-slate-600">produção profissional</p>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-slate-600">
                {formatarRegra(regra)} — pesos multiplicam os pontos dos certificados dos quadros I e II.
              </p>
              <button
                type="button"
                onClick={() => setVerTabela(verTabela === quadro ? null : quadro)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-700 hover:text-ink-950"
              >
                <Icon name="scale" className="h-3.5 w-3.5" />
                {verTabela === quadro ? "ocultar tabela" : "ver tabela completa do quadro"}
              </button>
            </div>

            {verTabela ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="bg-brand-50 text-[10px] uppercase tracking-[0.1em] text-slate-600">
                      <th className="px-2.5 py-2">Níveis</th>
                      <th className="px-2.5 py-2">Interstício</th>
                      <th className="px-2.5 py-2">Pontos</th>
                      <th className="px-2.5 py-2">Atual.</th>
                      <th className="px-2.5 py-2">Aperf.</th>
                      <th className="px-2.5 py-2">Prod.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TABELAS[verTabela].map((item) => {
                      const ativa = item.origem === regra.origem;
                      return (
                        <tr
                          key={`${item.origem}-${item.destino}`}
                          className={`border-t border-slate-200 ${ativa ? "bg-jade-100 text-ink-950" : "text-slate-700"}`}
                        >
                          <td className="px-2.5 py-1.5 font-semibold">{item.origem} → {item.destino}</td>
                          <td className="px-2.5 py-1.5">{item.intersticioAnos} anos</td>
                          <td className="px-2.5 py-1.5">{item.pontuacaoMinima}</td>
                          <td className="px-2.5 py-1.5">×{item.pesos.atualizacao}</td>
                          <td className="px-2.5 py-1.5">×{item.pesos.aperfeicoamento}</td>
                          <td className="px-2.5 py-1.5">×{item.pesos.producao}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-[14px] font-bold text-white">Evoluções registradas</p>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700">
                  {registros.length}/{TIPO_EVOLUCAO_MAX}
                </span>
              </div>

              {carregando ? (
                <p className="mt-3 text-[12.5px] text-slate-600">Carregando…</p>
              ) : !servidorId ? (
                <p className="mt-3 text-[12.5px] text-slate-600">
                  Selecione o servidor para consultar as concessões publicadas.
                </p>
              ) : registros.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-brand-700/16 p-4 text-center text-[12px] text-slate-700">
                  Nenhuma evolução registrada. O nível inicial é o I; a primeira concessão publicada é a{" "}
                  {rotuloTipoEvolucao(1)}.
                </p>
              ) : (
                <ul className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pr-1">
                  {[...registros].sort((a, b) => a.tipo - b.tipo).map((item) => (
                    <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-display text-[12.5px] font-bold text-white">
                            {rotuloTipoEvolucao(item.tipo)} · Nível {item.nivelOrigem} → {item.nivelDestino}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-700">
                            Vigência {formatarDataBR(item.dataVigencia)} · DOE {formatarDataBR(item.dataDoe)}
                          </p>
                          <p className="text-[11px] text-brand-600">
                            próxima {formatarDataBR(item.dataProxima)} · interstício {item.intersticioAnos} anos
                            {item.pontuacaoComprovada !== null ? ` · ${item.pontuacaoComprovada} pts` : ""}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-slate-600">
                            {item.quadro === "suporte" ? "Suporte Pedagógico" : "Docentes (PEB-I/PEB-II)"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditando(item.id);
                              setTipo(item.tipo);
                              setQuadro(item.quadro === "suporte" ? "suporte" : "docente");
                              setDataVigencia(item.dataVigencia);
                              setDataDoe(item.dataDoe ?? "");
                              setDataProxima(item.dataProxima);
                              setProximaManual(true);
                              setPontuacao(item.pontuacaoComprovada !== null ? String(item.pontuacaoComprovada) : "");
                              setObservacao(item.observacao ?? "");
                              setMensagem(null);
                            }}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-brand-500/40 hover:text-white"
                            aria-label="Editar"
                          >
                            <Icon name="file" className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => excluir(item)}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-red-400/40 hover:text-red-400"
                            aria-label="Excluir"
                          >
                            <Icon name="close" className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
