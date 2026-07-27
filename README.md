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

## Próximos passos sugeridos

- Tela de cadastro (signup) e definição de papel pela gestão
- CRUD completo de turmas e matrículas na área de gestão
- Paginação/filtros na listagem de frequência
- Testes automatizados (Playwright para fluxo de login + RBAC)
