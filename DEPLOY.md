# SERVIDOR 360 — Guia de publicação (Supabase + Vercel)

Este documento responde objetivamente: **o que já está pronto**, **o que falta** e **como subir com banco no Supabase**.

---

## 0. Status deste deploy (já executado)

| Etapa | Status |
| --- | --- |
| Projeto Supabase criado (`dbjookgwnjzqxbwhhrdw`, região `sa-east-1`) | ✅ |
| Conexão da aplicação validada (pooler 5432, TLS) | ✅ |
| Migração `0000_burly_overlord.sql` aplicada (7 tabelas + 17 índices) | ✅ |
| Histórico Drizzle registrado (`drizzle.__drizzle_migrations`) | ✅ |
| Teste real de escrita: importação → ATS → evolução → licença (certidão/gozo/pecúnia) → portal | ✅ |
| Base limpa (0 registros) pronta para a planilha real | ✅ |
| `PORTAL_SECRET` forte e `GESTOR_SENHA` configurados | ✅ |
| Reset destrutivo do sandbox bloqueado (`SANDBOX_LIBERADO=false`) | ✅ |
| Diagnóstico `/producao` | ✅ 8/8 itens verdes |

> **Ação pendente sua:** trocar a senha do banco no Supabase (a string foi exposta no chat) e, depois, atualizar `DATABASE_URL` no host.

## 1. Situação atual

| Item | Status |
| --- | --- |
| Tela de apresentação | ✅ pronta |
| Importação de planilha XLSX/CSV com tratamento de células vazias | ✅ pronta |
| ATS / quinquênios (vigência + 1825 dias) | ✅ pronto |
| Evolução funcional (Tabelas 1 e 2, 1ª–15ª) | ✅ pronta |
| Licença-prêmio (certidões 90 dias, gozo 15–90, pecúnia 30) | ✅ pronta |
| Área exclusiva do servidor (CPF, nome, atalho de teste) | ✅ pronta |
| Painel do gestor com auditoria | ✅ pronto |
| Schema Drizzle + migração SQL versionada (`drizzle/0000_*.sql`) | ✅ gerado |
| Conexão preparada para Supabase (SSL + pooler) | ✅ pronta |
| Login do gestor (`GESTOR_SENHA`) | ✅ implementado (opcional por env) |
| Diagnóstico de go-live em `/producao` e `/api/producao` | ✅ implementado |
| Migração aplicada em banco Supabase real | ✅ aplicada |
| Envio de e-mail / notificações | ❌ não implementado |
| Upload de documentos digitalizados (Storage) | ❌ não implementado |
| Integração com folha de pagamento | ❌ não implementado |

> Resumo: o **aplicativo está pronto para publicar**, mas a "produção oficial" depende de você criar o projeto no Supabase, aplicar a migração, definir os segredos e limpar a base de demonstração.

---

## 2. Criar o banco no Supabase

1. Acesse <https://supabase.com> → **New project**. Escolha região próxima (ex.: *South America (São Paulo)*) e guarde a senha do usuário `postgres`.
2. Vá em **Project Settings → Database → Connection string → URI**.
3. Use a string do **Pooler** (porta `6543`) para ambientes serverless:

```
postgresql://postgres.<PROJECT_REF>:<SENHA>@aws-0-<REGIAO>.pooler.supabase.com:6543/postgres?sslmode=require
```

Para rodar migrações, use a conexão **direta** (porta `5432`) — o pooler em modo transaction pode não aceitar DDL.

---

## 3. Aplicar o schema (já aplicado)

Para novas migrações neste projeto:

```bash
npx drizzle-kit generate --config=drizzle.supabase.config.ts   # cria o SQL
npx drizzle-kit migrate  --config=drizzle.supabase.config.ts   # aplica no Supabase
```

O `drizzle.config.json` continua apontando para o Postgres local do sandbox.

Alternativa sem CLI: copie o conteúdo de `drizzle/0000_*.sql` e execute no **SQL Editor** do Supabase.

Tabelas criadas: `servidores`, `ats_quinquenios`, `evolucoes`, `licenca_certidoes`, `licenca_fruicoes`, `importacoes`, `auditoria`.

---

## 4. Variáveis de ambiente no host

```env
DATABASE_URL=postgresql://postgres.<REF>:<SENHA>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
DATABASE_POOL_MAX=8
PORTAL_SECRET=<openssl rand -hex 32>
GESTOR_SENHA=<senha administrativa com 8+ caracteres>
SANDBOX_LIBERADO=false
```

> A aplicação remove `sslmode` da URL e configura TLS explicitamente, porque o driver `pg` >= 8.20
> trata `sslmode=require` como `verify-full` e o pooler do Supabase usa cadeia de certificados
> interna. Para exigir validação estrita, defina `DATABASE_SSL_STRICT=true` e uma CA pública.

> Enquanto `GESTOR_SENHA` estiver vazia, `/gestor` fica aberto (modo sandbox). Ao defini-la, o painel passa a exigir login em `/acesso-gestor`.

---

## 5. Deploy

1. Suba o repositório no GitHub.
2. Na Vercel: **New Project → Import** → framework Next.js (build `npm run build`).
3. Cadastre as variáveis de ambiente acima (Production/Preview).
4. Deploy. Valide:
   - `/api/health` → `{ "ok": true }`
   - `/producao` → checklist de go-live
   - `/api/producao` → relatório em JSON (HTTP 503 se houver bloqueio)

---

## 6. Checklist de go-live

- [ ] `DATABASE_URL` do Supabase (pooler 6543) configurada
- [ ] Migração aplicada (7 tabelas)
- [ ] `PORTAL_SECRET` forte configurado
- [ ] `GESTOR_SENHA` definida e login testado
- [ ] `SANDBOX_LIBERADO=false` em produção
- [ ] Base de demonstração removida / planilha real importada
- [ ] Backup e Point-in-Time Recovery ativos no Supabase
- [ ] Revisão LGPD (base legal, retenção, dados de saúde)
- [ ] Domínio próprio + HTTPS
- [ ] `/api/health` e `/producao` verificados após o deploy

---

## 7. Operação

- **Importar planilha:** `/gestor/importar` (aceita `.xlsx` e `.csv`, trata células vazias e mostra pré-visualização).
- **Lançar ATS:** painel → botão *ATS* (projeção = vigência + 1825 dias).
- **Evolução funcional:** painel → *Evolução funcional* (Tabelas 1 e 2, 1ª a 15ª concessão).
- **Licença-prêmio:** painel → *Licença-prêmio* (certidão de 90 dias; gozo 15–90 dias; pecúnia 30 dias; DOE livre).
- **Testar servidor importado:** painel → *Testar ↗* (abre a área exclusiva autenticada em nova aba).
- **Auditoria:** toda alteração grava em `auditoria` com autor, detalhe e data.

---

## 8. Limitações conhecidas

- Sessão do servidor é via cookie assinado (HMAC). Para SSO gov.br é necessário integrar OAuth.
- O acesso do gestor usa senha única de ambiente — para múltiplos gestores, evolua para tabela `usuarios` com perfis.
- Não há upload de arquivos (certidões digitalizadas) — próximo passo natural é Supabase Storage.
- Cálculos de ATS e evolução seguem as regras parametrizadas no código; alterações do estatuto exigem atualização das tabelas em `src/lib`.
