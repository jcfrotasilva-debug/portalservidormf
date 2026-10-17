"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/reveal";

const STATS = [
  { value: 87, suffix: "%", label: "menos tempo para localizar uma informação funcional" },
  { value: 100, suffix: "%", label: "das vantagens calculadas pelo motor de regras" },
  { value: 4, suffix: " min", label: "para emitir uma certidão de tempo de serviço" },
  { value: 0, suffix: "", label: "planilhas paralelas circulando pelo órgão" },
];

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (target === 0) {
      setValue(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}

function Stat({
  value,
  suffix,
  label,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const current = useCountUp(value, active);
  return (
    <div className="relative px-2 py-6 text-center sm:px-4">
      <p className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {current}
        <span className="text-gold-600">{suffix}</span>
      </p>
      <p className="mx-auto mt-3 max-w-[15rem] text-[12.5px] leading-relaxed text-slate-700">
        {label}
      </p>
    </div>
  );
}

export function StatsBand() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-auto max-w-7xl px-5 sm:px-6">
      <Reveal>
        <div className="glass grid divide-y divide-slate-200 rounded-[28px] px-2 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {STATS.map((stat) => (
            <Stat key={stat.label} {...stat} active={active} />
          ))}
        </div>
      </Reveal>
      <p className="mt-3 text-center text-[11.5px] text-slate-600">
        Plataforma de gestão de pessoas · indicadores calculados sobre a base real do órgão
      </p>
    </div>
  );
}
