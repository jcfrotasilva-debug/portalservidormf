import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";

const LINKS = [
  { href: "/gestor", label: "Painel", icon: "chart" as const },
  { href: "/gestor/importar", label: "Importar planilha", icon: "download" as const },
];

export function GestorShell({
  children,
  ativo,
  titulo,
  descricao,
}: {
  children: ReactNode;
  ativo: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-ink-700">
                <Icon name="layers" className="h-4.5 w-4.5 text-white" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-[15.5px] font-extrabold text-white">
                  SERVIDOR<span className="text-gold-400">360</span>
                </span>
                <span className="block text-[10.5px] uppercase tracking-[0.2em] text-brand-200/70">
                  Painel do gestor
                </span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1 lg:flex">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                    ativo === link.href
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                      : "text-brand-50/70 hover:text-white"
                  }`}
                >
                  <Icon name={link.icon} className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/sandbox"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-jade-400/35 bg-jade-400/10 px-4 py-2.5 text-[12.5px] font-semibold text-jade-400 transition hover:bg-jade-400/18 hover:text-white"
            >
              <Icon name="refresh" className="h-4 w-4" />
              Sandbox ↗
            </a>
            <Link
              href="/servidor"
              className="inline-flex items-center gap-2 rounded-full border border-white/14 px-4 py-2.5 text-[12.5px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
            >
              <Icon name="fingerprint" className="h-4 w-4" />
              Portal do servidor
            </Link>
            <span className="hidden items-center gap-2 rounded-full border border-jade-400/30 bg-jade-400/10 px-3.5 py-2.5 text-[12px] font-semibold text-jade-400 sm:flex">
              <Icon name="shield" className="h-3.5 w-3.5" />
              RH · acesso auditado
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-extrabold tracking-tight text-white sm:text-3xl">
              {titulo}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13.5px] text-brand-50/68">{descricao}</p>
          </div>
        </div>
        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}
