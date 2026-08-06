"use client";

import { useState } from "react";
import { aplicarMascaraTelefone } from "@/lib/mascaras/telefone";
import { telefoneValido } from "@/lib/validacao";
import { DDIS, extrairDdiENumero } from "@/lib/mascaras/ddi";

const CLASSE_BASE =
  "rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";

/**
 * O campo em si (máscara, placeholder, validação no blur) fica
 * exatamente como era — só ganhou um select de DDI ao lado. O valor
 * final submetido combina os dois ("+55 (11) 99999-9999"); a
 * validação de dígitos já aceitava esse tamanho (DDI + DDD + número),
 * então nenhuma mudança de backend foi necessária.
 */

export default function CampoTelefone({
  id,
  name,
  defaultValue,
  required,
  className,
}: {
  id?: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  className?: string;
}) {
  const inicial = extrairDdiENumero(defaultValue);
  const [ddi, setDdi] = useState(inicial.ddi);
  const [numero, setNumero] = useState(inicial.numero ? aplicarMascaraTelefone(inicial.numero) : "");
  const [erro, setErro] = useState<string | null>(null);

  const valorCombinado = numero ? `+${ddi} ${numero}` : "";

  function handleChangeNumero(e: React.ChangeEvent<HTMLInputElement>) {
    setNumero(aplicarMascaraTelefone(e.target.value));
  }

  function handleBlur() {
    setErro(numero && !telefoneValido(numero) ? "Telefone em formato inválido." : null);
  }

  return (
    <div>
      <input type="hidden" name={name} value={valorCombinado} />
      <div className="flex gap-2">
        <select
          value={ddi}
          onChange={(e) => setDdi(e.target.value)}
          aria-label="Código do país"
          className={`${CLASSE_BASE} border-line shrink-0 w-32 truncate`}
        >
          {DDIS.map((d) => (
            <option key={d.codigo} value={d.codigo}>
              +{d.codigo} {d.pais}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          required={required}
          value={numero}
          placeholder="(11) 99999-9999"
          onChange={handleChangeNumero}
          onBlur={handleBlur}
          className={className ?? `flex-1 min-w-0 ${CLASSE_BASE} ${erro ? "border-bad" : "border-line"}`}
        />
      </div>
      {erro && (
        <p className="text-xs text-bad mt-1" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
