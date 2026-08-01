# Auditoria do projeto — Personal English Class

> Gerado em 2026-07-28, a partir de leitura direta do código-fonte, do
> schema aplicado no Supabase (via MCP, projeto `wlvjqnoxurcyjrkkmxim`)
> e do histórico Git. Branch auditada: `feature/mvp-controle-aulas`.

---

## 1. Stack e arquitetura

- **Framework:** Next.js 14.2.15 (App Router) + React 18 + TypeScript, `strict: true` ([tsconfig.json](tsconfig.json)).
- **Estilo:** Tailwind CSS 3.4 ([tailwind.config.ts](tailwind.config.ts)) para quase tudo; a landing page (`app/page.tsx`) é a única exceção — usa CSS Module próprio ([app/page.module.css](app/page.module.css)) com paleta OKLCH/DM Sans independente da paleta Tailwind do resto do app.
- **Banco de dados:** Supabase (Postgres 17.6 gerenciado) com Row Level Security em 100% das tabelas. Sem ORM — todas as queries são via `@supabase/supabase-js`/`@supabase/ssr` direto, sem camada de abstração.
- **Autenticação:** Supabase Auth (e-mail/senha).
- **Hospedagem/infra configurada:** [vercel.json](vercel.json) define um cron (`/api/whatsapp/cron` a cada 15 min) — indica intenção de deploy na Vercel, mas **não há evidência de que já exista um deploy real** (sem `.vercel/`, sem menção de projeto Vercel conectado no repo).
- **Dependências:** apenas 5 pacotes de produção ([package.json](package.json)) — `next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`. Nenhuma lib de validação (zod/yup), nenhuma lib de data (date-fns/dayjs), nenhum ORM, nenhum framework de teste.
- **Sem testes automatizados** — nenhum arquivo `*.test.*`/`*.spec.*` no repositório, nenhum runner configurado.

### Estrutura de pastas

```
app/
  page.tsx, page.module.css, FaqAccordion.tsx   -> landing pública
  login/, cadastro/                              -> autenticação
  actions.ts                                     -> logout compartilhado
  acesso-negado/                                 -> bloqueio de role
  aluno/  professor/  gestao/                    -> áreas por papel
    layout.tsx + Sidebar.tsx                     -> shell de cada área
  api/whatsapp/{cron,webhook}/route.ts           -> integração WhatsApp
components/         -> compartilhados entre áreas (Topbar, DashboardShell, CalendarioMensal, WidgetCard...)
lib/supabase/       -> clients (browser, server, admin/service-role)
lib/whatsapp/       -> cliente Meta Cloud API + templates de mensagem
lib/calendario.ts   -> helpers de data compartilhados
supabase/schema.sql + supabase/migrations/0002-0008  -> schema versionado
supabase/scripts/   -> script manual de teste (alternar role)
docs/               -> notas de design (layout de referência de um concorrente)
ROADMAP.md          -> backlog priorizado, já existente no repo
```

A organização segue convenção do App Router (rota = pasta), com `actions.ts` colocado ao lado de cada página que precisa. Não há camada de "services"/"repositories" — os Server Components e Server Actions chamam o Supabase diretamente.

---

## 2. Autenticação e controle de acesso

**Como funciona hoje:**
- Cadastro (`/cadastro`, [app/cadastro/page.tsx](app/cadastro/page.tsx)) usa `supabase.auth.signUp` com `options.data.nome`. Se o projeto Supabase exigir confirmação de e-mail, mostra aviso; senão, redireciona pra `/aluno`.
- Login (`/login`, [app/login/page.tsx](app/login/page.tsx)) usa `signInWithPassword`, busca o `role` em `profiles` e redireciona pra `/${role}`.
- Logout: **existe desde a última sessão de trabalho** via [app/actions.ts](app/actions.ts) (`sair()`), acionado pelo dropdown de perfil no [components/Topbar.tsx](components/Topbar.tsx), presente nas 3 áreas.
- Trigger `handle_new_user` (schema.sql + migration 0004) cria automaticamente uma linha em `profiles` com `role = 'aluno'` sempre que alguém se cadastra, e tenta vincular a um registro pré-existente em `alunos` pelo e-mail.

**Papéis existentes:** `aluno`, `professor`, `gestor` (enum `user_role`). Diferenciados por:
- [middleware.ts](middleware.ts) — mapeia prefixo de rota → roles permitidos (`/aluno`→aluno, `/professor`→professor, `/gestao`→gestor), redireciona pra `/login` se não autenticado ou `/acesso-negado` se o role não bate.
- RLS no Postgres replica a mesma lógica de posse a nível de linha (ex.: `professor_id = auth.uid()`).

**O que está implementado vs. estrutura vazia:**
- ✅ Fluxo completo aluno/professor: signup → login → área correta.
- ⚠️ **Não existe nenhuma UI pra promover um usuário a `professor` ou `gestor`.** A única forma é SQL manual — documentado no [README.md](README.md#L29) e existe um script de conveniência só pra teste: [supabase/scripts/alternar_role_teste.sql](supabase/scripts/alternar_role_teste.sql) (alterna role de um e-mail fixo a cada execução). **Isso é um bloqueador de beta** — nenhum professor real consegue virar professor sozinho.
- ⚠️ Papel `gestor`: dá acesso à área `/gestao`, mas essa área não tem nenhuma ação de gestão de usuários (ver seção 6).
- ✅ Correção de segurança real já aplicada: a policy `profiles_update_own` original permitia que qualquer usuário alterasse a própria `role` via PATCH direto na API (sem `WITH CHECK`). Migration 0007 fechou isso via `GRANT UPDATE` restrito a colunas específicas (`nome, telefone, data_nascimento`) — `role` não é mais alterável por update direto.

---

## 3. Landing page

**O que existe** ([app/page.tsx](app/page.tsx) + [app/page.module.css](app/page.module.css)):
- Header sticky com logo, nav-âncora (Produto/Como funciona/Preços/Dúvidas), CTAs reais (`Entrar`→`/login`, `Começar grátis`→`/cadastro`).
- Hero com headline, subcopy, 2 CTAs, "print" placeholder (imagem ainda não existe, é um bloco listrado com legenda).
- Seção de 6 cards de produto (Alunos e turmas, Atividades e provas, WhatsApp integrado, Financeiro, Vitrine pública, Área do aluno).
- 3 passos ("Como funciona").
- Faixa de stats — **marcada explicitamente como `Exemplo — substituir por métricas reais`** (não são dados de produção).
- Seção de preços (3 planos) — **todos os 3 botões apontam pra `/cadastro`**, decisão consciente já registrada em conversa anterior, já que não existe cobrança de verdade.
- Depoimento — **marcado como `Depoimento de exemplo`**, pessoa fictícia.
- FAQ em acordeão ([app/FaqAccordion.tsx](app/FaqAccordion.tsx), client component).
- CTA final + rodapé (sem links de Termos/Privacidade/Contato — foram removidos de propósito por não existirem páginas reais).

**O que falta:**
- Nenhum formulário de contato/waitlist além do próprio signup.
- Nenhuma página pública de professor (vitrine individual) — o card "Vitrine pública" descreve uma funcionalidade que **não existe no produto ainda** (é aspiracional).
- Sem imagens reais (screenshot do painel, foto de depoimento) — só placeholders.
- **Inconsistência de marca ativa e não commitada:** ver seção 9 — o `<title>` da página ([app/layout.tsx](app/layout.tsx)) e o wordmark do [components/Topbar.tsx](components/Topbar.tsx) dizem **"Personal Class"**, enquanto a própria landing page e o restante do sistema dizem **"Personal English Class"**.

---

## 4. Área do aluno

**Implementado:**
- **Painel** ([app/aluno/page.tsx](app/aluno/page.tsx)) — calendário mensal ([components/CalendarioMensal.tsx](components/CalendarioMensal.tsx)) com as próprias aulas (`aluno_horarios` vinculado via `alunos.profile_id`), modal de detalhe ao clicar numa aula (link, valor, status de pagamento, PIX). Lista de frequência histórica via `presencas` (mas essa tabela está **sempre vazia** — ver seção 7).
- **Meu cadastro** ([app/aluno/cadastro/page.tsx](app/aluno/cadastro/page.tsx)) — edição restrita a nome/telefone/data de nascimento via RPC (`atualizar_dados_pessoais_aluno`, migration 0005); demais campos (e-mail, valor, status de pagamento, link da aula, PIX) somente leitura.
- **Sidebar** ([app/aluno/Sidebar.tsx](app/aluno/Sidebar.tsx)) com 2 itens (Cadastro, Painel), com modo colapsado (só ícones).
- Logout funcional.

**Placeholder/vazio:**
- Se o aluno não tiver sido vinculado a um registro em `alunos` por nenhum professor (`profile_id` nulo), o Painel simplesmente mostra "nenhuma aula"/"nenhum registro de presença" sem uma mensagem explicativa — diferente da tela de Cadastro, que trata esse caso explicitamente ("Seu cadastro ainda não foi vinculado por um professor").
- "Minha frequência" depende inteiramente do fluxo legado `turmas/aulas/presencas`, que está morto na prática (0 linhas, sem UI pra popular) — na prática **essa seção nunca mostra nada** pro fluxo atual (baseado em `aluno_horarios`).

**Não existe:**
- Chat com o professor (existe só do lado do professor, mockado).
- Ver/entregar tarefas.
- Avisos/mural.
- Histórico financeiro (só o status atual, não um extrato).
- Portal de responsável/pais.

---

## 5. Área do professor

É a área mais desenvolvida. **Implementado com dados reais (persistidos no banco):**
- **Painel** ([app/professor/page.tsx](app/professor/page.tsx)) — 3 stat cards (alunos ativos, aulas da semana, pagamentos pendentes), calendário mensal, e 6 widget cards com dados reais: aulas de hoje, próximos vencimentos, agendamentos avulsos próximos, aniversariantes do mês. Os widgets "Tarefas" e "Avisos" são só teaser (link "Ver tudo"), porque essas telas ainda não têm tabela.
- **Alunos** ([app/professor/alunos/page.tsx](app/professor/alunos/page.tsx) + [\[id\]/page.tsx](app/professor/alunos/%5Bid%5D/page.tsx)) — CRUD completo: nome, e-mail, telefone, nascimento, link de aula, valor, status de pagamento, dia de vencimento, PIX copia-e-cola, ativo/inativo. Busca e filtro por status. Ficha do aluno com relatório (aulas dadas/concluídas/canceladas/taxa), horários agendados, marcar aula como concluída com conteúdo/exercício.
- **Agendamentos avulsos** ([app/professor/agendamentos/page.tsx](app/professor/agendamentos/page.tsx)) — teste de proficiência/aula experimental/outro, sem exigir cadastro prévio.
- **Frequência** ([app/professor/frequencia/page.tsx](app/professor/frequencia/page.tsx)) — tabela agregada real por aluno (aulas/concluídas/canceladas/%).
- **WhatsApp** ([app/professor/whatsapp/page.tsx](app/professor/whatsapp/page.tsx)) — liga/desliga automação + log de mensagens reais. Ver seção "integrações" abaixo pro estado de configuração.
- **Cadastro pessoal** — nome/telefone/nascimento editáveis, e-mail/papel somente leitura.
- **Calendário letivo** ([app/professor/calendario-letivo/page.tsx](app/professor/calendario-letivo/page.tsx)) — feriados nacionais de 2026 reais (calculados via algoritmo de Páscoa, não são fake).

**Pela metade (mockado, sem persistência):**
- **Tarefas** ([app/professor/tarefas/](app/professor/tarefas/)) — UI completa e funcional, mas roda 100% em `useState` no client; usa nomes de alunos reais, mas nenhuma tarefa é salva no banco. Sinalizado com [components/BadgePrototipo.tsx](components/BadgePrototipo.tsx) na tela.
- **Chat** ([app/professor/chat/](app/professor/chat/)) — mesma situação: conversa por aluno real, mensagens só em memória.
- **Avisos** ([app/professor/avisos/](app/professor/avisos/)) — mesma situação.
- **Provas** ([app/professor/provas/page.tsx](app/professor/provas/page.tsx)) — só uma tela "Em breve", nenhuma funcionalidade.

**O que falta:**
- Nenhuma tabela real para Tarefas/Chat/Avisos/Provas (roadmap Fase 1/2 já documenta os passos, não implementado).
- Fluxo de "Nova aula"/"Chamada" no Painel (linhas 365-414 de `app/professor/page.tsx`) depende do fluxo legado `turmas` — **inacessível na prática** porque não existe nenhuma tela pra criar uma turma (nem aqui, nem em gestão). Só aparece se uma `turma` for inserida manualmente via SQL.
- Sem exportação/relatório em PDF ou CSV.
- Sem página pública/vitrine do professor (card da landing "Vitrine pública" não tem contraparte real).

---

## 6. Área de gestão da escola

**O que existe** ([app/gestao/page.tsx](app/gestao/page.tsx)):
- 3 stat cards (turmas, professores, alunos) — contagens reais via `count` no Postgres.
- Tabela de turmas (nome, professor responsável, nº de alunos matriculados) — dados reais, mas a tabela `turmas` está vazia em produção (0 linhas), então hoje renderiza "Nenhuma turma cadastrada."
- Sidebar ([app/gestao/Sidebar.tsx](app/gestao/Sidebar.tsx)) com 4 itens: Visão geral, Turmas, Professores, Alunos — **os 4 itens apontam pra `/gestao`** (mesma página); Turmas/Professores/Alunos não são rotas próprias, são só labels de navegação sem destino real ainda.

**O que falta (é a área menos desenvolvida do sistema):**
- Nenhuma forma de **promover um usuário a professor/gestor** pela UI — é o gap mais crítico dessa área, dado que hoje só existe via SQL manual.
- Nenhum CRUD de turmas, matrículas, ou vínculo professor↔turma.
- Nenhuma listagem/gestão de alunos ou professores individual (só a contagem agregada).
- Nenhum relatório financeiro consolidado (ex.: soma de `valor` de todos os alunos por professor).
- Sem gestão de múltiplas "escolas"/tenants — isso é esperado, é Fase 4 do [ROADMAP.md](ROADMAP.md), não Fase 1.

---

## 7. Banco de dados

### Tabelas existentes (confirmado no Postgres real via MCP, não só nos arquivos `.sql`)

| Tabela | Linhas hoje | Papel |
|---|---|---|
| `profiles` | 2 | Perfil de todo usuário autenticado (estende `auth.users`). |
| `turmas` | 0 | Fluxo legado de turma/grupo (schema inicial). |
| `matriculas` | 0 | Aluno↔turma (fluxo legado). |
| `aulas` | 0 | Aula de uma turma (fluxo legado). |
| `presencas` | 0 | Presença aluno↔aula (fluxo legado). |
| `alunos` | 2 | Cadastro do aluno feito pelo professor (fluxo atual, 1:1 professor↔aluno). |
| `aluno_horarios` | 3 | Aulas agendadas de um aluno (fluxo atual). |
| `agendamentos_avulsos` | 0 | Compromissos pontuais (teste, experimental). |
| `whatsapp_mensagens` | 0 | Fila/log de envios do WhatsApp. |

### Relacionamentos-chave
- `profiles.id` → `auth.users.id` (1:1, é a extensão do usuário Supabase Auth).
- `alunos.professor_id` → `profiles.id` (quem cadastrou).
- `alunos.profile_id` → `profiles.id` (login do próprio aluno, nullable, ligado automaticamente por e-mail via trigger `link_aluno_por_email`, migration 0004).
- `aluno_horarios.aluno_id` → `alunos.id`.
- `agendamentos_avulsos.professor_id` / `whatsapp_mensagens.*` → `profiles`/`alunos`/`aluno_horarios`.
- O fluxo legado (`turmas`/`matriculas`/`aulas`/`presencas`) é **paralelo e desconectado** do fluxo atual (`alunos`/`aluno_horarios`) — não há nenhuma FK entre os dois mundos.

### Inconsistências / modelagem incompleta
1. **Dois modelos de "aluno" coexistindo sem unificação:** `profiles` (role=aluno, login) e `alunos` (cadastro financeiro/agenda feito pelo professor) são entidades separadas, ligadas só opcionalmente por `profile_id`. Um aluno pode ter login e nunca ter sido cadastrado por um professor (painel vazio), ou ser cadastrado por um professor e nunca ter feito login (sem `profile_id`, não aparece na conta dele). Não há nenhuma tela pra o professor *convidar* um aluno já cadastrado a criar login.
2. **Fluxo legado morto:** `turmas`, `matriculas`, `aulas`, `presencas` existem no schema, têm RLS, mas **não têm nenhuma UI de criação** — são alcançáveis só via SQL direto. Isso é dívida de schema: ocupam espaço conceitual, aparecem na seção "Minha frequência" do aluno (sempre vazia) e no bloco condicional "Nova aula"/"Chamada" do painel do professor (também inacessível).
3. **`whatsapp_mensagens` não tem policy de INSERT/UPDATE pra `authenticated`** (só SELECT) — de propósito, só o cron/webhook com service role escrevem. Correto, mas quer dizer que não existe nenhuma forma de reenviar uma mensagem falhada pela UI.
4. **Falta de índices em FK** — 9 foreign keys sem índice de cobertura (ver seção 9), incluindo `alunos.professor_id`, que é literalmente o filtro mais usado do sistema.
5. **Nenhuma tabela para**: tarefas, mensagens de chat, avisos, provas — as 3 primeiras já têm UI (mockada) esperando por elas.

---

## 8. Gaps críticos para um MVP de beta

Critério do usuário: professor consegue se cadastrar, configurar página pública, receber agendamento de aluno, cobrar, e acompanhar aulas.

### 🔴 Bloqueadores (sem isso o fluxo essencial não fecha)

1. **Não existe forma de um usuário virar `professor` sozinho.** Hoje é 100% manual via SQL Editor. Pra qualquer beta tester real usar o produto como professor, alguém (você) precisa entrar no Supabase e rodar UPDATE manualmente pra cada um. Isso não escala nem pra 5 beta testers.
2. **Não existe "página pública" nem "receber agendamento de aluno".** O card "Vitrine pública" da landing e o passo "Receba alunos" ("Como funciona") descrevem uma funcionalidade que **não existe em lugar nenhum do código** — não há rota pública de perfil de professor, não há busca, não há fluxo de auto-agendamento por um aluno que ainda não é cliente. Hoje, o único jeito de um aluno "entrar" no sistema é o professor cadastrá-lo manualmente em `/professor/alunos`.
3. **Cobrança é só manual/informativa.** "Cobrar" hoje = o professor troca o status de "pendente" pra "pago" na mão e compartilha um PIX copia-e-cola estático que ele mesmo digitou. Não há geração de cobrança, não há confirmação automática de pagamento, não há webhook de PSP. Isso pode ser aceitável pra uma v0 ("cobrança manual assistida"), mas precisa estar claro que não é "cobrar" no sentido de automatizar recebimento.
4. **WhatsApp não está configurado em lugar nenhum.** O código está pronto ([lib/whatsapp/client.ts](lib/whatsapp/client.ts), cron, webhook), mas faltam: conta Meta Business verificada, número de WhatsApp Business real, os 3 templates aprovados pela Meta, e as env vars (`WHATSAPP_CLOUD_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) configuradas no ambiente de produção. Sem isso, toda mensagem cai como "falhou" silenciosamente.
5. **Nenhum deploy real aparente.** `main` só tem o commit inicial ("first app commit"); todo o trabalho está em `feature/mvp-controle-aulas`, nunca mergeado nem (pelo que dá pra ver) publicado na Vercel. Um beta tester não tem URL nenhuma pra acessar hoje.
6. **Confirmação de e-mail do Supabase Auth pode estar travando o primeiro acesso.** Se "Confirm email" estiver ativo (padrão do Supabase) e não houver SMTP customizado configurado, o fluxo de cadastro fica preso no "verifique seu e-mail" sem o e-mail chegar de forma confiável.

### 🟡 Desejável, mas não essencial pro primeiro beta

- CRUD de turmas/matrículas em gestão (ou remover o fluxo legado inteiro, já que ele não é usado pelo modelo atual).
- Tarefas/Chat/Avisos virarem reais (Fase 1 do roadmap) — hoje são demonstráveis mas não funcionais.
- Portal do responsável/pais.
- Relatório financeiro consolidado.
- Reenvio manual de mensagem de WhatsApp que falhou.
- Página de Termos/Privacidade/Contato (importante temporalmente perto do beta, mas não bloqueia o fluxo técnico).
- Índices de performance no banco (não importa com 2-3 linhas por tabela; importa quando tiver dados de verdade).

---

## 9. Dívida técnica / riscos

### Segurança (via Supabase Advisors + leitura de código)
- **`profiles_update_own` já foi corrigida** (migration 0007) — mas vale registrar que era uma falha real de escalonamento de privilégio (aluno virando gestor via PATCH direto) até essa migration.
- **3 funções SQL sem `search_path` fixo** (`auth_role`, `link_aluno_por_email`, `handle_new_user`) — [WARN do linter Supabase]. Prática recomendada é `set search_path = public` (já feito em `atualizar_dados_pessoais_aluno`, migration 0005, mas não nas demais).
- **4 funções `SECURITY DEFINER` chamáveis via RPC público** (`auth_role`, `handle_new_user`, `link_aluno_por_email`, `atualizar_dados_pessoais_aluno`) por `anon` e `authenticated`. As 3 primeiras são funções de trigger que não fazem sentido chamadas fora do contexto de trigger (chamar `handle_new_user()` direto provavelmente erra por referenciar `NEW` fora de contexto) — risco baixo mas não nulo; vale revisar/restringir.
- **Proteção contra senha vazada (HaveIBeenPwned) está desligada** no Supabase Auth — 1 clique pra ligar, sem custo.
- **Nenhuma verificação de assinatura no webhook do WhatsApp** ([app/api/whatsapp/webhook/route.ts](app/api/whatsapp/webhook/route.ts)) — a Meta assina o payload (`X-Hub-Signature-256`), e o código não confere isso. Impacto hoje é baixo (só permite marcar mensagem como "falhou" indevidamente), mas é uma porta destrancada.
- **Autorização das Server Actions depende 100% de RLS, sem checagem de posse na aplicação.** Ex.: `atualizarAluno`, `excluirAluno`, `adicionarHorario`, `concluirAula` ([app/professor/alunos/actions.ts](app/professor/alunos/actions.ts)) recebem um `alunoId`/`horarioId` e chamam `update`/`delete` direto, confiando que a policy RLS (`professor_id = auth.uid()`) vai bloquear se não for dono. Funciona hoje porque as policies estão corretas, mas é uma defesa em camada única — sem defesa em profundidade.

### Tratamento de erro / validação
- **Nenhuma Server Action verifica o retorno de erro do Supabase.** Em praticamente todo `app/**/actions.ts`, o padrão é `await supabase.from(...).insert(...)` sem checar `{ error }` — se o insert falhar (RLS, constraint, rede), a página só recarrega como se tivesse dado certo, sem feedback nenhum pro usuário. Exemplos: [app/professor/alunos/actions.ts](app/professor/alunos/actions.ts), [app/professor/agendamentos/actions.ts](app/professor/agendamentos/actions.ts), [app/professor/actions.ts](app/professor/actions.ts).
- **Sem validação de formato** em nenhum formulário server-side (e-mail, telefone, URL do link de aula, valores numéricos) além do que o HTML5 `type=` já garante no browser — nada impede um professor de salvar telefone com letras, ou um `valor` negativo (o `min="0"` do input é só client-side).
- **Sem rate limiting** em nenhuma rota, incluindo login/cadastro e a rota de cron/webhook do WhatsApp (essas 2 têm autenticação por token, mas não limite de taxa).

### Hardcoded / dívida de configuração
- **Inconsistência de nome do produto, ativa e não commitada:** `git diff` mostra que [app/layout.tsx](app/layout.tsx) (`<title>`) e [components/Topbar.tsx](components/Topbar.tsx) (wordmark, usado nas 3 áreas logadas) dizem **"Personal Class"**, enquanto [app/page.tsx](app/page.tsx) (landing) e o restante da documentação dizem **"Personal English Class"**. Isso está literalmente em `git status` como mudança não commitada — vale decidir qual nome é o certo e commitar de propósito.
- **`app/layout.tsx` também tem a `description` desatualizada** ("Controle de aulas: turmas, presença e acompanhamento.") — não reflete o produto atual (WhatsApp, financeiro, etc.).
- **README.md desatualizado** — a seção "Estrutura" não menciona nenhuma pasta criada depois do scaffold inicial (WhatsApp, tarefas, chat, avisos, etc.), e o passo "Banco de dados" só cita `schema.sql`, sem mencionar as 7 migrations que vieram depois.
- **`supabase/scripts/alternar_role_teste.sql`** tem um e-mail fixo hardcoded (`matheusarmando90@gmail.com`) — é um script de dev deliberado, mas fica óbvio que não deve ir pra nenhum contexto de produção/documentação pública.

### Performance (baixo risco agora, real em escala)
- **9 foreign keys sem índice de cobertura** (`alunos.professor_id`, `aluno_horarios.aluno_id`, `whatsapp_mensagens.*`, etc.) — [Supabase Performance Advisor].
- **~20 policies de RLS re-avaliam `auth.uid()`/`auth_role()` por linha** em vez de `(select auth.uid())` — recomendação padrão do Postgres/Supabase pra evitar reavaliação por linha em queries grandes.
- **Policies duplicadas permissivas** em `alunos` e `aluno_horarios` (ex.: `alunos_select_prof_ou_gestor` + `alunos_select_proprio` sempre rodam as duas pra todo SELECT).
- Nenhum desses 3 pontos importa com 2-3 linhas por tabela; importam quando o produto tiver uso real.

### Estrutural
- **Fluxo legado morto** (`turmas`/`matriculas`/`aulas`/`presencas` + `app/professor/actions.ts` + [components/ListaChamada.tsx](components/ListaChamada.tsx)) — código e schema mantidos, sem nenhuma forma de alcançá-los pela UI. Ou se investe nele (CRUD de turmas em gestão) ou se remove pra não confundir manutenção futura.
- **Zero testes automatizados** — qualquer regressão só é pega manualmente.
- **Branch de trabalho nunca integrada:** `main` tem 1 commit, todo o produto real está em `feature/mvp-controle-aulas` (6 commits). Sem PR aberto (verificável no repo local).

---

## Resumo executivo

O projeto é um MVP funcional e bem estruturado tecnicamente (Next.js 14 + Supabase com RLS bem desenhado, TypeScript estrito, sem débito de "gambiarra" grosseira), mas está numa fase de **produto de um professor só, não um SaaS multi-professor pronto pra beta externo**. A área do professor é sólida e a mais completa (cadastro de aluno, agenda, financeiro básico, WhatsApp integrado no código); aluno e gestão são bem mais rasas, e gestão em particular quase não tem funcionalidade própria além de números agregados. Os três bloqueadores reais pra colocar um beta tester de fora pra usar são: (1) não dá pra virar professor sem alguém rodar SQL manualmente, (2) não existe nenhum caminho de aquisição de aluno (página pública/agendamento) — só cadastro manual pelo professor, e (3) o WhatsApp, que é o grande diferencial vendável do produto, está com o código pronto mas zero configurado (sem conta Meta, sem templates aprovados, sem env vars). Fora isso, há dívida técnica real mas administrável — RLS como única linha de defesa sem checagem na aplicação, zero tratamento de erro nas Server Actions, e uma inconsistência de nome de marca sentada sem commit. Nada aqui é bloqueador de arquitetura; é trabalho de configuração e de mais algumas semanas de produto antes de abrir pra fora.
