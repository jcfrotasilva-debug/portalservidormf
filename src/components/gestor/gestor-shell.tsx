import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { gestorDaSessao } from "@/lib/sessao";
import { perfilRotulo } from "@/lib/gestor";
import { SairGestor } from "@/components/gestor/sair-gestor";

export async function GestorShell({
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
  const gestor = await gestorDaSessao();
  const isAdmin = gestor?.perfil === "admin";

  const LINKS: { href: string; label: string; icon: IconName; somenteAdmin?: boolean }[] = [
    { href: "/gestor", label: "Painel", icon: "chart" },
    { href: "/gestor/importar", label: "Importar planilha", icon: "download" },
    { href: "/gestor/usuarios", label: "Usuários", icon: "users", somenteAdmin: true },
  ];

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700">
                <Icon name="layers" className="h-4.5 w-4.5 text-white" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-[15px] font-extrabold text-ink-950">
                  SERVIDOR<span className="text-gold-600">360</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                  EE Profa. Marlene Frattini · Gestor
                </span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-brand-50 p-1 lg:flex">
              {LINKS.filter((link) => !link.somenteAdmin || isAdmin).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                    ativo === link.href
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                      : "text-ink-850 hover:text-ink-950"
                  }`}
                >
                  <Icon name={link.icon} className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {gestor ? (
              <span className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-brand-50 px-3.5 py-2 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
                  {gestor.nome
                    .split(" ")
                    .slice(0, 2)
                    .map((palavra) => palavra[0])
                    .join("")}
                </span>
                <span className="leading-tight">
                  <span className="block text-[12px] font-semibold text-ink-950">{gestor.nome}</span>
                  <span className="block text-[10px] text-brand-700">{perfilRotulo(gestor.perfil)}</span>
                </span>
              </span>
            ) : null}
            <Link
              href="/servidor"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] font-semibold text-ink-850 transition hover:border-brand-400 hover:text-ink-950"
            >
              <Icon name="fingerprint" className="h-4 w-4" />
              Portal do servidor
            </Link>
            <SairGestor />
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-slate-200 px-4 py-2 lg:hidden">
          {LINKS.filter((link) => !link.somenteAdmin || isAdmin).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[12.5px] font-semibold transition ${
                ativo === link.href
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                  : "text-ink-850 hover:text-ink-950"
              }`}
            >
              <Icon name={link.icon} className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-950 sm:text-3xl">
              {titulo}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13.5px] text-ink-850">{descricao}</p>
          </div>
        </div>
        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}
