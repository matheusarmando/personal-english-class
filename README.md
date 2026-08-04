# Personal English Class — MVP

Controle de aulas com três áreas de acesso (aluno, professor, gestão) mais
uma landing page pública.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Auth + Row Level Security)
- Tailwind CSS

## Setup local

```bash
npm install
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Banco de dados

1. Crie um projeto em https://supabase.com
2. Abra o SQL editor e rode `supabase/schema.sql`
3. Isso cria as tabelas (`profiles`, `turmas`, `matriculas`, `aulas`,
   `presencas`), as políticas de RLS por papel e o trigger que cria um
   `profile` automaticamente (papel `aluno` por padrão) quando alguém se
   cadastra.
4. Para promover um usuário a `professor` ou `gestor`, atualize manualmente
   a coluna `role` na tabela `profiles` (via SQL editor ou tela de gestão,
   quando existir).

## Estrutura

```
app/
  page.tsx            -> landing page pública
  login/               -> autenticação
  aluno/               -> área do aluno (frequência)
  professor/            -> área do professor (criar aula, chamada)
  gestao/               -> área de gestão (visão geral)
  acesso-negado/        -> tela de bloqueio de acesso
middleware.ts           -> protege /aluno, /professor, /gestao por role
lib/supabase/            -> clients Supabase (browser e server)
supabase/schema.sql       -> schema + RLS do banco
```

## Como subir esse trabalho para o repositório

Este scaffold foi gerado fora do repositório remoto. Para aplicá-lo:

```bash
git checkout develop
git pull
git checkout -b feature/mvp-controle-aulas

# copie os arquivos deste scaffold para a raiz do repo, substituindo/mesclando
# conforme necessário

git add .
git commit -m "feat: scaffold do MVP (landing, login, areas por role, RLS)"
git push -u origin feature/mvp-controle-aulas
```

Depois, abra o MR/PR de `feature/mvp-controle-aulas` para `develop` pela
interface do GitHub (ou `gh pr create --base develop`).

## Integração com Google Calendar (Fase 1 — leitura)

A plataforma lê a agenda pessoal do professor (Google Calendar) pra
evitar marcar aula em cima de compromisso existente. É só leitura —
nada é criado, alterado ou apagado na agenda do Google nesta fase.

### Credenciais no Google Cloud Console

1. Crie (ou reaproveite) um projeto em https://console.cloud.google.com.
2. **APIs & Services > Library** → ative a **Google Calendar API**.
3. **APIs & Services > OAuth consent screen**:
   - Tipo **External**.
   - Escopo adicionado: `.../auth/calendar.readonly`.
   - **Enquanto o app não passar pela verificação do Google, ele fica
     em modo de teste** — só e-mails cadastrados em "Test users"
     conseguem conectar. Adicione ali o e-mail de cada professor que
     for testar. Escopos de Calendar são considerados "sensíveis"
     pelo Google; publicar em produção pra qualquer usuário exige
     passar pelo processo de verificação (pode levar dias/semanas) —
     planeje isso com antecedência se for abrir pra professores fora
     da sua equipe.
4. **APIs & Services > Credentials > Create Credentials > OAuth
   client ID**, tipo **Web application**.
   - **Authorized redirect URIs**: cadastre uma entrada por ambiente,
     apontando pra `/api/google-calendar/oauth/callback`:
     - Dev: `http://localhost:3000/api/google-calendar/oauth/callback`
     - Preview/produção: `https://SEU-DOMINIO/api/google-calendar/oauth/callback`
   - Anote o `Client ID` e o `Client Secret`.
5. Preencha `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e
   `GOOGLE_REDIRECT_URI` (esse último precisa bater **exatamente**
   com a URI cadastrada acima, incluindo protocolo) nas variáveis de
   ambiente de cada ambiente.

### Job de sincronização a cada 30 minutos (pg_cron)

O cron da Vercel (plano Hobby) só roda 1x/dia, então o fallback
periódico (obrigatório — a integração não pode depender só do
webhook) roda dentro do próprio Postgres via `pg_cron`. As migrations
já habilitam as extensões `pg_cron`/`pg_net`, mas o **agendamento do
job em si é um passo manual pós-deploy** (depende da URL real do
ambiente):

```sql
-- Rode uma vez por ambiente (dev pode pular, já que o fallback
-- assume que a rota é alcançável publicamente).
insert into configuracao_sistema (chave, valor) values
  ('app_base_url', 'https://SEU-DOMINIO'),
  ('cron_secret', 'o mesmo valor de CRON_SECRET do ambiente')
on conflict (chave) do update set valor = excluded.valor;

select cron.schedule(
  'gcal-sincronizar-pendentes',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := (select valor from configuracao_sistema where chave = 'app_base_url') || '/api/google-calendar/cron/sincronizar-pendentes',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select valor from configuracao_sistema where chave = 'cron_secret'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

O cron de renovação de canal (`/api/google-calendar/cron/renovar-canais`)
já roda pelo cron nativo da Vercel — adicione a entrada em
`vercel.json` junto com a do WhatsApp.

### Testar manualmente com uma conta Google real

1. Login como professor → **Configurações → Google Calendar → Conectar**.
2. Autorize com uma conta de teste cadastrada no consent screen.
3. Confira o e-mail e o status "Conectado" na tela.
4. Crie um evento de teste no Google Calendar, no horário que você
   for tentar agendar uma aula.
5. Espere até 30min (ou chame a rota de fallback manualmente com o
   `CRON_SECRET`) pra ver o evento aparecer no calendário do
   professor dentro da plataforma.
6. Tente agendar uma aula no mesmo horário do evento — deve bloquear
   mostrando o título do compromisso, com a opção de "Agendar mesmo
   assim".
7. Desconecte e confirme que a conta e os eventos espelhados somem.

## Próximos passos sugeridos

- Tela de cadastro (signup) e definição de papel pela gestão
- CRUD completo de turmas e matrículas na área de gestão
- Paginação/filtros na listagem de frequência
- Testes automatizados (Playwright para fluxo de login + RBAC)
