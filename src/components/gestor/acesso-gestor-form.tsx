"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function AcessoGestorForm({ modoInicial }: { modoInicial: "login" | "bootstrap" }) {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "bootstrap">(modoInicial);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const entrar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setOcupado(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/gestor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível entrar.");
      router.push("/gestor");
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setOcupado(false);
    }
  };

  const criarPrimeiro = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (senha !== confirmar) {
      setErro("As senhas não conferem.");
      return;
    }
    setOcupado(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/gestor/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível criar o acesso.");
      router.push("/gestor");
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="glass w-full max-w-md rounded-[28px] p-7">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700">
          <Icon name="layers" className="h-4.5 w-4.5 text-white" />
        </span>
        <span className="leading-tight">
          <span className="block font-display text-[15.5px] font-extrabold text-ink-950">
            SERVIDOR<span className="text-gold-600">360</span>
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-700">
            EE Profa. Marlene Frattini
          </span>
        </span>
      </Link>

      <div className="mt-7 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
          <Icon name="shield" className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="font-display text-[19px] font-extrabold text-ink-950">
            {modo === "bootstrap" ? "Configurar primeiro acesso" : "Acesso do gestor"}
          </h1>
          <p className="text-[12px] text-ink-850">
            {modo === "bootstrap"
              ? "Crie sua conta de administrador"
              : "Entre com seu e-mail e senha"}
          </p>
        </div>
      </div>

      {modo === "login" ? (
        <form className="mt-6 space-y-4" onSubmit={entrar}>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              E-mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
              placeholder="seu.email@escola.gov.br"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Senha
            </span>
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
              placeholder="SUA SENHA"
            />
          </label>
          <button
            type="submit"
            disabled={ocupado || !email.trim() || !senha}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3.5 text-[14px] font-semibold text-white disabled:opacity-55"
          >
            <Icon name="key" className="h-4.5 w-4.5" />
            {ocupado ? "Entrando…" : "Entrar no painel"}
          </button>
          <p className="text-[11.5px] leading-relaxed text-ink-850">
            Esqueceu a senha? Solicite a um administrador a redefinição pela tela{" "}
            <strong className="text-ink-950">Usuários</strong> do painel.
          </p>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={criarPrimeiro}>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Seu nome completo
            </span>
            <input
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
              placeholder="NOME COMPLETO"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              E-mail de acesso
            </span>
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
              placeholder="seu.email@escola.gov.br"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                Senha
              </span>
              <input
                type="password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none focus:border-brand-500"
                placeholder="MÍN. 8 CARACTERES"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                Confirmar
              </span>
              <input
                type="password"
                value={confirmar}
                onChange={(evento) => setConfirmar(evento.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none focus:border-brand-500"
                placeholder="REPITA A SENHA"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={ocupado || senha.length < 8 || !nome.trim() || !email.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-5 py-3.5 text-[14px] font-semibold text-white disabled:opacity-55"
          >
            <Icon name="badge-check" className="h-4.5 w-4.5" />
            {ocupado ? "Criando…" : "Criar administrador e entrar"}
          </button>
          <p className="text-[11.5px] leading-relaxed text-ink-850">
            Este primeiro acesso será <strong className="text-ink-950">administrador</strong> e
            poderá criar outros usuários gestores. Depois disso, esta tela de configuração é
            desativada automaticamente.
          </p>
        </form>
      )}

      {erro ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-200/70 px-3.5 py-2.5 text-[12.5px] text-red-400">
          {erro}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-200 pt-5 text-[12px] text-ink-850">
        <Link href="/" className="hover:text-ink-950">
          Página inicial
        </Link>
        <Link href="/servidor" className="hover:text-ink-950">
          Área do servidor
        </Link>
        <Link href="/producao" className="hover:text-ink-950">
          Diagnóstico
        </Link>
      </div>
    </div>
  );
}
