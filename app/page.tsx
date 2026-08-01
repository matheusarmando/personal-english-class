import Link from "next/link";
import styles from "./page.module.css";
import FaqAccordion from "./FaqAccordion";

const FEATURES = [
  {
    titulo: "Alunos e turmas",
    desc: "Cadastro completo, histórico de aulas, frequência e evolução de cada aluno.",
    cor: undefined,
  },
  {
    titulo: "Atividades e provas",
    desc: "Monte, envie, corrija e devolva com nota — o aluno vê tudo na área dele.",
    cor: "var(--accent-soft-2)",
  },
  {
    titulo: "WhatsApp integrado",
    desc: "Lembrete de aula, aviso de prova e feedback enviados automaticamente.",
    cor: "var(--accent-soft-3)",
  },
  {
    titulo: "Financeiro",
    desc: "PIX copia e cola por aluno, quem pagou, quem deve e o fechamento do mês.",
    cor: undefined,
  },
  {
    titulo: "Vitrine pública",
    desc: "Seu perfil aparece na busca — alunos novos chegam sem você caçar.",
    cor: "var(--accent-soft-2)",
  },
  {
    titulo: "Área do aluno",
    desc: "Materiais, notas, agenda e histórico — sem virar bagunça no chat.",
    cor: "var(--accent-soft-3)",
  },
];

const PASSOS = [
  {
    num: "01",
    titulo: "Crie seu perfil",
    desc: "Descreva sua aula, defina preço e horários disponíveis.",
  },
  {
    num: "02",
    titulo: "Receba alunos",
    desc: "Alunos encontram você na busca e agendam a primeira aula.",
  },
  {
    num: "03",
    titulo: "Gerencie tudo",
    desc: "Turmas, materiais, avisos e pagamentos num painel só.",
  },
];

const FAQ = [
  {
    pergunta: "Preciso saber mexer em tecnologia?",
    resposta:
      "Não. Se você usa WhatsApp, usa a Personal Class. O cadastro leva cinco minutos.",
  },
  {
    pergunta: "Como funciona a integração com o WhatsApp?",
    resposta:
      "Você conecta seu número uma vez. Depois disso, lembretes de aula, avisos de prova e feedbacks saem automaticamente nos horários que você definir.",
  },
  {
    pergunta: "Eu recebo o pagamento dos alunos por aqui?",
    resposta:
      "Você registra um PIX copia e cola por aluno e acompanha quem pagou e quem está atrasado. Cobrança automática recorrente ainda está a caminho.",
  },
  {
    pergunta: "Meus alunos precisam pagar algo?",
    resposta:
      "Não. A área do aluno é gratuita: ele vê agenda, materiais, atividades e notas.",
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.siteHeader}>
        <div className={styles.wrap}>
          <Link className={styles.logo} href="#topo">
            <span className={styles.mark}>PC</span>
            <span>
              Personal<span className={styles.muted}> Class</span>
            </span>
          </Link>
          <nav className={styles.nav}>
            <a href="#produto">Produto</a>
            <a href="#como">Como funciona</a>
            <a href="#precos">Preços</a>
            <a href="#faq">Dúvidas</a>
          </nav>
          <div className={styles.headerCta}>
            <Link className={styles.login} href="/login">
              Entrar
            </Link>
            <Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href="/cadastro">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero} id="topo">
          <div className={styles.wrap}>
            <span className={styles.pill}>Novo · avisos automáticos pelo WhatsApp</span>
            <h1>O sistema completo de quem vive de dar aula particular</h1>
            <p className={styles.lead}>
              Anuncie suas aulas, receba alunos e cuide de turmas, atividades, provas, avisos e
              recebimentos — com calma, num lugar só.
            </p>
            <div className={styles.ctaRow}>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/cadastro">
                Criar conta grátis
              </Link>
              <a className={`${styles.btn} ${styles.btnGhost}`} href="#como">
                Ver como funciona
              </a>
            </div>
            <span className={styles.note}>30 dias grátis · sem cartão de crédito</span>
            <div className={styles.shot}>
              <div className={styles.dots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className={styles.placeholder}>
                <small>print: painel do professor — agenda, turmas, financeiro</small>
              </div>
            </div>
          </div>
        </section>

        <section id="produto" className={styles.section} style={{ paddingTop: 80 }}>
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Tudo num lugar</span>
              <h2>Seis apps a menos na sua rotina</h2>
            </div>
            <div className={styles.grid3}>
              {FEATURES.map((f) => (
                <article key={f.titulo} className={styles.card}>
                  <span className={styles.icon} style={f.cor ? { background: f.cor } : undefined} />
                  <h3>{f.titulo}</h3>
                  <p>{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como" className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.steps}>
              {PASSOS.map((p) => (
                <div key={p.num} className={styles.step}>
                  <span className={styles.num}>{p.num}</span>
                  <h3>{p.titulo}</h3>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap}>
            <span className={styles.exemploTag}>Exemplo — substituir por métricas reais</span>
            <div className={styles.stats} style={{ marginTop: 16 }}>
              <div className={styles.stat}>
                <b>7h</b>
                <span>economizadas por semana em tarefa administrativa</span>
              </div>
              <div className={styles.stat}>
                <b>−38%</b>
                <span>de falta com lembrete automático no WhatsApp</span>
              </div>
              <div className={styles.stat}>
                <b>1 lugar</b>
                <span>para alunos, aulas, provas e dinheiro</span>
              </div>
            </div>
          </div>
        </section>

        <section id="precos" className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <h2>Preço que cabe no seu mês</h2>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-60)" }}>
                Comece de graça e mude de plano quando sua agenda crescer.
              </p>
            </div>
            <div className={styles.grid3}>
              <div className={styles.plan}>
                <span className={styles.tier}>Começo</span>
                <span className={styles.price}>Grátis</span>
                <span className={styles.desc}>Até 5 alunos ativos · perfil na vitrine</span>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/cadastro">
                  Criar conta
                </Link>
              </div>
              <div className={`${styles.plan} ${styles.featured}`}>
                <span className={styles.tier}>Professor</span>
                <span className={styles.price}>
                  R$ 49<em>/mês</em>
                </span>
                <span className={styles.desc}>Alunos ilimitados · WhatsApp · financeiro</span>
                <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/cadastro">
                  Testar 30 dias
                </Link>
              </div>
              <div className={styles.plan}>
                <span className={styles.tier}>Escola</span>
                <span className={styles.price}>Sob medida</span>
                <span className={styles.desc}>Vários professores · relatórios e marca própria</span>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/cadastro">
                  Falar com a gente
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap}>
            <span className={styles.exemploTag}>Depoimento de exemplo</span>
            <div className={styles.quote} style={{ marginTop: 16 }}>
              <div>
                <blockquote>
                  &ldquo;Eu dava aula de violão para 22 alunos e controlava tudo no caderno. Hoje
                  é um clique.&rdquo;
                </blockquote>
                <cite>Marina Alves · professora de violão, Curitiba</cite>
              </div>
              <div className={styles.placeholder}>
                <small>foto: professora depoimento</small>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className={styles.section}>
          <div className={styles.wrap}>
            <FaqAccordion itens={FAQ} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.final}>
              <h2>Sua próxima turma começa aqui</h2>
              <p>Crie seu perfil em cinco minutos e teste tudo por 30 dias, sem cartão.</p>
              <div className={styles.ctaRow}>
                <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/cadastro">
                  Criar perfil de professor
                </Link>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/cadastro">
                  Procurar aulas
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.siteFooter}>
        <div className={styles.wrap}>
          <div className={styles.footBrand}>
            <span className={styles.mark}>PC</span>
            <span>© 2026 Personal Class</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
