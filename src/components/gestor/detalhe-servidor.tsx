"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { AtsModal } from "@/components/gestor/ats-modal";
import { EvolucaoModal } from "@/components/gestor/evolucao-modal";
import {
  LABELS_CAMPOS,
  PERCENTUAL_POR_QUINQUENIO,
  SITUACOES,
  formatarCpf,
  formatarDataBR,
  formatarTelefone,
  idade,
  tempoDeServico,
} from "@/lib/ats";
import { rotuloTipoEvolucao } from "@/lib/evolucao";
import { resumirCertidao } from "@/lib/licenca";
import { LicencaModal } from "@/components/gestor/licenca-modal";
import type {
  AtsQuinquenio,
  Evolucao,
  LicencaCertidao,
  LicencaFruicao,
  ResumoAts,
  ResumoEvolucao,
  ResumoLicenca,
  Servidor,
  ServidorComAts,
} from "@/lib/tipos";

type Historico = { id: number; acao: string; detalhe: string | null; autor: string; criadoEm: string };

export function DetalheServidor({
  servidor,
  quinquenios,
  resumo,
  evolucoes,
  resumoEvolucao,
  certidoes,
  fruicoes,
  resumoLicenca,
  historico,
  historicoAts,
}: {
  servidor: Servidor;
  quinquenios: AtsQuinquenio[];
  resumo: ResumoAts;
  evolucoes: Evolucao[];
  resumoEvolucao: ResumoEvolucao;
  certidoes: LicencaCertidao[];
  fruicoes: LicencaFruicao[];
  resumoLicenca: ResumoLicenca;
  historico: Historico[];
  historicoAts: Historico[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [modalEvolucao, setModalEvolucao] = useState(false);
  const [modalLicenca, setModalLicenca] = useState(false);
  const [editar, setEditar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: servidor.nome,
    cpf: servidor.cpf ?? "",
    rgcin: servidor.rgcin ?? "",
    di: servidor.di ?? "",
    dtnasc: servidor.dtnasc ?? "",
    tel: servidor.tel ?? "",
    email: servidor.email ?? "",
    classe: servidor.classe ?? "",
    cargo: servidor.cargo ?? "",
    categoria: servidor.categoria ?? "",
    jornada: servidor.jornada ?? "",
    lotacao: servidor.lotacao ?? "",
    situacao: servidor.situacao,
  });

  const tempo = tempoDeServico(servidor.di);
  const anos = idade(servidor.dtnasc);
  const vazios = (servidor.camposVazios ?? []) as (keyof typeof LABELS_CAMPOS)[];
  const pendentes = servidor.pendencias ?? [];

  const listaParaModal: ServidorComAts[] = [
    { ...servidor, ats: resumo, evolucao: resumoEvolucao, licenca: resumoLicenca },
  ];

  const salvar = async () => {
    setAviso(null);
    const resposta = await fetch(`/api/servidores/${servidor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cpf: form.cpf || null,
        di: form.di || null,
        dtnasc: form.dtnasc || null,
        tel: form.tel || null,
        email: form.email || null,
        rgcin: form.rgcin || null,
        classe: form.classe || null,
        cargo: form.cargo || null,
        categoria: form.categoria || null,
        jornada: form.jornada || null,
        lotacao: form.lotacao || null,
      }),
    });
    const dados = (await resposta.json()) as { erro?: string };
    if (!resposta.ok) {
      setAviso(dados.erro ?? "Não foi possível salvar.");
      return;
    }
    setEditar(false);
    setAviso("Cadastro atualizado e registrado na auditoria.");
    router.refresh();
  };

  const excluir = async () => {
    const resposta = await fetch(`/api/servidores/${servidor.id}`, { method: "DELETE" });
    if (resposta.ok) router.push("/gestor");
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 font-display text-lg font-bold text-white">
              {servidor.nome
                .split(" ")
                .slice(0, 2)
                .map((palavra) => palavra[0])
                .join("")}
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white">{servidor.nome}</h1>
              <p className="mt-1 text-[13px] text-brand-50/68">
                {servidor.cargo ?? "cargo não informado"} · {servidor.lotacao ?? "lotação não informada"}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    servidor.situacao === "Ativo"
                      ? "bg-jade-400/15 text-jade-400"
                      : "bg-white/8 text-brand-50/78"
                  }`}
                >
                  {servidor.situacao}
                </span>
                <span className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] text-brand-50/70">
                  CPF {formatarCpf(servidor.cpf)}
                </span>
                <span className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] text-brand-50/70">
                  origem: {servidor.origem}
                </span>
                {pendentes.length ? (
                  <span className="rounded-full bg-gold-400/15 px-2.5 py-1 text-[11px] font-semibold text-gold-300">
                    {pendentes.length} pendência(s)
                  </span>
                ) : (
                  <span className="rounded-full bg-jade-400/12 px-2.5 py-1 text-[11px] font-semibold text-jade-400">
                    cadastro completo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white"
            >
              <Icon name="clock" className="h-4 w-4" />
              Lançar ATS
            </button>
            <button
              type="button"
              onClick={() => setModalEvolucao(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-4 py-2.5 text-[13px] font-semibold text-ink-950"
            >
              <Icon name="graduation" className="h-4 w-4" />
              Lançar evolução
            </button>
            <button
              type="button"
              onClick={() => setModalLicenca(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-2.5 text-[13px] font-semibold text-ink-950"
            >
              <Icon name="plane" className="h-4 w-4" />
              Licença-prêmio
            </button>
            <button
              type="button"
              onClick={() => setEditar((valor) => !valor)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/14 px-4 py-2.5 text-[13px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
            >
              <Icon name="file" className="h-4 w-4" />
              {editar ? "Fechar edição" : "Editar cadastro"}
            </button>
            <a
              href={`/api/sandbox/entrar?servidorId=${servidor.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-jade-400/40 bg-jade-400/12 px-4 py-2.5 text-[13px] font-semibold text-jade-400 transition hover:bg-jade-400/22"
            >
              <Icon name="fingerprint" className="h-4 w-4" />
              Testar área ↗
            </a>
            <Link
              href="/gestor"
              className="inline-flex items-center gap-2 rounded-xl border border-white/14 px-4 py-2.5 text-[13px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
            >
              Voltar
            </Link>
            <button
              type="button"
              onClick={excluir}
              className="rounded-xl border border-white/14 px-3.5 py-2.5 text-[13px] text-brand-50/70 transition hover:border-red-400/50 hover:text-red-200"
              aria-label="Excluir servidor"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Tempo de serviço",
              valor: tempo ? `${tempo.anos}a ${tempo.meses}m` : "DI não informada",
              detalhe: servidor.di ? `desde ${formatarDataBR(servidor.di)}` : "—",
            },
            {
              label: "ATS acumulado",
              valor: `${resumo.quantidade}º quinquênio`,
              detalhe: `+${resumo.percentual}% (${PERCENTUAL_POR_QUINQUENIO}% por quinquênio)`,
            },
            {
              label: "Próximo quinquênio",
              valor: formatarDataBR(resumo.proximaProjetada),
              detalhe:
                resumo.diasParaProxima !== null
                  ? resumo.diasParaProxima >= 0
                    ? `em ${resumo.diasParaProxima} dias`
                    : "data vencida — lançar"
                  : "sem lançamento de ATS",
            },
            {
              label: "Idade / nascimento",
              valor: anos ? `${anos} anos` : "não informado",
              detalhe: formatarDataBR(servidor.dtnasc),
            },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-ink-950/50 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-50/55">{card.label}</p>
              <p className="mt-1.5 font-display text-[17px] font-extrabold text-white">{card.valor}</p>
              <p className="mt-0.5 text-[11.5px] text-brand-50/58">{card.detalhe}</p>
            </div>
          ))}
        </div>
      </div>

      {aviso ? (
        <p className="rounded-xl border border-jade-400/25 bg-jade-400/10 px-4 py-3 text-[12.5px] text-jade-400">
          {aviso}
        </p>
      ) : null}

      {pendentes.length || vazios.length ? (
        <div className="glass-soft rounded-3xl border border-gold-400/25 p-5">
          <p className="flex items-center gap-2 font-display text-[15px] font-bold text-white">
            <Icon name="bell" className="h-4.5 w-4.5 text-gold-400" />
            Pendências herdadas da planilha
          </p>
          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {pendentes.map((pendencia) => (
              <li key={pendencia} className="text-[12.5px] text-gold-100/85">
                • {pendencia}
              </li>
            ))}
          </ul>
          {vazios.length ? (
            <p className="mt-3 text-[11.5px] text-brand-50/58">
              Campos que vieram vazios na planilha: {vazios.map((campo) => LABELS_CAMPOS[campo] ?? campo).join(", ")}.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-soft rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-[15px] font-bold text-white">Cadastro funcional</p>
            {editar ? (
              <button
                type="button"
                onClick={salvar}
                className="rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-4 py-2.5 text-[12.5px] font-semibold text-ink-950"
              >
                Salvar alterações
              </button>
            ) : null}
          </div>

          {editar ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["nome", "Nome completo", "text"],
                  ["cpf", "CPF", "text"],
                  ["rgcin", "RGCIN", "text"],
                  ["di", "DI (ingresso)", "date"],
                  ["dtnasc", "Data de nascimento", "date"],
                  ["tel", "Telefone", "text"],
                  ["email", "E-mail", "text"],
                  ["classe", "Classe", "text"],
                  ["cargo", "Cargo", "text"],
                  ["categoria", "Categoria", "text"],
                  ["jornada", "Jornada", "text"],
                  ["lotacao", "Lotação", "text"],
                ] as const
              ).map(([campo, rotulo, tipo]) => (
                <label key={campo} className="block">
                  <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-200/75">
                    {rotulo}
                  </span>
                  <input
                    type={tipo}
                    value={form[campo]}
                    onChange={(evento) => setForm({ ...form, [campo]: evento.target.value })}
                    className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none [color-scheme:dark] focus:border-brand-400/70"
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-200/75">
                  Situação
                </span>
                <select
                  value={form.situacao}
                  onChange={(evento) => setForm({ ...form, situacao: evento.target.value })}
                  className="w-full rounded-lg border border-white/12 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white outline-none focus:border-brand-400/70"
                >
                  {SITUACOES.map((item) => (
                    <option key={item} value={item} className="bg-ink-900">
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {(
                [
                  ["CPF", formatarCpf(servidor.cpf)],
                  ["RGCIN", servidor.rgcin ?? "—"],
                  ["DI (ingresso)", formatarDataBR(servidor.di)],
                  ["Data de nascimento", formatarDataBR(servidor.dtnasc)],
                  ["Telefone", formatarTelefone(servidor.tel)],
                  ["E-mail", servidor.email ?? "—"],
                  ["Classe", servidor.classe ?? "—"],
                  ["Cargo", servidor.cargo ?? "—"],
                  ["Categoria", servidor.categoria ?? "—"],
                  ["Jornada", servidor.jornada ?? "—"],
                  ["Lotação", servidor.lotacao ?? "—"],
                  ["Situação", servidor.situacao],
                ] as const
              ).map(([rotulo, valor]) => (
                <div key={rotulo} className="flex items-baseline justify-between gap-3 border-b border-white/8 pb-2">
                  <dt className="text-[11.5px] text-brand-50/55">{rotulo}</dt>
                  <dd className="text-right text-[12.5px] font-medium text-white">{valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-soft rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-bold text-white">
                ATS · quinquênios ({quinquenios.length}/10)
              </p>
              <button
                type="button"
                onClick={() => setModal(true)}
                className="rounded-lg border border-brand-400/40 bg-brand-500/12 px-3 py-1.5 text-[11.5px] font-semibold text-brand-100"
              >
                gerenciar
              </button>
            </div>
            <ul className="mt-4 space-y-2.5">
              {quinquenios.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[12.5px] text-brand-50/65">
                  Nenhum quinquênio lançado. Abra o modal de ATS e inclua os direitos já obtidos —
                  a projeção do próximo será calculada com vigência + 1825 dias.
                </li>
              ) : null}
              {quinquenios.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/10 bg-white/4 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-[13px] font-bold text-white">
                      {item.tipo}º Quinquênio
                    </p>
                    <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[10.5px] font-semibold text-gold-300">
                      +{item.tipo * PERCENTUAL_POR_QUINQUENIO}%
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-brand-50/68">
                    Vigência {formatarDataBR(item.dataVigencia)} · DOE {formatarDataBR(item.dataDoe)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-brand-200">
                    projeção próxima: {formatarDataBR(item.dataProximoProjetada)} (+1825 dias)
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-soft rounded-3xl border border-jade-400/25 p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-bold text-white">
                Evolução funcional · {resumoEvolucao.nivelAtualRotulo}
              </p>
              <button
                type="button"
                onClick={() => setModalEvolucao(true)}
                className="rounded-lg border border-jade-400/40 bg-jade-400/12 px-3 py-1.5 text-[11.5px] font-semibold text-jade-400"
              >
                gerenciar
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-brand-50/60">
              {resumoEvolucao.quadroLabel ?? "Quadro não definido"} ·{" "}
              {resumoEvolucao.temEvolucao
                ? `próxima prevista em ${formatarDataBR(resumoEvolucao.dataProxima)}`
                : "sem concessão publicada — nível inicial I"}
            </p>
            {resumoEvolucao.proximaRegra ? (
              <p className="mt-2 rounded-xl border border-white/10 bg-ink-950/50 px-3 py-2 text-[11px] text-brand-200">
                Próxima faixa: Nível {resumoEvolucao.proximaRegra.origem} →{" "}
                {resumoEvolucao.proximaRegra.destino} · interstício{" "}
                {resumoEvolucao.proximaRegra.intersticioAnos} anos ·{" "}
                {resumoEvolucao.proximaRegra.pontuacaoMinima} pontos
              </p>
            ) : null}
            <ul className="mt-4 space-y-2.5">
              {evolucoes.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[12px] text-brand-50/65">
                  Registre apenas as concessões já publicadas: tipo, vigência, DOE e a data da próxima.
                </li>
              ) : null}
              {evolucoes.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/10 bg-white/4 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-[13px] font-bold text-white">
                      {rotuloTipoEvolucao(item.tipo)} · Nível {item.nivelOrigem} → {item.nivelDestino}
                    </p>
                    <span className="shrink-0 rounded-full bg-jade-400/15 px-2 py-0.5 text-[10.5px] font-semibold text-jade-400">
                      {item.intersticioAnos} anos
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-brand-50/68">
                    Vigência {formatarDataBR(item.dataVigencia)} · DOE {formatarDataBR(item.dataDoe)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-brand-200">
                    próxima: {formatarDataBR(item.dataProxima)} · mín. {item.pontuacaoMinima} pts
                    {item.pontuacaoComprovada !== null ? ` (comprovados ${item.pontuacaoComprovada})` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-soft rounded-3xl border border-gold-400/25 p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-bold text-white">Licença-prêmio</p>
              <button
                type="button"
                onClick={() => setModalLicenca(true)}
                className="rounded-lg border border-gold-400/40 bg-gold-400/12 px-3 py-1.5 text-[11.5px] font-semibold text-gold-300"
              >
                gerenciar
              </button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                { label: "certidões", valor: resumoLicenca.certidoes, tom: "text-white" },
                { label: "saldo", valor: resumoLicenca.saldo, tom: "text-gold-400" },
                { label: "gozo", valor: resumoLicenca.diasGozo, tom: "text-jade-400" },
                { label: "pecúnia", valor: resumoLicenca.diasPecunia, tom: "text-brand-200" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-white/8 bg-ink-950/50 p-2">
                  <p className={`font-display text-[14px] font-bold ${card.tom}`}>{card.valor}</p>
                  <p className="text-[10px] text-brand-50/60">{card.label}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {certidoes.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[12px] text-brand-50/65">
                  Nenhuma certidão cadastrada. Cada certidão concede 90 dias de licença-prêmio.
                </li>
              ) : null}
              {certidoes.map((certidao) => {
                const resumoCertidao = resumirCertidao(
                  certidao,
                  fruicoes.filter((item) => item.certidaoId === certidao.id),
                );
                return (
                  <li key={certidao.id} className="rounded-xl border border-white/10 bg-white/4 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-[12.5px] font-bold text-white">
                        Certidão {certidao.numero}/{certidao.ano}
                      </p>
                      <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[10.5px] font-semibold text-gold-300">
                        saldo {resumoCertidao.saldo} dias
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-brand-50/65">
                      {formatarDataBR(certidao.periodoInicial)} a {formatarDataBR(certidao.periodoFinal)} · DOE{" "}
                      {formatarDataBR(certidao.dataDoe)}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-brand-50/50">
                      {resumoCertidao.diasGozo} dias em gozo · {resumoCertidao.diasPecunia} em pecúnia
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="glass-soft rounded-3xl p-5">
            <p className="font-display text-[15px] font-bold text-white">Trilha de auditoria</p>
            <ul className="mt-4 space-y-3">
              {[...historico, ...historicoAts].slice(0, 10).map((item) => (
                <li key={`${item.id}-${item.criadoEm}`} className="border-l-2 border-brand-400/40 pl-3.5">
                  <p className="text-[12.5px] font-semibold text-white">{item.acao}</p>
                  {item.detalhe ? (
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-brand-50/68">{item.detalhe}</p>
                  ) : null}
                  <p className="mt-0.5 text-[11px] text-brand-50/45">
                    {item.autor} · {new Date(item.criadoEm).toLocaleString("pt-BR")}
                  </p>
                </li>
              ))}
              {historico.length === 0 && historicoAts.length === 0 ? (
                <li className="text-[12.5px] text-brand-50/60">Nenhum evento registrado.</li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <AtsModal
        aberto={modal}
        servidores={listaParaModal}
        servidorInicial={servidor.id}
        onFechar={() => setModal(false)}
        onAtualizado={() => router.refresh()}
      />
      <EvolucaoModal
        aberto={modalEvolucao}
        servidores={listaParaModal}
        servidorInicial={servidor.id}
        onFechar={() => setModalEvolucao(false)}
        onAtualizado={() => router.refresh()}
      />
      <LicencaModal
        aberto={modalLicenca}
        servidores={listaParaModal}
        servidorInicial={servidor.id}
        onFechar={() => setModalLicenca(false)}
        onAtualizado={() => router.refresh()}
      />
    </div>
  );
}
