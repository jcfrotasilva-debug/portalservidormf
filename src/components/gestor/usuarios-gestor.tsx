"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export type GestorItem = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  perfilRotulo: string;
  ativo: boolean;
  ultimoAcesso: string | null;
  criadoEm: string;
};

export function UsuariosGestor({ gestores, meuId }: { gestores: GestorItem[]; meuId: number }) {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", email: "", senha: "", perfil: "gestor" });
  const [mensagem, setMensagem] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [redefinindo, setRedefinindo] = useState<number | null>(null);
  const [novaSenha, setNovaSenha] = useState("");

  const chamar = async (metodo: "POST" | "PATCH", corpo: Record<string, unknown>) => {
    setOcupado(true);
    setMensagem(null);
    try {
      const resposta = await fetch("/api/gestor/usuarios", {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha na operação.");
      setMensagem({ tom: "ok", texto: "Operação concluída com sucesso." });
      router.refresh();
      return true;
    } catch (error) {
      setMensagem({ tom: "erro", texto: error instanceof Error ? error.message : "Falha inesperada." });
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const criar = async () => {
    const ok = await chamar("POST", form);
    if (ok) setForm({ nome: "", email: "", senha: "", perfil: "gestor" });
  };

  const alterar = async (id: number, corpo: Record<string, unknown>) =>
    chamar("PATCH", { id, ...corpo });

  return (
    <div className="space-y-6">
      <div className="glass-soft rounded-3xl p-5">
        <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink-950">
          <Icon name="users" className="h-4.5 w-4.5 text-brand-600" />
          Criar usuário gestor
        </p>
        <p className="mt-1 text-[12px] text-ink-850">
          Cada pessoa da equipe tem e-mail e senha próprios. Administradores gerenciam usuários;
          gestores operam o cadastro e as vantagens.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              Nome completo
            </span>
            <input
              value={form.nome}
              onChange={(evento) => setForm({ ...form, nome: evento.target.value })}
              placeholder="NOME COMPLETO"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
            />
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              E-mail de acesso
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(evento) => setForm({ ...form, email: evento.target.value })}
              placeholder="nome@escola.gov.br"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              Perfil
            </span>
            <select
              value={form.perfil}
              onChange={(evento) => setForm({ ...form, perfil: evento.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-ink-950 outline-none focus:border-brand-500"
            >
              <option value="gestor" className="bg-white">
                Gestor
              </option>
              <option value="admin" className="bg-white">
                Administrador
              </option>
            </select>
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              Senha inicial (mín. 8)
            </span>
            <input
              type="password"
              value={form.senha}
              onChange={(evento) => setForm({ ...form, senha: evento.target.value })}
              placeholder="SENHA INICIAL"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
            />
          </label>
          <div className="flex items-end lg:col-span-3">
            <button
              type="button"
              onClick={criar}
              disabled={ocupado || form.senha.length < 8 || !form.nome.trim() || !form.email.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-55 sm:w-auto"
            >
              <Icon name="check" className="h-4 w-4" strokeWidth={2.2} />
              Criar usuário
            </button>
          </div>
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
      </div>

      <div className="glass-soft overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <p className="font-display text-[15px] font-bold text-ink-950">
            Usuários do painel
            <span className="ml-2 text-[12px] font-medium text-ink-800">
              {gestores.length} cadastrado(s)
            </span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-brand-50 text-[10.5px] uppercase tracking-[0.12em] text-brand-700">
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3">Último acesso</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {gestores.map((gestor) => (
                <tr key={gestor.id} className="border-t border-slate-200 align-middle">
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-ink-950">
                      {gestor.nome}
                      {gestor.id === meuId ? (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                          você
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11.5px] text-ink-850">{gestor.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={gestor.perfil}
                      onChange={(evento) => alterar(gestor.id, { perfil: evento.target.value })}
                      disabled={ocupado}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-ink-950 outline-none focus:border-brand-500"
                    >
                      <option value="gestor" className="bg-white">
                        Gestor
                      </option>
                      <option value="admin" className="bg-white">
                        Administrador
                      </option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        gestor.ativo ? "bg-jade-100 text-jade-500" : "bg-red-200/70 text-red-400"
                      }`}
                    >
                      {gestor.ativo ? "Ativo" : "Desativado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-ink-850">
                    {gestor.ultimoAcesso ? new Date(gestor.ultimoAcesso).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => alterar(gestor.id, { ativo: !gestor.ativo })}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-850 transition hover:border-brand-400 hover:text-ink-950 disabled:opacity-55"
                      >
                        {gestor.ativo ? "Desativar" : "Ativar"}
                      </button>
                      {redefinindo === gestor.id ? (
                        <span className="flex items-center gap-1.5">
                          <input
                            type="password"
                            value={novaSenha}
                            onChange={(evento) => setNovaSenha(evento.target.value)}
                            placeholder="NOVA SENHA"
                            className="w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-ink-950 outline-none placeholder:text-slate-400 focus:border-brand-500"
                          />
                          <button
                            type="button"
                            disabled={ocupado || novaSenha.length < 8}
                            onClick={async () => {
                              const ok = await alterar(gestor.id, { novaSenha });
                              if (ok) {
                                setRedefinindo(null);
                                setNovaSenha("");
                              }
                            }}
                            className="rounded-lg bg-gradient-to-r from-jade-500 to-jade-400 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-55"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRedefinindo(null);
                              setNovaSenha("");
                            }}
                            className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-ink-850"
                          >
                            ✕
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => setRedefinindo(gestor.id)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-850 transition hover:border-brand-400 hover:text-ink-950 disabled:opacity-55"
                        >
                          Redefinir senha
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="border-t border-slate-200 px-5 py-3 text-[11.5px] text-ink-850">
          O sistema impede desativar ou rebaixar o último administrador ativo, garantindo que
          sempre haja alguém para gerenciar acessos.
        </p>
      </div>
    </div>
  );
}
