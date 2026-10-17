import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Reveal } from "@/components/reveal";

export function Eyebrow({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/5 px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-brand-600">
      <Icon name={icon} className="h-3.5 w-3.5 text-gold-600" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  eyebrowIcon = "sparkles",
  title,
  description,
  align = "left",
  className = "",
}: {
  eyebrow: string;
  eyebrowIcon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const alignment =
    align === "center" ? "mx-auto max-w-3xl text-center items-center" : "max-w-3xl items-start";
  return (
    <Reveal className={`flex flex-col ${alignment} ${className}`}>
      <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>
      <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-[2.6rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[16.5px] leading-relaxed text-slate-700">{description}</p>
      ) : null}
    </Reveal>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative scroll-mt-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-28">{children}</div>
    </section>
  );
}
