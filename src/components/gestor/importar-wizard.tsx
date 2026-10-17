"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { LABELS_CAMPOS, formatarCpf, formatarDataBR } from "@/lib/ats";
import type { LinhaProcessada, ResultadoProcessamento } from "@/lib/planilha";

type ResumoCommit = {
  novas: number;
  atualizadas: number;
  ignoradas: number;
  comPendencias: number;
  total: number;
};

type ServidorTeste = { id: number; nome: string; cpf: string | null; dtnasc: string | null };

const CORES_STATUS: Record<string, string> = {
  nova: "bg-jade-400/15 text-jade-400",
  atualizar: "bg-brand-500/18 text-brand-200",
  duplicada: "bg-gold-400/15 text-gold-300",
  ignorada: "bg-red-400/12 text-red-200",
};

const ROTULO_STATUS: Record<string, string> = {
  nova: "novo cadastro",
  atualizar: "atualiza cadastro",
  duplicada: "duplicada",
  ignorada: "ignorada",
};

export function ImportarWizard() {
  const [resultado, setResultado] = useState<ResultadoProcessamento | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [commit, setCommit] = useState<ResumoCommit | null>(null);
  const [detalhes, setDetalhes] = useState<string[]>([]);
  const [testes, setTestes] = useState<ServidorTeste[]>([]);
  const [filtro, setFiltro] = useState<"todas" | "nova" | "atualizar" | "duplicada" | "ignorada" | "pendencias">(
    "todas",
  );
  const [linhaAberta, setLinhaAberta] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const enviar = async (arquivo: File) => {
    setCarregando(true);
    setErro(null);
    setCommit(null);
    setResultado(null);
    try {
      const dados = new FormData();
      dados.append("arquivo", arquivo);
      const resposta = await fetch("/api/importacoes/preview", { method: "POST", body: dados });
      const json = (await resposta.json()) as { erro?: string; resultado?: ResultadoProcessamento };
      if (!resposta.ok || !json.resultado) throw new Error(json.erro ?? "Falha ao analisar o arquivo.");
      setResultado(json.resultado);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setCarregando(false);
    }
  };

  const confirmar = async () => {
    if (!resultado) return;
    setGravando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/importacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arquivo: resultado.arquivo,
          formato: resultado.formato,
          celulasVaziasTratadas: resultado.celulasVaziasTratadas,
          linhas: resultado.linhas,
        }),
      });
      const json = (await resposta.json()) as {
        erro?: string;
        resumo?: ResumoCommit;
        detalhes?: string[];
        testes?: ServidorTeste[];
      };
      if (!resposta.ok || !json.resumo) throw new Error(json.erro ?? "Falha ao gravar a importação.");
      setCommit(json.resumo);
      setDetalhes(json.detalhes ?? []);
      setTestes(json.testes ?? []);
      setResultado(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setGravando(false);
    }
  };

  const linhasFiltradas = (resultado?.linhas ?? []).filter((linha) => {
    if (filtro === "todas") return true;
    if (filtro === "pendencias") return linha.pendencias.length > 0;
    return linha.status === filtro;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          onDragOver={(evento) => evento.preventDefault()}
          onDrop={(evento) => {
            evento.preventDefault();
            const arquivo = evento.dataTransfer.files?.[0];
            if (arquivo) enviar(arquivo);
          }}
          className="glass-soft flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/18 p-8 text-center"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/25 to-gold-400/20 text-white">
            <Icon name="download" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-extrabold text-white">
            Solte aqui a planilha de pré-cadastro
          </h2>
          <p className="mt-2 max-w-md text-[13px] text-brand-50/68">
            Colunas esperadas: NOME, CPF, RGCIN, DI, DTNASC, TEL, E-MAIL, CLASSE, CARGO, CATEGORIA,
            JORNADA, LOTACAO, SITUACAO. Aceita <strong className="text-white">.xlsx</strong> e{" "}
            <strong className="text-white">.csv</strong>. Células vazias são tratadas
            automaticamente e as divergências viram pendências do RH.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-[13.5px] font-semibold text-white shadow-[0_20px_50px_-26px_rgba(47,134,246,1)]"
            >
              <Icon name="file" className="h-4 w-4" />
              Selecionar arquivo
            </button>
            <a
              href="/api/importacoes/modelo"
              className="inline-flex items-center gap-2 rounded-xl border border-white/14 px-5 py-3 text-[13.5px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
            >
              <Icon name="download" className="h-4 w-4" />
              Baixar modelo XLSX
            </a>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0];
              if (arquivo) enviar(arquivo);
            }}
          />
          {carregando ? (
            <p className="mt-4 text-[12.5px] text-brand-200">Analisando a planilha…</p>
          ) : null}
          {erro ? (
            <p className="mt-4 rounded-xl border border-red-400/35 bg-red-400/10 px-4 py-2.5 text-[12.5px] text-red-200">
              {erro}
            </p>
          ) : null}
        </div>

        <div className="glass-soft rounded-3xl p-5">
          <p className="font-display text-[15px] font-bold text-white">
            Como o sistema trata células vazias
          </p>
          <ul className="mt-4 space-y-3">
            {[
              "SITUACAO vazia → registrada como “Ativo” e sinalizada para revisão.",
              "CPF vazio ou inválido → linha mantida, deduplicada por nome + lotação.",
              "Datas em qualquer formato (dd/mm/aaaa, aaaa-mm-dd, serial do Excel) são convertidas.",
              "Telefone e e-mail são higienizados; formatos inválidos viram pendência.",
              "Linhas de total, subtotal e rodapé são descartadas automaticamente.",
              "CPF repetido no arquivo → apontado como duplicado e não gravado duas vezes.",
            ].map((texto) => (
              <li key={texto} className="flex gap-2.5 text-[12.5px] leading-relaxed text-brand-50/72">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-jade-400" strokeWidth={2.2} />
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {commit ? (
        <div className="glass rounded-3xl border border-jade-400/25 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-jade-400/16 text-jade-400">
              <Icon name="badge-check" className="h-5.5 w-5.5" />
            </span>
            <div>
              <p className="font-display text-[16.5px] font-extrabold text-white">
                Importação concluída
              </p>
              <p className="text-[12.5px] text-brand-50/68">
                {commit.novas} novos cadastros · {commit.atualizadas} atualizados · {commit.ignoradas}{" "}
                ignorados · {commit.comPendencias} com pendências
              </p>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-[12.5px] font-semibold text-brand-200">
              Ver log da carga ({detalhes.length} registros processados)
            </summary>
            <ul className="mt-3 max-h-60 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-ink-950/60 p-3.5">
              {detalhes.map((linha) => (
                <li key={linha} className="text-[11.5px] text-brand-50/70">
                  {linha}
                </li>
              ))}
            </ul>
          </details>
          {testes.length ? (
            <div className="mt-5 rounded-2xl border border-jade-400/25 bg-jade-400/8 p-4">
              <p className="font-display text-[13.5px] font-bold text-white">
                Testar os servidores importados em outra aba
              </p>
              <p className="mt-1 text-[11.5px] text-brand-50/65">
                O acesso abre a área exclusiva já autenticada — inclusive para cadastros que vieram
                sem CPF na planilha.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {testes.slice(0, 12).map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-ink-950/50 px-3 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold text-white">
                        {item.nome}
                      </span>
                      <span className="block text-[10.5px] text-brand-50/55">
                        {item.cpf ? formatarCpf(item.cpf) : "sem CPF"} ·{" "}
                        {item.dtnasc ? formatarDataBR(item.dtnasc) : "sem nascimento"}
                      </span>
                    </span>
                    <span className="flex gap-1.5">
                      <a
                        href={`/api/sandbox/entrar?servidorId=${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-jade-400/40 bg-jade-400/12 px-2.5 py-1.5 text-[10.5px] font-semibold text-jade-400"
                      >
                        Área ↗
                      </a>
                      <a
                        href={`/gestor/servidores/${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-white/14 px-2.5 py-1.5 text-[10.5px] font-semibold text-brand-50/80"
                      >
                        Ficha ↗
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
              {testes.length > 12 ? (
                <p className="mt-2 text-[10.5px] text-brand-50/50">
                  + {testes.length - 12} servidor(es) importados — todos disponíveis em{" "}
                  <a href="/sandbox" target="_blank" rel="noreferrer" className="font-semibold text-jade-400">
                    /sandbox ↗
                  </a>
                  .
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex gap-3">
            <Link
              href="/gestor"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white"
            >
              <Icon name="chart" className="h-4 w-4" />
              Ver no painel
            </Link>
            <a
              href="/sandbox"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-jade-400/40 bg-jade-400/12 px-4 py-2.5 text-[13px] font-semibold text-jade-400"
            >
              <Icon name="refresh" className="h-4 w-4" />
              Abrir sandbox ↗
            </a>
            <button
              type="button"
              onClick={() => {
                setCommit(null);
                setDetalhes([]);
                setTestes([]);
              }}
              className="rounded-xl border border-white/14 px-4 py-2.5 text-[13px] font-semibold text-brand-50/85"
            >
              Importar outra planilha
            </button>
          </div>
        </div>
      ) : null}

      {resultado ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Linhas lidas", valor: resultado.totalLinhas, tom: "text-white" },
              { label: "Novos cadastros", valor: resultado.resumo.novas, tom: "text-jade-400" },
              { label: "Atualizações", valor: resultado.resumo.atualizar, tom: "text-brand-200" },
              { label: "Duplicadas no arquivo", valor: resultado.resumo.duplicadas, tom: "text-gold-300" },
              { label: "Células vazias tratadas", valor: resultado.celulasVaziasTratadas, tom: "text-gold-400" },
            ].map((card) => (
              <div key={card.label} className="glass-soft rounded-2xl p-4">
                <p className={`font-display text-2xl font-extrabold ${card.tom}`}>{card.valor}</p>
                <p className="mt-1 text-[11.5px] text-brand-50/65">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-soft rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-[15px] font-bold text-white">
                  Pré-visualização · {resultado.arquivo}
                </p>
                <p className="mt-1 text-[11.5px] text-brand-50/58">
                  {resultado.linhasVaziasIgnoradas} linha(s) vazia(s) descartada(s) ·{" "}
                  {resultado.colunasAusentes.length} coluna(s) ausente(s):{" "}
                  {resultado.colunasAusentes.join(", ") || "nenhuma"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["todas", `todas (${resultado.linhas.length})`],
                    ["nova", `novos (${resultado.resumo.novas})`],
                    ["atualizar", `atualiza (${resultado.resumo.atualizar})`],
                    ["duplicada", `dup. (${resultado.resumo.duplicadas})`],
                    ["ignorada", `ignoradas (${resultado.resumo.ignoradas})`],
                    ["pendencias", `pendências (${resultado.resumo.comPendencias})`],
                  ] as const
                ).map(([chave, rotulo]) => (
                  <button
                    key={chave}
                    type="button"
                    onClick={() => setFiltro(chave)}
                    className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition ${
                      filtro === chave
                        ? "border-brand-400/60 bg-brand-500/18 text-white"
                        : "border-white/12 text-brand-50/70 hover:text-white"
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>

            {resultado.avisos.length ? (
              <ul className="mt-3 space-y-1">
                {resultado.avisos.map((aviso) => (
                  <li key={aviso} className="text-[11.5px] text-gold-300">
                    • {aviso}
                  </li>
                ))}
              </ul>
            ) : null}

            <ul className="mt-4 space-y-2.5">
              {linhasFiltradas.map((linha: LinhaProcessada) => (
                <li key={`${linha.linha}-${linha.payload?.nome ?? "x"}`} className="rounded-2xl border border-white/10 bg-white/4">
                  <button
                    type="button"
                    onClick={() => setLinhaAberta(linhaAberta === linha.linha ? null : linha.linha)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-[13.5px] font-bold text-white">
                        <span className="mr-2 text-[11px] font-medium text-brand-50/45">
                          linha {linha.linha}
                        </span>
                        {linha.payload?.nome ?? "(linha sem nome)"}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-brand-50/62">
                        {linha.payload
                          ? `${formatarCpf(linha.payload.cpf)} · ${linha.payload.cargo ?? "cargo vazio"} · ${
                              linha.payload.lotacao ?? "lotação vazia"
                            } · DI ${formatarDataBR(linha.payload.di)}`
                          : linha.motivo}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {linha.camposVazios.length ? (
                        <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10.5px] text-brand-50/72">
                          {linha.camposVazios.length} célula(s) vazia(s)
                        </span>
                      ) : null}
                      {linha.pendencias.length ? (
                        <span className="rounded-full bg-gold-400/15 px-2.5 py-1 text-[10.5px] font-semibold text-gold-300">
                          {linha.pendencias.length} pendência(s)
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${CORES_STATUS[linha.status]}`}
                      >
                        {ROTULO_STATUS[linha.status]}
                      </span>
                      <Icon name="chevron-down" className="h-3.5 w-3.5 text-brand-50/50" />
                    </div>
                  </button>

                  {linhaAberta === linha.linha ? (
                    <div className="grid gap-4 border-t border-white/8 px-4 py-4 lg:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200/75">
                          Como ficará no cadastro
                        </p>
                        <ul className="mt-2.5 space-y-1.5">
                          {linha.payload
                            ? Object.entries(linha.payload).map(([campo, valor]) => (
                                <li key={campo} className="flex justify-between gap-3 text-[11.5px]">
                                  <span className="text-brand-50/55">
                                    {LABELS_CAMPOS[campo] ?? campo}
                                  </span>
                                  <span className="text-right font-medium text-white">
                                    {valor === null || valor === ""
                                      ? "— vazio —"
                                      : campo === "cpf"
                                        ? formatarCpf(valor as string)
                                        : campo === "di" || campo === "dtnasc"
                                          ? formatarDataBR(valor as string)
                                          : (valor as string)}
                                  </span>
                                </li>
                              ))
                            : null}
                        </ul>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200/75">
                          Tratamento aplicado
                        </p>
                        <ul className="mt-2.5 space-y-1.5">
                          {linha.tratamentos.length === 0 ? (
                            <li className="text-[11.5px] text-brand-50/58">
                              Nenhuma célula vazia nesta linha.
                            </li>
                          ) : null}
                          {linha.tratamentos.map((texto) => (
                            <li key={texto} className="text-[11.5px] text-brand-50/72">
                              • {texto}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200/75">
                          Destino
                        </p>
                        <p className="mt-1.5 text-[11.5px] text-brand-50/72">
                          {linha.motivo ?? linha.destino ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200/75">
                          Pendências para o RH
                        </p>
                        <ul className="mt-2.5 space-y-1.5">
                          {linha.pendencias.length === 0 ? (
                            <li className="text-[11.5px] text-jade-400">
                              Linha completa, sem pendências.
                            </li>
                          ) : null}
                          {linha.pendencias.map((pendencia) => (
                            <li key={pendencia} className="text-[11.5px] text-gold-200">
                              • {pendencia}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
              {linhasFiltradas.length === 0 ? (
                <li className="py-6 text-center text-[12.5px] text-brand-50/60">
                  Nenhuma linha neste filtro.
                </li>
              ) : null}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={confirmar}
                disabled={gravando || resultado.resumo.novas + resultado.resumo.atualizar === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-5 py-3 text-[13.5px] font-semibold text-ink-950 transition disabled:opacity-50"
              >
                <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
                {gravando
                  ? "Gravando…"
                  : `Confirmar importação (${resultado.resumo.novas + resultado.resumo.atualizar} linha(s))`}
              </button>
              <button
                type="button"
                onClick={() => setResultado(null)}
                className="rounded-xl border border-white/14 px-4 py-3 text-[13px] font-semibold text-brand-50/85"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
