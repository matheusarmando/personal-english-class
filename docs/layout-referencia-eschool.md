# Layout de referência — eSchool (WRTeam)

> Extraído de duas capturas reais, geradas por scripts de DevTools
> rodados no navegador do usuário, logado como **Teacher** em
> `https://eschool.wrteam.me`: (1) `layout__home.json`, o dashboard; e
> (2) `layout_todas_telas_*.json`, um crawler que seguiu os 30 links do
> menu lateral via `fetch()` autenticado. Capturas em 2026-07-28. Isso
> é HTML/CSS renderizado de verdade — não é uma suposição sobre como o
> site deve ser.

Esse documento existe pra dar dados concretos (cores, tipografia,
espaçamento, estrutura) pra quem for implementar os itens do
[ROADMAP.md](../ROADMAP.md) reaproveitando os mesmos padrões visuais do
eSchool, adaptados ao nosso sistema de design (Tailwind + tokens
`ink`/`paper`/`accent`/`good`/`warn`/`bad` já definidos em
`tailwind.config.ts`).

**Limitação:** as 30 telas capturadas cobrem só o que o papel
**Teacher** enxerga no menu — não inclui login (fora da sidebar) nem
as telas exclusivas de Admin (Fees, Staff/Payroll, Settings). O
crawler também não executa interação nenhuma, então telas que só
montam conteúdo depois de clique/JS (as grades de horário) vieram
vazias — ver seção "Próximas capturas úteis" no final.

---

## 1. Paleta de cores

### 1.1 Tema aplicado nessa instância (o que realmente está na tela)

Encontrado direto num `<style>` inline no `<head>`, sobrescrevendo os
padrões do template:

```css
:root {
  --theme-color: #22577a;    /* azul petróleo — cor de marca/ação principal */
  --secondary-color: #57cc99; /* verde menta — cor secundária */
}
```

Confere com o dado de maior frequência do resumo de cores computadas
(`rgb(34, 87, 122)`, 78 ocorrências) — é a cor mais usada em botões,
links ativos e destaques.

### 1.2 Tokens do dashboard (definidos em `content.css`)

```css
--dash-bg: #f4f3f8;       /* fundo da área de conteúdo */
--dash-card-bg: #ffffff;  /* fundo dos cards */
--dash-border: #ececf1;   /* bordas dos cards */
--dash-text: #1f2937;     /* texto principal */
--dash-muted: #8a8f9c;    /* texto secundário/legendas */
--dash-track: #eef0f4;    /* trilha de barras/skeletons */
--dash-amber: #f5b13d;    /* atenção */
--dash-red: #fc5a6b;      /* erro/negativo */
```

### 1.3 Paleta base do template (Bootstrap customizado, `style.css`)

Provavelmente não está tudo em uso nessa instância (o `--theme-color`
acima sobrescreve o `--primary` abaixo), mas mostra a paleta semântica
completa que o template suporta:

```css
--primary: #b66dff;   --secondary: #c3bdbd;
--success: #1bcfb4;   --info: #198ae3;
--warning: #fed713;   --danger: #fe7c96;
--dark: #3e4b5b;      --light: #f8f9fa;
```

### 1.4 Leitura pro nosso sistema (Recreio)

O eSchool usa **semântica separada da cor de marca** — exatamente o
padrão `good`/`warn`/`bad` que já adotamos, só que a cor de marca deles
é um azul petróleo (`#22577a`), não o coral da nossa paleta Recreio.
Não precisa mudar nossa paleta — o ponto relevante é a **separação de
papéis de cor**, que já replicamos.

---

## 2. Tipografia

- Fonte única: **Roboto**, hospedada localmente em 4 arquivos `.ttf`
  separados por peso (`Roboto-Light`, `Roboto-Regular`,
  `Roboto-Medium`, `Roboto-Bold` — cada peso é um `font-family`
  próprio, não `font-weight` numérico numa família só).
- Ícones: **Font Awesome** (menus antigos/dropdowns) + **SVGs inline
  estilo Lucide** (`class="lc-icon"`) nos itens do menu lateral —
  ícones de contorno (`stroke`, não `fill`), 20×20px no menu, 16-18px
  em botões menores.
- Tamanho base: **16px**. Segundo tamanho mais comum: **14px** (grande
  parte do texto de UI/tabelas).
- Pesos: majoritariamente **400** (544 ocorrências); títulos e
  destaques em **500/600**; **700** é raro (só em poucos elementos).

**Leitura pro nosso sistema:** já usamos Sora (display) + Inter (corpo)
— mais caracterizado que o Roboto genérico do eSchool. Não precisa
trocar; o eSchool não tem uma escolha tipográfica particularmente
distintiva, é o default "admin template Bootstrap".

---

## 3. Espaçamento, raio de borda e sombra

- **Raio de borda:** predominam **8px** e **10px** nos cards; **14px**
  em elementos maiores; pill (**99px**) em badges/chips; círculo
  (**50%**) em avatares.
- **Espaçamento:** grade solta em torno de **12px/20px/24px** pros
  gaps principais; **2px/4px** pra ajustes finos internos.
- **Sombra de card** (o "elevation" mais comum):
  ```css
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  ```
  Elementos elevados (dropdown, modal) somam camadas:
  ```css
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.04),
    0 4px 12px rgba(16, 24, 40, 0.04),
    0 12px 32px rgba(16, 24, 40, 0.03);
  ```
  Note o tom **azul-acinzentado neutro** (`rgb(16,24,40)`) em vez de
  preto puro — é o que faz a sombra parecer "sofisticada" em vez de
  genérica. Vale adotar esse mesmo tom de sombra no nosso sistema.

---

## 4. Estrutura de layout

### 4.1 Topbar (fixa, `position: fixed`, `z-index` alto)

```
[logo] | [seletor de ano letivo ▾] [Cache Clear] [🌐 idioma ▾] [avatar + "Teacher" ▾]
```

- Dropdown de perfil: avatar circular + nome do papel → menu com
  "Change Password" e "Signout".
- Dropdown de idioma: lista simples com check no idioma ativo (10
  idiomas disponíveis nessa instância).
- Botão hamburguer à esquerda (recolhe a sidebar) e à direita em
  mobile (abre a sidebar como off-canvas).

### 4.2 Sidebar (fixa à esquerda, colapsável)

```
[campo de busca "Search"]
[Dashboard]                    ← item simples, ícone + label
[Academics ▾]                  ← item com submenu (accordion)
  └ Assign Subject Teacher
[Students ▾]
  └ Students Admission
  └ Assign Roll No.
  └ Student Details
  └ Generate Id Card
  └ Generate Result
[Parents]                      ← sem submenu
[Leave ▾]
  └ Apply Leave / Leave Report / Student Leave Requests
[Timetable ▾]
  └ Class Timetable / Teacher Timetable
[Attendance ▾]
  └ Add Attendance / Add Bulk Data / View Attendance / Attendance Report
[Subject Lesson ▾]
  └ Create Lesson / Create Topic
[Student Assignment ▾]
  └ Create Assignment / Assignment Submission
[Exam ▾]
  └ Upload Exam Marks / Exam Result / Students Exam Result
[Online Exam ▾]
  └ Manage Online Exam / Manage Questions / Import Questions / Terms & Conditions
[Announcement]
[Holiday List]
```

Isso é o menu real do papel **Teacher** (não Admin — um login de admin
teria bem mais itens: Fees, Staff/Payroll, Transportation etc., que
não aparecem aqui porque o professor não tem acesso).

- Item ativo: fundo destacado + ícone/texto na cor do tema.
- Submenu: `<div class="collapse">` do Bootstrap — expande/recolhe com
  seta que gira 180°.
- Busca no topo da sidebar filtra os itens do menu em tempo real
  (`sidebar-search-input`).

### 4.3 Conteúdo principal — Dashboard

```
"Welcome, Teacher Demo"
"Here's an overview of your institution's performance, staff
 activity, and academic operations."

[📊 Total Students: 7] [🏢 Total Classes: 7] [📖 Total Assigned Subjects: 8]

┌─────────────┬──────────────────┬─────────────┐
│ Attendance  │ Today's Timetable│ Leaves      │
│ (seletor de │ (lista hora+turma)│ (seletor    │
│ turma +     │                  │ Today/      │
│ gráfico)    │                  │ Tomorrow/   │
│             │                  │ Upcoming)   │
└─────────────┴──────────────────┴─────────────┘
┌─────────────┬──────────────────┬─────────────┐
│ Upcoming    │ Assignments To   │ Noticeboard │
│ Exams       │ Review (lista +  │ (lista com  │
│ (seletor de │ contagem de      │ chip de     │
│ mês)        │ entregas)        │ turma +     │
│             │                  │ "View All") │
└─────────────┴──────────────────┴─────────────┘
```

Padrão de cada **widget card**:
- Cabeçalho: título + (opcional) `<select>` de filtro contextual.
- Corpo: lista de itens **ou** estado vazio (`"No Data Found"`,
  `"No exams found"`, `"No leaves found"` — mensagem específica por
  widget, não um genérico único).
- Existe um elemento de **skeleton de carregamento**
  (`data-skeleton`, escondido por padrão, mostrado via JS enquanto os
  dados carregam por AJAX — cada widget busca seus dados numa URL
  própria, ex.: `/home/widget/attendance`).

### 4.4 Rodapé

Fixo ao fim da página (`mt-auto` + `min-vh-100` no container), com
versão do sistema + copyright.

---

## 4.5 Padrões de tela (30 telas capturadas)

Uma segunda captura (`layout_todas_telas_*.json`) rodou um crawler no
console que seguiu **todos os links do menu lateral** (inclusive os de
submenus fechados) via `fetch()` autenticado, sem navegar de verdade —
por isso pega a estrutura renderizada no servidor, mas **não** pega o
que só existe depois de AJAX/JS rodar (grades de horário, dados de
tabela em si). Resultado: 30 telas, todas com HTTP 200.

Apesar de serem 30 áreas de negócio diferentes, a UI inteira gira em
torno de só **3 esqueletos de página**, sempre dentro do mesmo
`<div class="content-wrapper"> → .page-header (h3.page-title) →
.card → .card-body`:

### A. Lista/relatório (17 das 30 telas)

Ex.: Student Details, Attendance Report, Leave Report, Exam Result,
Students Exam Result, View Attendance, Manage Online Exam, Manage
Questions, Assignment Submission, Holiday List.

```
.page-header > h3.page-title ("Manage Students")
.card > .card-body
  h4.card-title ("List Students")
  .row  → 1-3 <select class="form-control"> de filtro (turma, mês, status...)
  table.table  ← plugin "Bootstrap Table" (bootstrap-table.min.css)
    data-side-pagination="server"   (pede página ao servidor, não pagina no client)
    data-search="true"
    data-show-columns="true"        (usuário escolhe quais colunas ver)
    data-show-export="true"         (exporta txt/excel)
    data-sort-name / data-sort-order
    <thead> declara TODAS as colunas possíveis via data-field,
      várias com data-visible="false" (existem mas ficam ocultas até o
      usuário ativar em "show columns")
    coluna "operate" (Ação) renderizada via data-formatter/data-events
      em JS — não aparece no HTML estático, mas por padrão é um grupo
      de ícones (editar/excluir/ver) alinhado à direita
```

**Leitura pro nosso sistema:** isso é essencialmente uma tabela com
busca + paginação + colunas configuráveis + exportação. Não precisamos
replicar um plugin jQuery — dá pra fazer o equivalente com uma tabela
Server Component + `searchParams` pra filtro/paginação (mesmo padrão
que já usamos no calendário com `?mes=`), e adiar "colunas
configuráveis"/exportação pra quando/se um usuário realmente pedir.

### B. Formulário (8 das 30 telas)

Ex.: Students Admission (o maior, 46 campos), Create Assignment,
Create Lesson, Create Topic, Add Attendance, Apply Leave, Import
Questions.

```
.page-header > h3.page-title
.card > .card-body
  h4.card-title ("Create X")
  <form>
    .row > 3 colunas (form-group col-md-4) por linha
      <label>Campo <span class="text-danger">*</span></label>  ← obrigatório
      <input class="form-control">  |  <select class="form-control select2">
        (select2 = dropdown pesquisável, usado quando a lista é longa)
      upload de arquivo: botão "Upload" customizado + <small> de ajuda
      campos condicionais: um radio alterna qual bloco de campos
        aparece (ex.: Students Admission alterna "Parents" vs
        "Guardian" sem mudar de tela)
    <input class="btn btn-theme" type="submit" value="Submit">
```

**Campos reais do "Create Assignment"** (mapeia direto pro item 1.1 —
Tarefas — do [ROADMAP.md](../ROADMAP.md)): Session Year, Class
Section, Subject, Assignment Name, Assignment Instructions, Files,
Submission Due Date, Points, Resubmission Allowed, Extra Days for
Resubmission. Vale incorporar "Points" (nota máxima) e "Resubmission
Allowed" (permitir reenvio) no schema da tarefa — não estavam
cobertos no roadmap original.

**Leitura pro nosso sistema:** já seguimos esse molde (grid de 2
colunas em vez de 3, mas mesma ideia de rótulo + campo obrigatório
marcado). O que vale adotar: o padrão de **campo condicional via
seleção** (radio/select mostra/esconde outro campo) pra formulários
que temos hoje como "tudo sempre visível".

### C. Criar + Listar na mesma tela (ex.: Announcement)

Entidades simples (sem dezenas de campos) combinam os padrões A e B
na mesma página: card de formulário de criação em cima, card de lista
embaixo — sem precisar de uma rota separada de "criar". Já é
exatamente o que fizemos em `/professor/alunos` e
`/professor/agendamentos`.

### D. Modal de CRUD (visto em Student Leave Requests e outras)

Bootstrap padrão: `.modal.fade > .modal-dialog > .modal-content >
.modal-header (h5.modal-title) / .modal-body (o formulário) /
.modal-footer (botões)`. Usado pra editar um registro sem sair da
tela de lista — mesmo padrão que já implementamos no modal de detalhe
do `CalendarioMensal.tsx`.

### E. Telas dirigidas por JS (Class/Teacher Timetable)

HTML estático vem quase vazio (`<div class="set_timetable
timetable-grid"></div>` sem conteúdo) — a grade de horário só é
montada depois que o usuário escolhe uma turma e o JS busca os dados.
Não dá pra replicar o "layout" dessas a partir da captura estática;
precisaria de uma captura depois de interagir com a tela (fora do
escopo do crawler atual, que não clica em nada).

---

## 5. Mapeamento pro nosso projeto

| eSchool | Nosso projeto hoje | Gap |
|---|---|---|
| Topbar com seletor de ano letivo, idioma, perfil | Sidebar simples com chip de usuário no rodapé (sem topbar) | Não temos topbar fixa nem dropdown de perfil com ações (trocar senha, sair) |
| Sidebar com busca + accordion de submenus | Sidebar plana, sem busca, sem submenu | Ok pro nosso volume atual de itens (4-5 por papel); busca só valeria a pena se a lista crescer muito (Fase 1+ do roadmap) |
| Dashboard: stat row + 2 linhas de 3 widget cards, cada um com filtro próprio e estado vazio nomeado | Painel do professor já tem stat row (`app/professor/page.tsx`) + calendário | Faltam os widgets "Timetable de hoje", "Licenças/Faltas", "Avisos" — que batem direto com a Fase 1 do roadmap (tarefas, avisos, relatório) |
| Estado vazio específico por widget | Já fazemos isso em várias telas (“Nenhum aluno cadastrado ainda.” etc.) | Nenhum — já seguimos essa prática |
| Sombra de card com tom azul-acinzentado neutro | Cards usam só `border` + `bg-white`, sem sombra | Vale adotar a mesma receita de sombra (seção 3) pra dar mais profundidade sem fugir da nossa paleta |
| Skeleton de carregamento por widget | Nada — nossos widgets carregam via server component (sem loading client-side) | Não é necessário enquanto os dados vierem renderizados no servidor (Next.js RSC já evita esse problema por natureza) |

**Conclusão prática:** a arquitetura de informação do dashboard do
eSchool (stat row + grade de widget cards, cada um com filtro e estado
vazio próprios) é o padrão mais replicável e mais valioso daqui — e já
é essencialmente o que a Fase 1 do roadmap (tarefas, avisos, relatório
do aluno) pede pra construir. Ao implementar cada item da Fase 1, vale
seguir esse mesmo formato de card em vez de inventar um layout novo.

---

## 6. Próximas capturas úteis

O crawler já cobriu lista, relatório, formulário e modal (seção 4.5) —
o que ainda falta:

1. **Tela de login** — fica fora da sidebar, o crawler não alcança;
   precisa da captura de página única de novo, em `/login`.
2. **Um login de Admin** (não Teacher) — pra ver o menu completo
   (Fees, Staff/Payroll, Settings, Transportation) que embasa as Fases
   2-4 do roadmap. Rodar o mesmo crawler nesse login traria mais ~15-20
   telas novas.
3. **Interagir com uma tela dirigida por JS** (ex.: escolher uma turma
   em "Class Timetable" e *então* rodar a captura de página única) —
   o crawler não clica em nada, então essas telas vieram vazias.
4. **A própria coluna "Ação" das tabelas** — não aparece no HTML
   estático (é montada via JS). Uma captura de página única *depois*
   de a tabela carregar (usando o script original, não o crawler)
   pegaria os botões reais de editar/excluir.
