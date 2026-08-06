"use client";

import { useState } from "react";
import { aplicarMascaraTelefone } from "@/lib/mascaras/telefone";
import { telefoneValido } from "@/lib/validacao";

const CLASSE_BASE =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";

/**
 * Placeholder mostra o formato antes do usuário começar a digitar;
 * a máscara reformata em tempo real enquanto ele digita (sempre a
 * partir dos dígitos brutos, então colar um número já formatado não
 * duplica caractere); e a validação de verdade roda no blur (e,
 * de qualquer forma, no backend) — a máscara sozinha não garante
 * DDD/quantidade de dígitos válidos.
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
  const [erro, setErro] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = aplicarMascaraTelefone(e.target.value);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const valor = e.target.value.trim();
    setErro(valor && !telefoneValido(valor) ? "Telefone em formato inválido." : null);
  }

  return (
    <div>
      <input
        id={id}
        name={name}
        type="tel"
        required={required}
        defaultValue={defaultValue ? aplicarMascaraTelefone(defaultValue) : undefined}
        placeholder="(11) 99999-9999"
        onChange={handleChange}
        onBlur={handleBlur}
        className={className ?? `${CLASSE_BASE} ${erro ? "border-bad" : "border-line"}`}
      />
      {erro && (
        <p className="text-xs text-bad mt-1" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
