import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SandboxPanel } from "@/components/sandbox/sandbox-panel";

export const metadata: Metadata = {
  title: "Sandbox liberado para testes · SERVIDOR 360",
  description:
    "Ambiente de testes aberto da plataforma SERVIDOR 360: credenciais fictícias, roteiro de testes e recriação da base de demonstração.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PaginaSandbox() {
  return (
    <div className="app-shell min-h-screen">
      <header className="border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-ink-700">
              <Icon name="layers" className="h-4.5 w-4.5 text-white" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15.5px] font-extrabold text-white">
                SERVIDOR<span className="text-gold-400">360</span>
              </span>
              <span className="block text-[10.5px] uppercase tracking-[0.2em] text-brand-200/70">
                Sandbox · testes
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/gestor"
              className="rounded-full border border-white/14 px-4 py-2.5 text-[12.5px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
            >
              Painel do gestor
            </Link>
            <Link
              href="/servidor"
              className="rounded-full border border-white/14 px-4 py-2.5 text-[12.5px] font-semibold text-brand-50/85 transition hover:border-brand-400/60 hover:text-white"
            >
              Área do servidor
            </Link>
            <Link
              href="/"
              className="hidden rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[12.5px] font-semibold text-white sm:block"
            >
              Apresentação
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-9 sm:px-6">
        <SandboxPanel />
      </main>
    </div>
  );
}
