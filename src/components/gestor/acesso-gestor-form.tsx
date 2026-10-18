"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function AcessoGestorForm({ modoInicial }: { modoInicial: "login" | "criar" }) {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "criar" | "trocar">(modoInicial);
  const [senha, setSenha] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const executar = async (acao: "entrar" | "definir") => {
    setOcupado(true);
    setErro(null);
    setOk(null);
    try {
      const url = "/api/gestor/login";
      const corpo =
        acao === "entrar"
          ? { senha }
          : { nova, senhaAtual };
      const resposta = await fetch(url, {
        method: acao === "entrar" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível concluir.");

      if (acao === "entrar") {
        router.push("/gestor");
        router.refresh();
        return;
      }
      setOk(
        modo === "criar"
          ? "Senha criada. Faça login para acessar o painel."
          : "Senha alterada. Faça login novamente.",
      );
      setModo("login");
      setSenhaAtual("");
      setNova("");
      setConfirma("");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setOcupado(false);
    }
  };

  const entrarSubmit = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (senha.trim().length > 0) executar("entrar");
  };

  const definirSubmit = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (nova !== confirma) {
      setErro("A confirmação não confere.");
      return;
    }
    executar("definir");
  };

  return (
    <div className="glass w-full max-w-md rounded-[28px] p-7">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700">
          <Icon name="layers" className="h-4.5 w-4.5 text-white" />
        </span>
        <span className="font-display text-[15.5px] font-extrabold text-ink-950">
          SERVIDOR<span className="text-gold-600">360</span>
        </span>
      </Link>

      <div className="mt-7 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
          <Icon name="shield" className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="font-display text-[19px] font-extrabold text-ink-950">
            {modo === "criar" ? "Criar senha do gestor" : modo === "trocar" ? "Trocar senha" : "Acesso do gestor"}
          </h1>
          <p className="text-[12px] text-ink-800">
            Área restrita de gestão de pessoas · dados protegidos
          </p>
        </div>
      </div>

      {modo !== "criar" ? (
        <form className="mt-6 space-y-4" onSubmit={entrarSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600/90">
              Senha administrativa
            </span>
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
              placeholder="DIGITE A SENHA"
            />
          </label>
          <button
            type="submit"
            disabled={ocupado || senha.trim().length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3.5 text-[14px] font-semibold text-white disabled:opacity-55"
          >
            <Icon name="key" className="h-4.5 w-4.5" />
            {ocupado ? "Verificando…" : modo === "trocar" ? "Entrar com senha atual" : "Entrar no painel"}
          </button>
        </form>
      ) : null}

      <p className="mt-4 border-t border-slate-200 pt-4">
        {modo === "login" ? (
          <button
            type="button"
            onClick={() => {
              setModo("trocar");
              setErro(null);
              setOk(null);
            }}
            className="text-[12px] font-semibold text-brand-700 hover:text-ink-950"
          >
            Trocar senha (requer a senha atual) →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setModo("login");
              setErro(null);
              setOk(null);
            }}
            className="text-[12px] font-semibold text-brand-700 hover:text-ink-950"
          >
            ← Voltar ao login
          </button>
        )}
      </p>

      {(modo === "criar" || modo === "trocar") && (
        <form className="mt-4 space-y-4" onSubmit={definirSubmit}>
          {modo === "trocar" ? (
            <label className="block">
              <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600/90">
                Senha atual
              </span>
              <input
                type="password"
                value={senhaAtual}
                onChange={(evento) => setSenhaAtual(evento.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
                placeholder="SENHA ATUAL"
              />
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600/90">
              Nova senha (mínimo 8 caracteres)
            </span>
            <input
              type="password"
              value={nova}
              onChange={(evento) => setNova(evento.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
              placeholder="NOVA SENHA"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-600/90">
              Confirmar nova senha
            </span>
            <input
              type="password"
              value={confirma}
              onChange={(evento) => setConfirma(evento.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
              placeholder="CONFIRME A NOVA SENHA"
            />
          </label>
          <button
            type="submit"
            disabled={ocupado || nova.length < 8}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-jade-500 to-jade-400 px-5 py-3.5 text-[14px] font-semibold text-white disabled:opacity-55"
          >
            <Icon name="check" className="h-4.5 w-4.5" strokeWidth={2.2} />
            {ocupado ? "Salvando…" : modo === "criar" ? "Criar senha e continuar" : "Salvar nova senha"}
          </button>
          <p className="text-[11px] leading-relaxed text-ink-800">
            A senha fica gravada com hash seguro no banco e vale para todos os ambientes.
            A variável <code className="rounded bg-brand-50 px-1 py-0.5">GESTOR_SENHA</code>, se
            existir no host, sobrepõe a senha do banco.
          </p>
        </form>
      )}

      {erro ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-200/70 px-3.5 py-2.5 text-[12.5px] text-red-400">
          {erro}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 rounded-xl border border-jade-300 bg-jade-100 px-3.5 py-2.5 text-[12.5px] text-jade-500">
          {ok}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-200 pt-5 text-[12px] text-ink-800">
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
