"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export default function AcessoGestor() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const entrar = async () => {
    setEntrando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/gestor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível entrar.");
      router.push("/gestor");
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-5 py-12">
      <div className="glass w-full max-w-md rounded-[28px] p-7">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-ink-700">
            <Icon name="layers" className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="font-display text-[15.5px] font-extrabold text-white">
            SERVIDOR<span className="text-gold-600">360</span>
          </span>
        </Link>

        <h1 className="mt-6 font-display text-2xl font-extrabold text-white">Acesso do gestor</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
          Área restrita de gestão de pessoas. Informe a senha administrativa configurada no ambiente
          (<code className="rounded bg-brand-50 px-1.5 py-0.5 text-[11.5px] text-brand-800">GESTOR_SENHA</code>).
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (senha.length >= 1) entrar();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
              Senha administrativa
            </span>
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-[14px] text-white outline-none focus:border-brand-500/70"
            />
          </label>

          {erro ? (
            <p className="rounded-xl border border-red-400/40 bg-red-200 px-3.5 py-2.5 text-[12.5px] text-red-400">
              {erro}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={entrando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3.5 text-[14px] font-semibold text-white disabled:opacity-55"
          >
            <Icon name="key" className="h-4.5 w-4.5" />
            {entrando ? "Verificando…" : "Entrar no painel"}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-3 text-[12px] text-slate-600">
          <Link href="/" className="text-jade-400 hover:text-white">
            Página inicial
          </Link>
          <Link href="/servidor" className="hover:text-white">
            Área do servidor
          </Link>
          <Link href="/producao" className="hover:text-white">
            Diagnóstico de produção
          </Link>
        </div>
      </div>
    </div>
  );
}
