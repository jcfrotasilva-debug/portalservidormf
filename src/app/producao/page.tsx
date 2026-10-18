import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { gerarRelatorio } from "@/lib/producao";

export const metadata: Metadata = {
  title: "Prontidão para produção · SERVIDOR 360",
  description: "Diagnóstico de configuração, banco Supabase, migrações e checklist de go-live.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const CORES: Record<string, string> = {
  ok: "border-jade-400/40 bg-jade-100 text-jade-400",
  atencao: "border-gold-600/35 bg-gold-100 text-gold-400",
  bloqueio: "border-red-400/40 bg-red-200 text-red-400",
};

const ROTULO: Record<string, string> = {
  ok: "pronto",
  atencao: "atenção",
  bloqueio: "bloqueio",
};

const PASSOS_SUPABASE = [
  {
    titulo: "1. Criar o projeto no Supabase",
    texto:
      "Novo projeto → escolha a região mais próxima (ex.: South America East). Guarde a senha do usuário postgres.",
  },
  {
    titulo: "2. Copiar a connection string",
    texto:
      "Project Settings → Database → Connection string → URI. Para a Vercel/serverless use o Pooler (porta 6543) com ?sslmode=require.",
  },
  {
    titulo: "3. Configurar DATABASE_URL",
    texto:
      "Defina DATABASE_URL nas variáveis de ambiente do host (nunca no repositório). A aplicação detecta SSL e pooling automaticamente.",
  },
  {
    titulo: "4. Aplicar as migrações",
    texto:
      "Rode `npx drizzle-kit migrate` na máquina de deploy ou cole o conteúdo de drizzle/*.sql no SQL Editor do Supabase.",
  },
  {
    titulo: "5. Proteger o ambiente",
    texto:
      "Configure GESTOR_SENHA (mín. 8 caracteres) e um PORTAL_SECRET forte.",
  },
  {
    titulo: "6. Validar e monitorar",
    texto:
      "Abra /api/health e /api/producao após o deploy. Publique o domínio e teste a área do servidor com um cadastro real.",
  },
];

const VARIAVEIS = [
  { nome: "DATABASE_URL", obrigatorio: true, texto: "URI do Postgres/Supabase (com ?sslmode=require)." },
  { nome: "PORTAL_SECRET", obrigatorio: true, texto: "Segredo para assinar a sessão do servidor (32+ caracteres)." },
  { nome: "GESTOR_SENHA", obrigatorio: true, texto: "Senha administrativa que protege /gestor." },
  { nome: "DATABASE_POOL_MAX", obrigatorio: false, texto: "Tamanho máximo do pool (padrão 5)." },
];

export default async function PaginaProducao() {
  const relatorio = await gerarRelatorio();
  const pronto = relatorio.resumo.prontoParaProdução;

  return (
    <div className="app-shell min-h-screen">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-ink-700">
              <Icon name="layers" className="h-4.5 w-4.5 text-white" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15.5px] font-extrabold text-ink-950">
                SERVIDOR<span className="text-gold-600">360</span>
              </span>
              <span className="block text-[10.5px] uppercase tracking-[0.2em] text-brand-600">
                Prontidão para produção
              </span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/producao"
              className="rounded-full border border-brand-700/16 px-4 py-2.5 text-[12.5px] font-semibold text-white"
            >
              Atualizar diagnóstico
            </Link>
            <Link
              href="/gestor"
              className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-[12.5px] font-semibold text-white"
            >
              Painel do gestor
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-9 sm:px-6">
        <div
          className={`glass rounded-3xl border p-6 ${
            pronto ? "border-jade-400/40" : "border-gold-600/35"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                  pronto
                    ? "border-jade-400/40 bg-jade-100 text-jade-400"
                    : "border-gold-600/35 bg-gold-100 text-gold-400"
                }`}
              >
                <Icon name={pronto ? "badge-check" : "bell"} className="h-3.5 w-3.5" />
                {pronto ? "Pronto para publicar" : "Ajustes necessários antes do go-live"}
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">
                Diagnóstico do ambiente
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13px] text-slate-700">
                Verificação em tempo real de banco, schema, migrações, segredos e exposição de áreas
                administrativas. Ambiente: <strong className="text-ink-950">{relatorio.ambiente}</strong>.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "prontos", valor: relatorio.resumo.ok, tom: "text-jade-400" },
                { label: "atenção", valor: relatorio.resumo.atencao, tom: "text-gold-400" },
                { label: "bloqueios", valor: relatorio.resumo.bloqueio, tom: "text-red-400" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className={`font-display text-2xl font-extrabold ${card.tom}`}>{card.valor}</p>
                  <p className="text-[10.5px] text-slate-600">{card.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <p>
              <span className="text-slate-600">Provedor:</span> {relatorio.conexao?.provedor ?? "—"}
            </p>
            <p>
              <span className="text-slate-600">Host:</span> {relatorio.conexao?.host ?? "—"}
            </p>
            <p>
              <span className="text-slate-600">Banco:</span> {relatorio.conexao?.database ?? "—"}
            </p>
            <p>
              <span className="text-slate-600">TLS:</span> {relatorio.conexao?.ssl ? "ativo" : "desligado"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {relatorio.itens.map((item) => (
            <div key={item.id} className={`rounded-2xl border p-5 ${CORES[item.status]}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-[14px] font-bold text-ink-950">{item.titulo}</p>
                <span className="shrink-0 rounded-full border border-current px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em]">
                  {ROTULO[item.status]}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-950">{item.detalhe}</p>
              {item.comoResolver ? (
                <p className="mt-2 rounded-xl bg-white px-3 py-2 text-[11.5px] leading-relaxed text-slate-700">
                  <strong className="text-ink-950">Como resolver:</strong> {item.comoResolver}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="glass-soft rounded-3xl p-5">
          <p className="font-display text-[15px] font-bold text-ink-950">Tabelas no banco</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {relatorio.tabelas.map((tabela) => (
              <div
                key={tabela.nome}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12px]"
              >
                <p className="flex items-center gap-1.5 font-semibold text-ink-950">
                  <Icon
                    name={tabela.existe ? "check" : "close"}
                    className={`h-3.5 w-3.5 ${tabela.existe ? "text-jade-400" : "text-red-400"}`}
                    strokeWidth={2.4}
                  />
                  {tabela.nome}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  {tabela.existe ? `${tabela.registros ?? 0} registro(s)` : "não encontrada"}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-slate-600">
            Migrações SQL disponíveis: {relatorio.migracoes.arquivos.join(", ") || "nenhuma"} · Relatório
            em JSON para monitoramento:{" "}
            <a href="/api/producao" target="_blank" rel="noreferrer" className="font-semibold text-brand-600">
              /api/producao ↗
            </a>
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-soft rounded-3xl p-5">
            <p className="font-display text-[15px] font-bold text-ink-950">Passo a passo no Supabase</p>
            <ol className="mt-4 space-y-3">
              {PASSOS_SUPABASE.map((passo) => (
                <li key={passo.titulo} className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <p className="text-[12.5px] font-semibold text-ink-950">{passo.titulo}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">{passo.texto}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-5">
            <div className="glass-soft rounded-3xl p-5">
              <p className="font-display text-[15px] font-bold text-ink-950">Variáveis de ambiente</p>
              <ul className="mt-3 space-y-2">
                {VARIAVEIS.map((variavel) => (
                  <li key={variavel.nome} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="flex items-center gap-2 font-mono text-[11.5px] font-semibold text-brand-800">
                      {variavel.nome}
                      {variavel.obrigatorio ? (
                        <span className="rounded bg-red-200 px-1.5 py-0.5 font-sans text-[9.5px] font-bold uppercase text-red-400">
                          obrigatória
                        </span>
                      ) : (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 font-sans text-[9.5px] font-bold uppercase text-slate-600">
                          opcional
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{variavel.texto}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-soft rounded-3xl border border-gold-600/25 p-5">
              <p className="font-display text-[15px] font-bold text-ink-950">Antes de liberar ao público</p>
              <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-slate-700">
                <li>• Importar a planilha real do órgão na tela de importação.</li>
                <li>• Definir GESTOR_SENHA e PORTAL_SECRET; revisar quem acessa o quê.</li>
                <li>• Liberar o acesso apenas às equipes autorizadas do órgão.</li>
                <li>• Ativar backup/Point-in-Time Recovery no Supabase.</li>
                <li>• Revisar LGPD: base legal, retenção e dados sensíveis de saúde.</li>
                <li>• Configurar domínio próprio e HTTPS (automático na Vercel).</li>
              </ul>
              <p className="mt-3 text-[11px] text-slate-600">
                Guia completo no arquivo <span className="font-mono text-brand-800">DEPLOY.md</span> do
                projeto.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
