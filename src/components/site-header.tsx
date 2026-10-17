"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

const NAV = [
  { label: "Visão geral", href: "#visao" },
  { label: "Dois ambientes", href: "#ambientes" },
  { label: "Vantagens", href: "#vantagens" },
  { label: "Módulos", href: "#modulos" },
  { label: "Segurança", href: "#seguranca" },
  { label: "Perguntas", href: "#faq" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="relative z-50 hidden bg-brand-50/90 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2 text-[12.5px] text-brand-600">
          <p className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-pulse-ring rounded-full bg-jade-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-400" />
            </span>
            Ambiente de apresentação · dados de exemplo, nenhum dado real é processado
          </p>
          <p className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-jade-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-pulse-ring rounded-full bg-jade-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-400" />
              </span>
              Ambiente de produção
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="lock" className="h-3.5 w-3.5" /> Conformidade LGPD
            </span>
          </p>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-200 bg-white/90 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5 sm:px-6">
          <a href="#topo" className="group flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-ink-700 shadow-[0_16px_40px_-18px_rgba(22,101,144,0.45)]">
              <Icon name="layers" className="h-5.5 w-5.5 text-white" strokeWidth={1.7} />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-gold-400 ring-2 ring-ink-950" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[17px] font-extrabold tracking-tight text-white">
                SERVIDOR<span className="text-gold-600">360</span>
              </span>
              <span className="block text-[11px] uppercase tracking-[0.22em] text-brand-600">
                Gestão funcional
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-slate-700 transition hover:bg-brand-50 hover:text-ink-950"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <a
              href="/servidor"
              className="rounded-full border border-brand-200 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-brand-800 transition hover:border-brand-500 hover:text-brand-900"
            >
              Área do servidor
            </a>
            <a
              href="/gestor"
              className="rounded-full border border-brand-500/40 bg-brand-50 px-4 py-2.5 text-[13.5px] font-semibold text-brand-800 transition hover:bg-brand-100 hover:text-brand-900"
            >
              Painel do gestor
            </a>
            <a
              href="#contato"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4.5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_18px_40px_-20px_rgba(22,101,144,0.5)] transition hover:from-brand-400 hover:to-brand-500"
            >
              Solicitar implantação
              <Icon
                name="arrow-right"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Abrir menu"
            aria-expanded={open}
            className="grid h-11 w-11 place-items-center rounded-xl border border-brand-700/16 text-white md:hidden"
          >
            <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-200 bg-white/97 px-5 pb-6 pt-3 backdrop-blur-xl md:hidden">
            <nav className="grid gap-1">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-white transition hover:bg-brand-50"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <a
              href="/servidor"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-sm font-semibold text-white"
            >
              <Icon name="fingerprint" className="h-4 w-4" /> Área do servidor
            </a>
            <a
              href="/gestor"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-sm font-semibold text-white"
            >
              <Icon name="chart" className="h-4 w-4" /> Painel do gestor
            </a>
            <a
              href="#contato"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Solicitar implantação <Icon name="arrow-right" className="h-4 w-4" />
            </a>
          </div>
        )}
      </header>
    </>
  );
}
