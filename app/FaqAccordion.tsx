"use client";

import { useState } from "react";
import styles from "./page.module.css";

type Item = { pergunta: string; resposta: string };

export default function FaqAccordion({ itens }: { itens: Item[] }) {
  const [abertoIndex, setAbertoIndex] = useState(0);

  return (
    <div className={styles.faq}>
      <h2>Dúvidas frequentes</h2>
      {itens.map((item, i) => {
        const aberto = i === abertoIndex;
        return (
          <div
            key={item.pergunta}
            className={`${styles.faqItem} ${aberto ? styles.faqItemOpen : ""}`}
          >
            <button
              type="button"
              className={styles.faqSummary}
              aria-expanded={aberto}
              onClick={() => setAbertoIndex(aberto ? -1 : i)}
            >
              {item.pergunta}
            </button>
            {aberto && <p>{item.resposta}</p>}
          </div>
        );
      })}
    </div>
  );
}
