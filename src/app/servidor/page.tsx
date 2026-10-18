import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { PortalServidor } from "@/components/portal/portal-servidor";

export const metadata: Metadata = {
  title: "Área exclusiva do servidor · SERVIDOR 360",
  description:
    "Acesse seus dados funcionais, seus quinquênios (ATS) e a projeção da data do próximo direito.",
};

export const dynamic = "force-dynamic";

export default function PaginaServidor() {
  return (
    <div className="app-shell min-h-screen">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-ink-700">
              <Icon name="layers" className="h-4.5 w-4.5 text-white" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15.5px] font-extrabold text-ink-950">
                SERVIDOR<span className="text-gold-600">360</span>
              </span>
              <span className="block text-[10.5px] uppercase tracking-[0.2em] text-brand-600">
                Área do servidor
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/gestor"
              className="rounded-full border border-brand-700/16 px-4 py-2.5 text-[12.5px] font-semibold text-ink-950 transition hover:border-brand-500/50 hover:text-ink-950"
            >
              Sou gestor
            </Link>
            <Link
              href="/"
              className="hidden rounded-full border border-brand-700/16 px-4 py-2.5 text-[12.5px] font-semibold text-ink-950 transition hover:border-brand-500/50 hover:text-ink-950 sm:block"
            >
              Apresentação
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        <PortalServidor />
      </main>
    </div>
  );
}
