"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { formatarCpf } from "@/lib/ats";
import {
  STATUS_COR,
  STATUS_ROTULO,
  extensoesAceitas,
  formatarTamanho,
  type RequerimentoCompleto,
} from "@/lib/requerimentos";

const FILTROS = [
  { chave: "pendentes", rotulo: "Pendentes" },
  { chave: "protocolado", rotulo: "Protocolados" },
  { chave: "em_analise", rotulo: "Em análise" },
  { chave: "deferido", rotulo: "Deferidos" },
  { chave: "indeferido", rotulo: "Indeferidos" },
  { chave: "todos", rotulo: "Todos" },
] as const;

export function RequerimentosGestor() {
  const [lista, setLista] = useState<RequerimentoCompleto[]>([]);
  const [resumo, setResumo] = useState({ total: 0, pendentes: 0, deferidos: 0, indeferidos: 0 });
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["chave"]>("pendentes");
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [aberto, setAberto] = useState<number | null>(null);
  const [parecer, setParecer] = useState("");
  const [mensagem, setMensagem] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const status = filtro === "pendentes" || filtro === "todos" ? "todos" : filtro;
    const resposta = await fetch(`/api/requerimentos?status=${status}`, { cache: "no-store" });
    if (resposta.ok) {
      const dados = (await resposta.json()) as {
        requerimentos?: RequerimentoCompleto[];
        resumo?: typeof resumo;
      };
      let itens = dados.requerimentos ?? [];
      if (filtro === "pendentes") {
        itens = itens.filter((item) => item.status === "protocolado" || item.status === "em_analise");
      }
      setLista(itens);
      if (dados.resumo) setResumo(dados.resumo);
    }
    setCarregando(false);
  }, [filtro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const decidir = async (id: number, status: "em_analise" | "deferido" | "indeferido") => {
    setOcupado(true);
    setMensagem(null);
    try {
      const resposta = await fetch(`/api/requerimentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, parecer }),
      });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao registrar a decisão.");
      setMensagem({
        tom: "ok",
        texto: `Requerimento ${STATUS_ROTULO[status].toLowerCase()} com sucesso.`,
      });
      setParecer("");
      await carregar();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  const anexar = async (id: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setOcupado(true);
    setMensagem(null);
    try {
      const dados = new FormData();
      Array.from(files).forEach((arquivo) => dados.append("anexos", arquivo));
      const resposta = await fetch(`/api/requerimentos/${id}/anexos`, { method: "POST", body: dados });
      const json = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(json.erro ?? "Falha ao anexar.");
      setMensagem({ tom: "ok", texto: "Documento anexado e disponibilizado ao servidor." });
      await carregar();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total de requerimentos", valor: resumo.total, tom: "text-ink-950", icon: "file" as const },
          { label: "Aguardando decisão", valor: resumo.pendentes, tom: "text-gold-600", icon: "bell" as const },
          { label: "Deferidos", valor: resumo.deferidos, tom: "text-jade-500", icon: "badge-check" as const },
          { label: "Indeferidos", valor: resumo.indeferidos, tom: "text-red-400", icon: "close" as const },
        ].map((card) => (
          <div key={card.label} className="glass-soft rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-brand-50 text-brand-600">
                <Icon name={card.icon} className="h-4.5 w-4.5" />
              </span>
              <span className={`font-display text-3xl font-extrabold ${card.tom}`}>{card.valor}</span>
            </div>
            <p className="mt-3 text-[13px] font-semibold text-ink-950">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-soft rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((item) => (
            <button
              key={item.chave}
              type="button"
              onClick={() => setFiltro(item.chave)}
              className={`rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition ${
                filtro === item.chave
                  ? "border-brand-500/50 bg-brand-100 text-ink-950"
                  : "border-slate-200 bg-white text-ink-850 hover:border-brand-400 hover:text-ink-950"
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
        {mensagem ? (
          <p
            className={`mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px] ${
              mensagem.tom === "ok"
                ? "border border-jade-300 bg-jade-100 text-jade-500"
                : "border border-red-300 bg-red-200/70 text-red-400"
            }`}
          >
            {mensagem.texto}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {carregando ? (
          <p className="text-[13px] text-ink-850">Carregando requerimentos…</p>
        ) : null}
        {!carregando && lista.length === 0 ? (
          <div className="glass-soft rounded-2xl p-8 text-center text-[13px] text-ink-850">
            Nenhum requerimento neste filtro.
          </div>
        ) : null}

        {lista.map((item) => {
          const expandido = aberto === item.id;
          return (
            <article key={item.id} className="glass-soft rounded-2xl p-5">
              <button
                type="button"
                onClick={() => {
                  setAberto(expandido ? null : item.id);
                  setParecer(item.parecer ?? "");
                  setMensagem(null);
                }}
                className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[14.5px] font-bold text-ink-950">
                      {item.assunto}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${STATUS_COR[item.status]}`}
                    >
                      {STATUS_ROTULO[item.status]}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12px] text-ink-850">
                    {item.protocolo} · {item.tipo}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-ink-800">
                    {item.servidorNome} · {formatarCpf(item.servidorCpf)}
                    {item.servidorDi ? ` · DI ${item.servidorDi}` : ""} ·{" "}
                    {item.servidorLotacao ?? "sem lotação"}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-right text-[11px] text-ink-800">
                    {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
                    <span className="block">{item.anexos.length} anexo(s)</span>
                  </span>
                  <Icon name="chevron-down" className="h-4 w-4 text-ink-800" />
                </span>
              </button>

              {expandido ? (
                <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                        Pedido do servidor
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-850">
                        {item.descricao}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                        Documentos ({item.anexos.length})
                      </p>
                      {item.anexos.length === 0 ? (
                        <p className="mt-1 text-[12px] text-ink-850">Nenhum documento anexado.</p>
                      ) : (
                        <ul className="mt-1.5 space-y-1.5">
                          {item.anexos.map((anexo) => (
                            <li key={anexo.id} className="flex flex-wrap items-center gap-2">
                              <a
                                href={`/api/requerimentos/anexos/${anexo.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-brand-700 hover:border-brand-400"
                              >
                                <Icon name="download" className="h-3.5 w-3.5" />
                                {anexo.nome}
                              </a>
                              <span className="text-[10.5px] text-ink-800">
                                {formatarTamanho(anexo.tamanho)} ·{" "}
                                {anexo.origem === "gestor" ? "gestão" : "servidor"} · {anexo.autor}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                        Anexar documento (despacho, certidão, portaria)
                      </span>
                      <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={extensoesAceitas()}
                        disabled={ocupado}
                        onChange={(evento) => anexar(item.id, evento.target.files)}
                        className="w-full rounded-lg border border-dashed border-brand-300 bg-white px-3 py-2 text-[11.5px] text-ink-850 file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-brand-800"
                      />
                    </label>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-brand-50 p-4">
                    <p className="font-display text-[13.5px] font-bold text-ink-950">Análise</p>
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                        Parecer / justificativa
                      </span>
                      <textarea
                        rows={5}
                        value={parecer}
                        onChange={(evento) => setParecer(evento.target.value)}
                        placeholder="Fundamente a decisão: base legal, processo, período concedido…"
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[12.5px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
                      />
                    </label>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={ocupado || parecer.trim().length < 5}
                        onClick={() => decidir(item.id, "deferido")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                      >
                        <Icon name="check" className="h-4 w-4" strokeWidth={2.3} />
                        Deferir
                      </button>
                      <button
                        type="button"
                        disabled={ocupado || parecer.trim().length < 5}
                        onClick={() => decidir(item.id, "indeferido")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-200/70 px-4 py-2.5 text-[13px] font-semibold text-red-400 transition hover:bg-red-200 disabled:opacity-50"
                      >
                        <Icon name="close" className="h-4 w-4" strokeWidth={2.3} />
                        Indeferir
                      </button>
                    </div>

                    {item.status === "protocolado" ? (
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => decidir(item.id, "em_analise")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12.5px] font-semibold text-ink-850 transition hover:border-brand-400 hover:text-ink-950 disabled:opacity-50"
                      >
                        <Icon name="clock" className="h-4 w-4" />
                        Marcar como “em análise”
                      </button>
                    ) : null}

                    <p className="text-[11px] leading-relaxed text-ink-800">
                      O parecer e os documentos ficam visíveis para o servidor na área exclusiva, e
                      a decisão é registrada na trilha de auditoria.
                    </p>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
