"use client";

import { useState } from "react";
import { emailValido } from "@/lib/validacao";

const CLASSE_BASE =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";

export default function CampoEmail({
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

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const valor = e.target.value.trim();
    setErro(valor && !emailValido(valor) ? "E-mail em formato inválido." : null);
  }

  return (
    <div>
      <input
        id={id}
        name={name}
        type="email"
        required={required}
        defaultValue={defaultValue ?? undefined}
        placeholder="nome@exemplo.com"
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
