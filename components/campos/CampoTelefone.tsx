"use client";

import { aplicarMascaraTelefone } from "@/lib/mascaras/telefone";

const CLASSE_PADRAO =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";

/** Drop-in pro <input type="tel">: mesmo visual, mesmos props, só formata enquanto digita. */
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
  return (
    <input
      id={id}
      name={name}
      type="tel"
      required={required}
      defaultValue={defaultValue ? aplicarMascaraTelefone(defaultValue) : undefined}
      onChange={(e) => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
      }}
      className={className ?? CLASSE_PADRAO}
    />
  );
}
