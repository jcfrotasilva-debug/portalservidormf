"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import {
  MAX_ANEXOS,
  STATUS_COR,
  STATUS_ROTULO,
  TIPOS_REQUERIMENTO,
  extensoesAceitas,
  formatarTamanho,
  statusFinalizado,
  type RequerimentoCompleto,
} from "@/lib/requerimentos";

export function RequerimentosServidor() {
  const [lista, setLista] = useState<RequerimentoCompleto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);

  const [tipo, setTipo] = useState<string>(TIPOS_REQUERIMENTO[0]);
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputExtraRef = useRef<HTMLInputElement | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const resposta = await fetch("/api/requerimentos", { cache: "no-store" });
    if (resposta.ok) {
      const dados = (await resposta.json()) as { requerimentos?: RequerimentoCompleto[] };
      setLista(dados.requerimentos ?? []);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const limpar = () => {
    setTipo(TIPOS_REQUERIMENTO[0]);
    setAssunto("");
    setDescricao("");
    setArquivos([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const enviar = async () => {
    setOcupado(true);
    setMensagem(null);
    try {
      const dados = new FormData();
      dados.append("tipo", tipo);
      dados.append("assunto", assunto);
      dados.append("descricao", descricao);
      arquivos.forEach((arquivo) => dados.append("anexos", arquivo));

      const resposta = await fetch("/api/requerimentos", { method: "POST", body: dados });
      const json = (await resposta.json()) as { erro?: string; protocolo?: string };
      if (!resposta.ok) throw new Error(json.erro ?? "Não foi possível protocolar.");

      setMensagem({
        tom: "ok",
        texto: `Requerimento protocolado sob o número ${json.protocolo}. Acompanhe o andamento abaixo.`,
      });
      limpar();
      setAberto(false);
      await carregar();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
    }
  };

  const anexarMais = async (requerimentoId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setOcupado(true);
    setMensagem(null);
    try {
      const dados = new FormData();
      Array.from(files).forEach((arquivo) => dados.append("anexos", arquivo));
      const resposta = await fetch(`/api/requerimentos/${requerimentoId}/anexos`, {
        method: "POST",
        body: dados,
      });
      const json = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(json.erro ?? "Não foi possível anexar.");
      setMensagem({ tom: "ok", texto: "Documento anexado ao requerimento." });
      await carregar();
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
    } finally {
      setOcupado(false);
      if (inputExtraRef.current) inputExtraRef.current.value = "";
    }
  };

  return (
    <div id="requerimentos" className="glass-soft scroll-mt-24 rounded-3xl border border-brand-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink-950">
            <Icon name="file" className="h-4.5 w-4.5 text-brand-600" />
            Meus requerimentos
          </p>
          <p className="mt-1 text-[12px] text-ink-850">
            Solicite o que você precisa ao setor de gestão de pessoas e acompanhe a decisão.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAberto((valor) => !valor);
            setMensagem(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-[13.5px] font-semibold text-white shadow-[0_18px_40px_-22px_rgba(22,101,144,0.5)]"
        >
          <Icon name={aberto ? "close" : "file"} className="h-4.5 w-4.5" />
          {aberto ? "Fechar" : "Requerimento"}
        </button>
      </div>

      {mensagem ? (
        <p
          className={`mt-4 rounded-xl px-3.5 py-2.5 text-[12.5px] ${
            mensagem.tom === "ok"
              ? "border border-jade-300 bg-jade-100 text-jade-500"
              : "border border-red-300 bg-red-200/70 text-red-400"
          }`}
        >
          {mensagem.texto}
        </p>
      ) : null}

      {aberto ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="font-display text-[14px] font-bold text-ink-950">Novo requerimento</p>

          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              O que você deseja?
            </span>
            <select
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-ink-950 outline-none focus:border-brand-500"
            >
              {TIPOS_REQUERIMENTO.map((item) => (
                <option key={item} value={item} className="bg-white">
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              Assunto (resumo)
            </span>
            <input
              value={assunto}
              onChange={(evento) => setAssunto(evento.target.value)}
              placeholder="Ex.: Gozo de 30 dias da certidão 021/2019"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              Descreva seu pedido
            </span>
            <textarea
              rows={4}
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              placeholder="Explique com detalhes o que você solicita, períodos, datas e qualquer informação que ajude a análise."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              Anexar documentos (opcional · até {MAX_ANEXOS})
            </span>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={extensoesAceitas()}
              onChange={(evento) => setArquivos(Array.from(evento.target.files ?? []))}
              className="w-full rounded-lg border border-dashed border-brand-300 bg-white px-3 py-2.5 text-[12px] text-ink-850 file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-brand-800"
            />
            {arquivos.length ? (
              <ul className="mt-2 space-y-1">
                {arquivos.map((arquivo) => (
                  <li key={arquivo.name} className="text-[11.5px] text-ink-850">
                    • {arquivo.name} ({formatarTamanho(arquivo.size)})
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <button
            type="button"
            onClick={enviar}
            disabled={ocupado || assunto.trim().length < 4 || descricao.trim().length < 15}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-5 py-3 text-[13.5px] font-semibold text-white disabled:opacity-55"
          >
            <Icon name="check" className="h-4.5 w-4.5" strokeWidth={2.2} />
            {ocupado ? "Protocolando…" : "Protocolar requerimento"}
          </button>
        </div>
      ) : null}

      <ul className="mt-4 space-y-2.5">
        {carregando ? (
          <li className="text-[12.5px] text-ink-850">Carregando…</li>
        ) : null}
        {!carregando && lista.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-[12px] text-ink-850">
            Você ainda não abriu nenhum requerimento. Use o botão acima para solicitar.
          </li>
        ) : null}

        {lista.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setExpandido(expandido === item.id ? null : item.id)}
              className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[13.5px] font-bold text-ink-950">
                    {item.assunto}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${STATUS_COR[item.status]}`}
                  >
                    {STATUS_ROTULO[item.status]}
                  </span>
                </span>
                <span className="mt-1 block text-[11.5px] text-ink-850">
                  {item.protocolo} · {item.tipo} ·{" "}
                  {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
                  {item.anexos.length ? ` · ${item.anexos.length} anexo(s)` : ""}
                </span>
              </span>
              <Icon name="chevron-down" className="mt-1 h-4 w-4 shrink-0 text-ink-800" />
            </button>

            {expandido === item.id ? (
              <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                    Seu pedido
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-850">
                    {item.descricao}
                  </p>
                </div>

                {item.parecer ? (
                  <div
                    className={`rounded-xl border p-3 ${
                      item.status === "indeferido"
                        ? "border-red-300 bg-red-200/50"
                        : "border-jade-300 bg-jade-100"
                    }`}
                  >
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-950">
                      Parecer da gestão
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-900">
                      {item.parecer}
                    </p>
                    {item.analisadoPor ? (
                      <p className="mt-1.5 text-[11px] text-ink-800">
                        {item.analisadoPor} ·{" "}
                        {item.analisadoEm
                          ? new Date(item.analisadoEm).toLocaleString("pt-BR")
                          : ""}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                    Documentos
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
                            {anexo.origem === "gestor" ? "enviado pela gestão" : "enviado por você"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {!statusFinalizado(item.status) ? (
                  <label className="block">
                    <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                      Anexar outro documento
                    </span>
                    <input
                      ref={inputExtraRef}
                      type="file"
                      multiple
                      accept={extensoesAceitas()}
                      disabled={ocupado}
                      onChange={(evento) => anexarMais(item.id, evento.target.files)}
                      className="w-full rounded-lg border border-dashed border-brand-300 bg-white px-3 py-2 text-[11.5px] text-ink-850 file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-brand-800"
                    />
                  </label>
                ) : (
                  <p className="text-[11.5px] text-ink-800">
                    Requerimento finalizado — para novos documentos, abra outro requerimento.
                  </p>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
