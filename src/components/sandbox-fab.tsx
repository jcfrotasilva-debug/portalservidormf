"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/** Indicador fixo de que o sandbox está liberado para testes. */
export function SandboxFab() {
  const [aberto, setAberto] = useState(false);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    setOculto(window.sessionStorage.getItem("s360_sandbox_fab") === "oculto");
  }, []);

  if (oculto) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90] print:hidden">
      {aberto ? (
        <div className="glass mb-2 w-64 rounded-2xl p-3.5 shadow-2xl">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-jade-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-pulse-ring rounded-full bg-jade-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-400" />
              </span>
              Sandbox aberto
            </p>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              className="text-brand-50/60 transition hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-brand-50/72">
            Dados fictícios, sem login obrigatório. Tudo liberado para testes.
          </p>
          <a
            href="/sandbox"
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-jade-500 to-jade-400 px-3 py-2 text-[11.5px] font-semibold text-ink-950"
          >
            Painel do sandbox ↗
          </a>
          <div className="mt-2 flex items-center justify-between text-[10.5px] text-brand-50/50">
            <Link href="/gestor" className="hover:text-white">
              Gestor
            </Link>
            <Link href="/gestor/importar" className="hover:text-white">
              Importar
            </Link>
            <Link href="/servidor" className="hover:text-white">
              Servidor
            </Link>
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.setItem("s360_sandbox_fab", "oculto");
                setOculto(true);
              }}
              className="hover:text-white"
            >
              ocultar
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        className="group flex items-center gap-2 rounded-full border border-jade-400/40 bg-ink-900/90 px-3.5 py-2.5 text-[11.5px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(16,185,129,0.9)] backdrop-blur-md transition hover:border-jade-400/80"
        aria-label="Sandbox liberado para testes"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-2.5 w-2.5 animate-pulse-ring rounded-full bg-jade-400" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-jade-400" />
        </span>
        Sandbox liberado
      </button>
    </div>
  );
}
