"use client";

import { useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Section } from "@/components/section";

const PERFIS = ["Gestor de RH", "Titular da pasta", "Servidor público", "TI / Sistemas", "Controle interno"];
const PORTES = ["Até 300 vínculos", "301 a 1.500", "1.501 a 5.000", "Mais de 5.000"];

export function FinalCta() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    orgao: "",
    perfil: PERFIS[0],
    porte: PORTES[1],
    mensagem: "",
  });

  const update =
    (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const canSend = form.nome.trim().length > 2 && form.email.includes("@") && form.orgao.trim().length > 2;

  return (
    <Section id="contato">
      <div className="glass relative overflow-hidden rounded-[36px] p-6 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-gold-100 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/5 px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-brand-600">
              <Icon name="sparkles" className="h-3.5 w-3.5 text-gold-600" />
              Próximo passo
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-ink-950 sm:text-[2.4rem]">
              Leve o SERVIDOR 360 para a gestão de pessoas
              <span className="text-gradient"> do seu órgão</span>
            </h2>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-slate-700">
              Preencha os dados e receba um roteiro de implantação com o mapeamento das suas regras
              de vantagens, o plano de carga do cadastro atual e uma apresentação guiada da área
              exclusiva do servidor.
            </p>

            <ul className="mt-8 space-y-3.5">
              {([
                { icon: "file", text: "Roteiro de implantação personalizado em PDF" },
                { icon: "eye", text: "Demonstração guiada dos dois ambientes" },
                { icon: "scale", text: "Checklist de conformidade com LGPD e LAI" },
              ] as { icon: IconName; text: string }[]).map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-[14.5px] text-ink-950">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-jade-400/30 bg-jade-100 text-jade-400">
                    <Icon name={item.icon} className="h-4 w-4" />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-6 border-t border-slate-200 pt-6 text-[12.5px] text-slate-600">
              <span className="flex items-center gap-2">
                <Icon name="mail" className="h-4 w-4 text-brand-600" /> contato@servidor360.gov.br
              </span>
              <span className="flex items-center gap-2">
                <Icon name="building" className="h-4 w-4 text-brand-600" /> Atendimento em todo o
                país
              </span>
            </div>
          </div>

          <div className="glass-soft rounded-3xl p-6 sm:p-7">
            {sent ? (
              <div className="animate-rise flex h-full flex-col items-start justify-center py-6">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-jade-200 text-jade-400">
                  <Icon name="badge-check" className="h-6.5 w-6.5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-extrabold text-ink-950">
                  Solicitação registrada, {form.nome.split(" ")[0]}!
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-700">
                  Sua solicitação entra na esteira de implantação e nossa equipe retorna com o
                roteiro adequado para{" "}
                  <strong className="font-semibold text-ink-950">{form.orgao || "seu órgão"}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-3 text-[13.5px] font-semibold text-ink-950 transition hover:border-brand-500/50"
                >
                  <Icon name="refresh" className="h-4 w-4" /> Preencher novamente
                </button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!canSend) return;
                  setSent(true);
                }}
              >
                <p className="font-display text-[16.5px] font-bold text-ink-950">
                  Solicitar roteiro de implantação
                </p>

                <Field label="Nome completo">
                  <input
                    required
                    value={form.nome}
                    onChange={update("nome")}
                    placeholder="Como devemos chamar você"
                    className="w-full rounded-xl border border-brand-700/16 bg-white/70 px-4 py-3 text-[14px] text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500/70"
                  />
                </Field>

                <Field label="E-mail institucional">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="nome@orgao.gov.br"
                    className="w-full rounded-xl border border-brand-700/16 bg-white/70 px-4 py-3 text-[14px] text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500/70"
                  />
                </Field>

                <Field label="Órgão ou entidade">
                  <input
                    required
                    value={form.orgao}
                    onChange={update("orgao")}
                    placeholder="Prefeitura, secretaria, autarquia..."
                    className="w-full rounded-xl border border-brand-700/16 bg-white/70 px-4 py-3 text-[14px] text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500/70"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Seu perfil">
                    <select
                      value={form.perfil}
                      onChange={update("perfil")}
                      className="w-full rounded-xl border border-brand-700/16 bg-white/70 px-4 py-3 text-[14px] text-ink-950 outline-none transition focus:border-brand-500/70"
                    >
                      {PERFIS.map((perfil) => (
                        <option key={perfil} value={perfil} className="bg-white">
                          {perfil}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Porte do cadastro">
                    <select
                      value={form.porte}
                      onChange={update("porte")}
                      className="w-full rounded-xl border border-brand-700/16 bg-white/70 px-4 py-3 text-[14px] text-ink-950 outline-none transition focus:border-brand-500/70"
                    >
                      {PORTES.map((porte) => (
                        <option key={porte} value={porte} className="bg-white">
                          {porte}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Principal desafio hoje (opcional)">
                  <textarea
                    rows={3}
                    value={form.mensagem}
                    onChange={update("mensagem")}
                    placeholder="Ex.: controlar quinquênios e licenças-prêmio sem planilhas paralelas."
                    className="w-full resize-none rounded-xl border border-brand-700/16 bg-white/70 px-4 py-3 text-[14px] text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500/70"
                  />
                </Field>

                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_24px_60px_-30px_rgba(22,101,144,0.5)] transition hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Enviar solicitação
                  <Icon
                    name="arrow-right"
                    className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1"
                  />
                </button>
                <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-600">
                  <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Os dados preenchidos permanecem somente no seu navegador, conforme a política de privacidade.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-600">
        {label}
      </span>
      {children}
    </label>
  );
}
