"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function SairGestor() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  return (
    <button
      type="button"
      disabled={saindo}
      onClick={async () => {
        setSaindo(true);
        await fetch("/api/gestor/login", { method: "DELETE" });
        router.push("/acesso-gestor");
        router.refresh();
      }}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] font-semibold text-ink-850 transition hover:border-red-300 hover:text-red-400 disabled:opacity-55"
    >
      <Icon name="lock" className="h-4 w-4" />
      {saindo ? "Saindo…" : "Sair"}
    </button>
  );
}
