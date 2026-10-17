"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  DIAS_QUINQUENIO,
  PERCENTUAL_POR_QUINQUENIO,
  formatarDataBR,
  diasEntre,
  hojeISO,
  projetarProximoQuinquenio,
  tiposQuinquenio,
} from "@/lib/ats";
import type { AtsQuinquenio, ServidorComAts } from "@/lib/tipos";

type Props = {
  aberto: boolean;
  servidores: ServidorComAts[];
  servidorInicial?: number | null;
  onFechar: () => void;
  onAtualizado: () => void;
};

const TIPOS = tiposQuinquenio();

export function AtsModal({ aberto, servidores, servidorInicial, onFechar, onAtualizado }: Props) {
  const [servidorId, setServidorId] = useState<number | "">("");
  const [buscaServidor, setBuscaServidor] = useState("");
  const [tipo, setTipo] = useState<number>(1);
  const [dataVigencia, setDataVigencia] = useState("");
  const [dataDoe, setDataDoe] = useState("");
  const [observacao, setObservacao] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [quinquenios, setQuinquenios] = useState<AtsQuinquenio[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setMensagem(null);
    setServidorId(servidorInicial ?? "");
  }, [aberto, servidorInicial]);

  useEffect(() => {
    if (!aberto || !servidorId) {
      setQuinquenios([]);
      return;
    }
    let ativo = true;
    setCarregando(true);
    fetch(`/api/ats?servidorId=${servidorId}`, { cache: "no-store" })
      .then((resposta) => resposta.json())
      .then((dados: { quinquenios?: AtsQuinquenio[] }) => {
        if (!ativo) return;
        const lista = dados.quinquenios ?? [];
        setQuinquenios(lista);
        const proximo = Math.min(Math.max(...lista.map((item) => item.tipo), 0) + 1, 10);
        setTipo(proximo);
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
          (item.lotacao ?? "").toLowerCase().includes(termo),
      )
      .slice(0, 60);
  }, [buscaServidor, servidores]);

  const projeccao = dataVigencia ? projetarProximoQuinquenio(dataVigencia) : "";
  const diasParaProjeccao = projeccao ? diasEntre(hojeISO(), projeccao) : null;
  const tipoDuplicado = quinquenios.some((item) => item.tipo === tipo && item.id !== editando);
  const percentual = tipo * PERCENTUAL_POR_QUINQUENIO;
  const ordenados = [...quinquenios].sort((a, b) => a.tipo - b.tipo);
  const ultimo = ordenados[ordenados.length - 1];
  const divergencia = Boolean(
    ultimo && projeccao && ultimo.dataProximoProjetada !== projeccao && tipo === ultimo.tipo + 1,
  );

  if (!aberto) return null;

  const limparFormulario = () => {
    setEditando(null);
    setDataVigencia("");
    setDataDoe("");
    setObservacao("");
  };

  const salvar = async () => {
    setMensagem(null);
    if (!servidorId) return setMensagem({ tom: "erro", texto: "Selecione o servidor." });
    if (!dataVigencia) return setMensagem({ tom: "erro", texto: "Informe a DATA DE VIGÊNCIA." });
    if (tipoDuplicado) {
      return setMensagem({
        tom: "erro",
        texto: `${TIPOS[tipo - 1].label} já lançado para este servidor. Edite o registro existente.`,
      });
    }
    if (dataDoe && dataDoe < dataVigencia) {
      return setMensagem({ tom: "erro", texto: "A data do DOE não pode ser anterior à vigência." });
    }

    setOcupado(true);
    try {
      const url = editando ? `/api/ats/${editando}` : "/api/ats";
      const resposta = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servidorId: Number(servidorId),
          tipo,
          dataVigencia,
          dataDoe: dataDoe || null,
          observacao: observacao || null,
        }),
      });
      const dados = (await resposta.json()) as { erro?: string; quinquenios?: AtsQuinquenio[] };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao salvar o ATS.");
      setQuinquenios(dados.quinquenios ?? []);
      setMensagem({
        tom: "ok",
        texto: `${TIPOS[tipo - 1].label} registrado · projeção do próximo: ${formatarDataBR(projeccao)}.`,
      });
      limparFormulario();
      onAtualizado();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  const gerarAutomatico = async () => {
    if (!servidorId) return setMensagem({ tom: "erro", texto: "Selecione o servidor." });
    setOcupado(true);
    setMensagem(null);
    try {
      const resposta = await fetch("/api/ats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servidorId: Number(servidorId), dataDoe: dataDoe || null }),
      });
      const dados = (await resposta.json()) as {
        erro?: string;
        criados?: number[];
        quinquenios?: AtsQuinquenio[];
        base?: string;
      };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha na geração automática.");
      setQuinquenios(dados.quinquenios ?? []);
      setMensagem({
        tom: "ok",
        texto: dados.criados?.length
          ? `Gerados ${dados.criados.length} quinquênio(s) a partir da DI ${formatarDataBR(dados.base)}.`
          : "Nenhum quinquênio novo: os direitos até hoje já estavam lançados.",
      });
      onAtualizado();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  const excluir = async (id: number, rotulo: string) => {
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/ats/${id}`, { method: "DELETE" });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao excluir.");
      setQuinquenios((atual) => atual.filter((item) => item.id !== id));
      setMensagem({ tom: "ok", texto: `${rotulo} excluído.` });
      onAtualizado();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-white/90 px-4 py-8 backdrop-blur-sm">
      <div className="glass w-full max-w-5xl rounded-[28px] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-gold-400/25 text-white ring-1 ring-inset ring-brand-700/12">
              <Icon name="clock" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-white">
                ATS · Adicional por Tempo de Serviço
              </h2>
              <p className="mt-1 text-[12.5px] text-slate-700">
                Quinquênios já obtidos pelo servidor · projeção automática da próxima vigência (
                {DIAS_QUINQUENIO} dias)
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
            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                Servidor
              </span>
              <div className="relative">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-600"
                />
                <input
                  value={buscaServidor}
                  onChange={(evento) => setBuscaServidor(evento.target.value)}
                  placeholder="Filtrar por nome, CPF, cargo ou lotação"
                  className="mb-2 w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-brand-500/70"
                />
                <select
                  value={servidorId}
                  onChange={(evento) => {
                    setServidorId(evento.target.value ? Number(evento.target.value) : "");
                    limparFormulario();
                    setMensagem(null);
                  }}
                  size={6}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 p-2 text-[13px] text-white outline-none focus:border-brand-500/70"
                >
                  <option value="" className="bg-brand-100">
                    — selecione o servidor —
                  </option>
                  {listaFiltrada.map((item) => (
                    <option key={item.id} value={item.id} className="bg-brand-100">
                      {item.nome} · {item.lotacao ?? "sem lotação"} · {item.ats.temAts ? `${item.ats.quantidade}º quinq.` : "sem ATS"}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {servidorSelecionado ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-[15px] font-bold text-white">
                      {servidorSelecionado.nome}
                    </p>
                    <p className="text-[12px] text-slate-700">
                      {servidorSelecionado.cargo ?? "cargo não informado"} ·{" "}
                      {servidorSelecionado.lotacao ?? "lotação não informada"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-brand-600">
                    DI {formatarDataBR(servidorSelecionado.di)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <p className="font-display text-base font-bold text-white">
                      {servidorSelecionado.ats.quantidade}
                    </p>
                    <p className="text-[10.5px] text-slate-600">quinquênios</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <p className="font-display text-base font-bold text-gold-600">
                      +{servidorSelecionado.ats.percentual}%
                    </p>
                    <p className="text-[10.5px] text-slate-600">ATS atual</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <p className="font-display text-base font-bold text-brand-600">
                      {formatarDataBR(servidorSelecionado.ats.proximaProjetada)}
                    </p>
                    <p className="text-[10.5px] text-slate-600">próximo projetado</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={gerarAutomatico}
                  disabled={ocupado}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/35 bg-brand-100 px-4 py-2.5 text-[12.5px] font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-50"
                >
                  <Icon name="sparkles" className="h-4 w-4" />
                  Gerar quinquênios automaticamente pela DI (regra +{DIAS_QUINQUENIO} dias)
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Tipo
                </span>
                <select
                  value={tipo}
                  onChange={(evento) => setTipo(Number(evento.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-[13.5px] text-white outline-none focus:border-brand-500/70"
                >
                  {TIPOS.map((item) => (
                    <option key={item.tipo} value={item.tipo} className="bg-brand-100">
                      {item.label} — {item.percentual}%
                    </option>
                  ))}
                </select>
                {tipoDuplicado ? (
                  <span className="mt-1.5 block text-[11.5px] text-gold-400">
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

              <div className="block">
                <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Projeção do próximo quinquênio
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-gold-600/30 bg-gold-50 px-3.5 py-2.5">
                  <Icon name="trending" className="h-4 w-4 text-gold-600" />
                  <div>
                    <p className="font-display text-[14.5px] font-bold text-white">
                      {projeccao ? formatarDataBR(projeccao) : "informe a vigência"}
                    </p>
                    <p className="text-[10.5px] text-slate-700">
                      {diasParaProjeccao !== null
                        ? `vigência + ${DIAS_QUINQUENIO} dias (${diasParaProjeccao >= 0 ? `${diasParaProjeccao} dias a contar de hoje` : "data já vencida"})`
                        : `cálculo automático: vigência + ${DIAS_QUINQUENIO} dias`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                Observação (opcional)
              </span>
              <input
                value={observacao}
                onChange={(evento) => setObservacao(evento.target.value)}
                placeholder="Ex.: publicação no Diário Oficial nº 1.204, processo 2024/004512"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-brand-500/70"
              />
            </label>

            {divergencia && ultimo ? (
              <p className="rounded-xl border border-gold-600/30 bg-gold-100 px-3.5 py-2.5 text-[12px] text-gold-200">
                Atenção: a projeção lançada para o {TIPOS[ultimo.tipo - 1].label} é{" "}
                {formatarDataBR(ultimo.dataProximoProjetada)}. A nova vigência informada aponta para{" "}
                {formatarDataBR(projeccao)} — verifique a sequência antes de salvar.
              </p>
            ) : null}

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
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-[13.5px] font-semibold text-white shadow-[0_20px_50px_-26px_rgba(22,101,144,0.5)] transition hover:from-brand-400 hover:to-brand-500 disabled:opacity-55"
              >
                <Icon name={editando ? "refresh" : "check"} className="h-4 w-4" />
                {editando ? "Salvar correção" : "Incluir quinquênio"}
              </button>
              {editando ? (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="rounded-xl border border-brand-700/16 px-4 py-3 text-[13px] text-white transition hover:text-white"
                >
                  Cancelar edição
                </button>
              ) : null}
              <span className="text-[12px] text-slate-600">
                {TIPOS[tipo - 1].label} = {percentual}% de ATS
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-[14px] font-bold text-white">
                Quinquênios lançados
              </p>
              <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700">
                {quinquenios.length}/10
              </span>
            </div>

            {carregando ? (
              <p className="mt-4 text-[12.5px] text-slate-600">Carregando…</p>
            ) : !servidorId ? (
              <p className="mt-4 text-[12.5px] text-slate-600">
                Selecione um servidor para ver os quinquênios e a projeção da próxima vigência.
              </p>
            ) : quinquenios.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-brand-700/16 p-4 text-center">
                <p className="text-[12.5px] text-slate-700">
                  Nenhum quinquênio lançado. Use o formulário ao lado ou a geração automática pela
                  DI.
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {ordenados.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-brand-500/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-[13.5px] font-bold text-white">
                          {TIPOS[item.tipo - 1]?.label ?? `${item.tipo}º Quinquênio`}
                          <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-[10.5px] font-semibold text-gold-400">
                            +{item.tipo * PERCENTUAL_POR_QUINQUENIO}%
                          </span>
                        </p>
                        <p className="mt-1 text-[11.5px] text-slate-700">
                          Vigência {formatarDataBR(item.dataVigencia)} · DOE{" "}
                          {formatarDataBR(item.dataDoe)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-brand-600">
                          <Icon name="trending" className="h-3.5 w-3.5" />
                          próximo: {formatarDataBR(item.dataProximoProjetada)}
                        </p>
                        {item.observacao ? (
                          <p className="mt-1 text-[11px] text-slate-600">{item.observacao}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(item.id);
                            setTipo(item.tipo);
                            setDataVigencia(item.dataVigencia);
                            setDataDoe(item.dataDoe ?? "");
                            setObservacao(item.observacao ?? "");
                            setMensagem(null);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-brand-500 hover:text-ink-950"
                          aria-label="Editar"
                        >
                          <Icon name="file" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            excluir(item.id, TIPOS[item.tipo - 1]?.label ?? `${item.tipo}º Quinquênio`)
                          }
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-red-400/40 hover:text-red-400"
                          aria-label="Excluir"
                        >
                          <Icon name="close" className="h-3.5 w-3.5" />
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
  );
}
