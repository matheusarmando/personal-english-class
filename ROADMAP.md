# Roadmap — Personal English Class

> Documento de planejamento. **Nada aqui foi implementado ainda** — é a
> lista priorizada de próximas funcionalidades, com história descritiva
> por item, pra orientar o Claude Code quando cada uma for encomendada.

## De onde veio esse roadmap

Baseado no catálogo de funcionalidades do **eSchool SaaS** (WRTeam), um
ERP escolar multi-tenant (Laravel + Flutter). Não consegui navegar pela
demo ao vivo (`eschool.wrteam.me` bloqueou o acesso com HTTP 403), então
usei a página oficial do produto e o anúncio no CodeCanyon como fonte —
que listam os módulos em texto, item por item, com mais detalhe do que
eu conseguiria só clicando pela UI.

O eSchool é um produto **muito maior** que este projeto (multi-escola,
folha de pagamento, transporte, cartão de identificação, certificados,
site próprio por escola). A lista abaixo filtra e adapta o que faz
sentido pra um professor autônomo (Fases 1-3) e reserva os módulos de
crescimento — virar uma plataforma pra vários professores — pra Fase 4,
como você pediu.

Sobre **layout**: inicialmente eu não tinha visto a UI do eSchool de
fato — isso mudou. Uma captura real de tela (script rodado no
navegador do usuário, logado como Teacher) permitiu extrair o HTML/CSS
renderizado de verdade. A análise completa está em
[docs/layout-referencia-eschool.md](docs/layout-referencia-eschool.md)
— cores, tipografia, espaçamento e a estrutura do dashboard (stat row +
grade de widget cards com filtro e estado vazio próprios). "Manter o
mesmo layout" aqui significa **continuar com o sistema visual que já
construímos** neste projeto (paleta Recreio, sidebar por papel, cards,
pills de status, calendário mensal reutilizável), adotando os padrões
estruturais do eSchool que fazem sentido (ver seção 5 daquele
documento) — não clonar a paleta de cor deles.

## Convenções usadas abaixo

- **História**: formato `Como <papel>, quero <ação>, para <benefício>`.
- **Prioridade**: P0 (fecha o ciclo básico) → P3 (crescimento/SaaS).
- **Passos**: cronograma sugerido de implementação, na ordem em que o
  Claude Code deveria abordar (schema → backend → UI → integrações).
- Tudo assume reaproveitar os padrões já existentes no repo: migrations
  numeradas em `supabase/migrations/`, RLS por papel, server actions,
  layouts com sidebar por `app/<papel>/layout.tsx`.

---

## Fase 1 — Fechar o ciclo pedagógico (P0)

### 1.1 Tarefas com entrega (Assignment Handling)

**História:** Como professor, quero atribuir uma tarefa formal a um
aluno (com prazo e material de apoio), e como aluno, quero ver minhas
tarefas pendentes e enviar minha resposta, para que o acompanhamento
não dependa só do campo livre "exercício" que hoje só o professor edita.

Hoje existe apenas `aluno_horarios.exercicio` (texto livre, sem prazo,
sem espaço pro aluno responder). Isso vira uma entidade própria.

Os campos reais do formulário equivalente no eSchool ("Create
Assignment", capturado em
[docs/layout-referencia-eschool.md §4.5-B](docs/layout-referencia-eschool.md)):
Class Section, Subject, Assignment Name, Assignment Instructions,
Files, Submission Due Date, **Points** (nota máxima) e **Resubmission
Allowed** + dias extras pra reenvio — os dois últimos não estavam no
desenho original abaixo e vale incorporar.

**Passos:**
1. Migration: tabela `tarefas` (professor_id, aluno_id, titulo,
   descricao, anexo_url, prazo, pontos_maximos, permite_reenvio
   boolean, status: pendente/entregue/avaliada) + `tarefa_entregas`
   (tarefa_id, conteudo, anexo_url, entregue_em, feedback_professor,
   nota).
2. RLS: professor gerencia tarefas dos próprios alunos; aluno só vê e
   entrega as suas.
3. Server actions: `criarTarefa`, `entregarTarefa`, `avaliarTarefa`.
4. UI professor: nova seção "Tarefas" na sidebar — listar/criar tarefas
   por aluno, ver entregas pendentes de avaliação.
5. UI aluno: seção "Tarefas" — lista com pill de status (pendente/
   entregue/avaliada), formulário de entrega.
6. Notificação (reaproveitar `whatsapp_mensagens` ou notificação
   in-app da 1.3) quando uma tarefa é criada ou avaliada.

---

### 1.2 Chat 1:1 professor ↔ aluno

**História:** Como aluno, quero conversar com meu professor dentro do
sistema, e como professor, quero um histórico de conversa por aluno,
para que dúvidas rápidas não dependam só do WhatsApp (que hoje só
dispara mensagens automáticas, não é uma conversa de verdade).

**Passos:**
1. Migration: tabela `mensagens_chat` (aluno_id, remetente_id,
   conteudo, lida, created_at). RLS: só professor do aluno e o próprio
   aluno (via `alunos.profile_id`) leem/escrevem.
2. Decidir realtime: usar Supabase Realtime (subscriptions) na tabela,
   já que o projeto usa `@supabase/ssr`/`@supabase/supabase-js`.
3. Server action `enviarMensagem` + client component com
   `useEffect`/subscription pra atualizar a lista sem reload.
4. UI: painel de chat em `/professor/alunos/[id]` (lateral ou aba) e em
   `/aluno` (chat com o professor vinculado).
5. Indicador de não lida (badge na sidebar).

---

### 1.3 Mural de avisos (Noticeboard)

**História:** Como professor, quero publicar um aviso (geral ou pra um
aluno específico), e como aluno, quero ver um feed de avisos do meu
professor, para que comunicados não dependam só de mensagem avulsa.

**Passos:**
1. Migration: tabela `avisos` (professor_id, aluno_id nullable —
   null = geral, titulo, conteudo, created_at). RLS: professor cria só
   os próprios; aluno vê os gerais do seu professor + os direcionados
   a ele.
2. Server actions: `criarAviso`, `excluirAviso`.
3. UI professor: seção "Avisos" — criar aviso, escolher "geral" ou um
   aluno específico via select.
4. UI aluno: feed de avisos no Painel (acima ou abaixo do calendário).

---

### 1.4 Relatório consolidado do aluno (Student Report)

**História:** Como professor, quero uma tela por aluno que resuma
frequência, aulas dadas, pagamentos e tarefas, e como aluno, quero ver
o mesmo resumo sobre mim, para não ter que cruzar informação espalhada
entre `/professor/alunos/[id]`, calendário e cadastro.

**Passos:**
1. Sem schema novo — é uma consulta agregada sobre tabelas já
   existentes (`aluno_horarios`, `presencas`, `alunos`, e `tarefas` da
   1.1 quando existir).
2. Nova seção/aba "Relatório" em `/professor/alunos/[id]`: contagem de
   aulas concluídas/canceladas, taxa de presença, total pago vs.
   pendente, últimas 5 tarefas.
3. Espelhar versão simplificada em `/aluno` (ex.: aba "Meu progresso").
4. Reaproveitar os componentes de stat card já criados no Painel do
   professor (`app/professor/page.tsx`) em vez de criar um estilo novo.

---

## Fase 2 — Avaliação e diário (P1)

### 2.1 Provas/testes com correção (Exam Management)

**História:** Como professor, quero montar uma prova (perguntas de
múltipla escolha ou dissertativas) e aplicar nela um aluno, e como
aluno, quero responder e ver meu resultado, para substituir o
"agendamento avulso de teste de proficiência" — que hoje é só uma
reunião marcada, sem prova de verdade nem nota.

**Passos:**
1. Migration: `provas` (professor_id, titulo, nivel), `prova_questoes`
   (prova_id, enunciado, tipo: multipla_escolha/dissertativa, opcoes
   jsonb, resposta_correta), `prova_aplicacoes` (prova_id, aluno_id,
   status, nota, iniciada_em, finalizada_em), `prova_respostas`
   (aplicacao_id, questao_id, resposta, correta).
2. RLS igual ao padrão já usado (professor dono, aluno só a própria
   aplicação).
3. Server actions: `criarProva`, `adicionarQuestao`, `aplicarProva`
   (vincula a um aluno), `responderProva` (aluno), `corrigirProva`
   (calcula nota automática pras múltipla-escolha; professor corrige
   manualmente as dissertativas).
4. UI professor: "Provas" na sidebar — criar/editar prova, aplicar a
   um aluno, ver resultados.
5. UI aluno: notificação de prova pendente, tela de resposta, tela de
   resultado.
6. Ligar ao `agendamentos_avulsos` existente: ao agendar um "teste de
   proficiência", opcionalmente já vincular uma prova.

---

### 2.2 Diário do aluno (Student Diary)

**História:** Como professor, quero registrar observações cronológicas
sobre a evolução de um aluno (não só conteúdo/exercício de uma aula
específica), e como aluno, quero ler esse histórico, para acompanhar
meu progresso ao longo do tempo.

**Passos:**
1. Migration: `diario_aluno` (aluno_id, professor_id, nota, created_at)
   — texto livre, sem vínculo obrigatório com uma aula.
2. RLS padrão (professor dono, aluno leitor).
3. Server action `adicionarNotaDiario`.
4. UI professor: aba "Diário" em `/professor/alunos/[id]`, lista
   cronológica + formulário de nova nota.
5. UI aluno: mesma lista, somente leitura, em `/aluno/cadastro` ou uma
   nova aba.

---

### 2.3 Financeiro do professor (Income/Financial Report)

**História:** Como professor, quero ver quanto faturei no mês, quem
está inadimplente e a projeção dos próximos vencimentos, para não
precisar somar manualmente os valores de cada aluno.

**Passos:**
1. Sem schema novo — agrega `alunos.valor`, `status_pagamento`,
   `dia_vencimento` (já existem desde a integração de WhatsApp).
2. Nova seção `/professor/financeiro`: total esperado no mês, total
   recebido (`status_pagamento = 'pago'`), inadimplência
   (`atrasado`), lista de próximos vencimentos ordenada por dia.
3. Adicionar ao menu do professor.
4. (Opcional, depende de 2.1/1.1 não — independente) exportar CSV do
   relatório.

---

### 2.4 Papel "Responsável" (Guardian)

**História:** Como responsável por um aluno menor de idade, quero ter
meu próprio login pra acompanhar frequência, pagamentos e tarefas do
meu filho, sem poder editar nada, para acompanhar sem depender do
aluno repassar informação.

Esse é o item de maior impacto estrutural da Fase 2 — hoje `profiles`
só tem `aluno | professor | gestor`.

**Passos:**
1. Migration: adicionar `'responsavel'` ao enum `user_role`; tabela
   `responsaveis_alunos` (responsavel_profile_id, aluno_id) — permite
   1 responsável acompanhar vários alunos (irmãos).
2. RLS: policies de SELECT somente-leitura em `alunos`,
   `aluno_horarios`, `presencas`, `tarefas` etc. condicionadas a
   `exists (select 1 from responsaveis_alunos where responsavel_profile_id = auth.uid() and aluno_id = ...)`.
3. Fluxo de vínculo: o professor convida/vincula o responsável pelo
   e-mail (mesmo padrão de auto-link por e-mail já usado entre
   `alunos.profile_id` e `auth.users`).
4. Novo `app/responsavel/layout.tsx` + `app/responsavel/page.tsx`
   (dashboard somente-leitura, reaproveitando os componentes de stat
   card e calendário já existentes).
5. Middleware: adicionar `/responsavel` ao `AREA_ROLES` em
   `middleware.ts`.
6. Estender o cron de WhatsApp pra opcionalmente notificar o
   responsável também (não só o aluno).

---

## Fase 3 — Diferenciação e captação de alunos (P2)

### 3.1 Página pública do professor (mini-site)

**História:** Como professor, quero uma página pública personalizável
(bio, preço, disponibilidade, formulário de contato) com uma URL só
minha, para usar como link de divulgação em vez da landing genérica
atual.

**Passos:**
1. Migration: `professor_pagina` (professor_id, slug único, bio,
   foto_url, mostrar_precos boolean, publicada boolean).
2. Rota dinâmica `app/p/[slug]/page.tsx` (pública, sem auth) — renderiza
   bio + CTA "Quero uma aula" que gera um lead (reaproveitar
   `agendamentos_avulsos` como "solicitação" inicial, tipo novo
   `outro`/`lead`).
3. UI professor: `/professor/pagina` — editar bio/foto, escolher slug,
   pré-visualizar, publicar/despublicar.
4. Reaproveitar o mesmo sistema de cores/tipografia da landing atual
   (`app/page.tsx`) como base visual, não inventar um estilo novo.

---

### 3.2 Certificado de conclusão de nível

**História:** Como aluno, quero receber um certificado em PDF quando
concluo um nível (A1, A2...), para ter um comprovante formal do
progresso.

**Passos:**
1. Migration: `alunos.nivel_atual` (enum A1-C2) +
   `certificados_emitidos` (aluno_id, nivel, emitido_em, pdf_url).
2. Escolher lib de geração de PDF server-side (ex.: `@react-pdf/renderer`
   ou `pdf-lib`) — avaliar compatibilidade com Vercel/Next antes de
   comprometer.
3. Server action `emitirCertificado` (professor aciona manualmente,
   gera PDF, sobe pro Supabase Storage, salva `pdf_url`).
4. UI professor: botão "Emitir certificado" em `/professor/alunos/[id]`.
5. UI aluno: lista de certificados recebidos com link de download.

---

### 3.3 Biblioteca de materiais por nível

**História:** Como professor, quero organizar materiais de estudo
(PDF, link, vídeo) por nível, e como aluno, quero acessar os materiais
do meu nível atual, para ter conteúdo de apoio entre as aulas.

**Passos:**
1. Migration: `materiais` (professor_id, nivel, titulo, tipo, url).
2. Supabase Storage bucket pra upload de PDF (com RLS de storage
   equivalente: só o professor dono faz upload, alunos do nível leem).
3. Server actions `criarMaterial`/`excluirMaterial`.
4. UI professor: `/professor/materiais`, filtrável por nível.
5. UI aluno: seção "Materiais" mostrando só os do `alunos.nivel_atual`
   (depende do campo criado em 3.2).

---

### 3.4 PWA / notificações push nativas

**História:** Como aluno, quero receber notificação no celular mesmo
sem abrir o navegador, para não depender só do WhatsApp.

**Passos:**
1. Adicionar manifest + service worker (`next-pwa` ou config manual)
   pro Next.js atual — mantém sendo o mesmo app web, não é um app
   nativo separado.
2. Web Push API (VAPID keys) + tabela `push_subscriptions` (profile_id,
   endpoint, keys jsonb).
3. Server action registrando a subscription no login.
4. Gatilhos de push nos mesmos eventos que hoje disparam WhatsApp
   (reaproveitar a lógica de `app/api/whatsapp/cron/route.ts`, gerando
   os dois canais a partir da mesma varredura).

---

## Fase 4 — Virar plataforma multi-professor / SaaS (P3)

> Só faz sentido investir aqui depois que a Fase 1 estiver validada com
> uso real — é a fase de maior risco/esforço e reformula premissas de
> dados que hoje assumem "um professor só".

### 4.1 Multi-tenant (várias operações independentes)

**História:** Como dono da plataforma, quero que vários professores
(ou pequenas escolas de idiomas) usem o sistema de forma isolada, cada
um com seus próprios alunos e configurações, para vender o produto pra
mais de um cliente.

**Passos:**
1. Decidir estratégia de isolamento: `escola_id` em todas as tabelas +
   RLS filtrando por `escola_id` do usuário (mais simples que schemas
   separados no Postgres, e mais barato no Supabase).
2. Migration grande: tabela `escolas` (nome, slug, branding jsonb,
   plano_id); adicionar `escola_id` em `profiles`, `alunos`, `turmas`,
   `agendamentos_avulsos`, `whatsapp_mensagens` etc.
3. Reescrever todas as policies de RLS existentes pra incluir o filtro
   de `escola_id` (auditoria completa — é o passo mais arriscado).
4. Fluxo de onboarding: criação de nova `escola` no cadastro (ou via
   super admin da 4.2).
5. Isso é uma migração de dados retroativa também — a `escola` "Personal
   English Class" atual vira o primeiro registro.

---

### 4.2 Painel Super Admin

**História:** Como dono da plataforma, quero um painel pra ver todas
as escolas cadastradas, métricas agregadas e conseguir suspender/
ativar contas, para operar a plataforma em produção.

**Passos:**
1. Novo papel `super_admin` (fora do `escola_id` — enxerga tudo).
2. `app/super-admin/layout.tsx` + páginas de listagem de escolas,
   detalhe de uma escola, métricas globais.
3. Ação de suspender/reativar escola (flag `ativa` em `escolas`).

---

### 4.3 Planos e cobrança (Subscription & Billing)

**História:** Como dono da plataforma, quero cobrar uma assinatura
mensal de cada escola/professor conforme o plano contratado, para
monetizar o produto.

**Passos:**
1. Migration: `planos` (nome, preco, limite_alunos, features jsonb),
   `escolas.plano_id`.
2. Integrar gateway de cobrança recorrente (Stripe é o caminho mais
   direto pra SaaS internacional; para PIX recorrente nacional avaliar
   Asaas/Iugu/Pagar.me — decisão a tomar quando chegar nessa fase).
3. Webhook de cobrança atualizando status da assinatura.
4. Bloqueio de acesso (ou downgrade de features) quando a assinatura
   está inadimplente — checar em middleware.

---

### 4.4 Onboarding self-service

**História:** Como um novo professor interessado, quero me cadastrar
sozinho, escolher um plano e começar a usar sem precisar que alguém
configure manualmente pra mim, para reduzir a fricção de adoção.

**Passos:**
1. Fluxo público `/comecar`: cadastro → criação automática da `escola`
   → seleção de plano (Fase 4.3) → primeiro login como professor.
2. E-mail transacional de boas-vindas (avaliar Resend/Postmark).
3. Estado "trial" com expiração antes de exigir pagamento.

---

## Resumo de prioridade

| Fase | Foco | Bloqueia a próxima? |
|---|---|---|
| 1 | Tarefas, chat, avisos, relatório do aluno | Não, mas é a base de uso diário |
| 2 | Provas, diário, financeiro, responsável | Não |
| 3 | Página pública, certificado, materiais, push | Não |
| 4 | Multi-tenant, super admin, cobrança, onboarding | Sim — reformula o schema inteiro; só compensa com demanda validada |
