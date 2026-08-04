"use client";

import { useState } from "react";
import {
  registrarPagamento,
  estornarPagamento,
  aprovarComprovante,
  rejeitarComprovante,
} from "../actions";

type Comprovante = {
  id: string;
  nomeArquivo: string | null;
  urlAssinada: string | null;
};

type Props = {
  parcelaId: string;
  numero: number;
  valorCentavos: number;
  statusEfetivo: "pendente" | "paga" | "atrasada" | "cancelada";
  comprovantePendente: Comprovante | null;
};

function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

export default function AcoesParcela({
  parcelaId,
  numero,
  valorCentavos,
  statusEfetivo,
  comprovantePendente,
}: Props) {
  const [formAberto, setFormAberto] = useState<"pagamento" | "estorno" | "comprovante" | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; erro: string | null } | null>(null);

  async function handlePagamento(formData: FormData) {
    setEnviando(true);
    const res = await registrarPagamento(parcelaId, formData);
    setResultado(res.ok ? { ok: true, erro: null } : { ok: false, erro: res.erro });
    setEnviando(false);
    if (res.ok) setFormAberto(null);
  }

  async function handleEstorno(formData: FormData) {
    setEnviando(true);
    const res = await estornarPagamento(parcelaId, formData);
    setResultado(res.ok ? { ok: true, erro: null } : { ok: false, erro: res.erro });
    setEnviando(false);
    if (res.ok) setFormAberto(null);
  }

  async function handleAprovarComprovante(formData: FormData) {
    if (!comprovantePendente) return;
    setEnviando(true);
    const res = await aprovarComprovante(comprovantePendente.id, formData);
    setResultado(res);
    setEnviando(false);
    if (res.ok) setFormAberto(null);
  }

  async function handleRejeitarComprovante(formData: FormData) {
    if (!comprovantePendente) return;
    setEnviando(true);
    await rejeitarComprovante(comprovantePendente.id, formData);
    setEnviando(false);
    setFormAberto(null);
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap gap-3">
        {(statusEfetivo === "pendente" || statusEfetivo === "atrasada") && (
          <button
            type="button"
            onClick={() => setFormAberto(formAberto === "pagamento" ? null : "pagamento")}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Registrar pagamento
          </button>
        )}
        {statusEfetivo === "paga" && (
          <button
            type="button"
            onClick={() => setFormAberto(formAberto === "estorno" ? null : "estorno")}
            className="text-xs font-semibold text-bad hover:underline"
          >
            Estornar
          </button>
        )}
        {statusEfetivo === "paga" && (
          <a
            href={`/api/financeiro/recibos/${parcelaId}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-ink/60 hover:underline"
          >
            Baixar recibo
          </a>
        )}
        {comprovantePendente && (
          <button
            type="button"
            onClick={() => setFormAberto(formAberto === "comprovante" ? null : "comprovante")}
            className="text-xs font-semibold text-warn hover:underline"
          >
            Ver comprovante enviado
          </button>
        )}
      </div>

      {resultado && !resultado.ok && (
        <p className="text-xs text-bad mt-2" role="alert">
          {resultado.erro}
        </p>
      )}

      {formAberto === "pagamento" && (
        <form
          action={handlePagamento}
          className="mt-2 grid grid-cols-2 gap-2 bg-paper border border-line rounded-lg p-3"
        >
          <div>
            <label className="block text-xs mb-1" htmlFor={`valor_pago_${parcelaId}`}>
              Valor pago (R$)
            </label>
            <input
              id={`valor_pago_${parcelaId}`}
              name="valor_pago"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={centavosParaReais(valorCentavos)}
              className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor={`data_pagamento_${parcelaId}`}>
              Data do pagamento
            </label>
            <input
              id={`data_pagamento_${parcelaId}`}
              name="data_pagamento"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs mb-1" htmlFor={`metodo_${parcelaId}`}>
              Método
            </label>
            <select
              id={`metodo_${parcelaId}`}
              name="metodo_pagamento"
              defaultValue="pix"
              className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
            >
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="transferencia">Transferência</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-accent text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {enviando ? "Salvando..." : `Confirmar pagamento da parcela ${numero}`}
            </button>
          </div>
        </form>
      )}

      {formAberto === "estorno" && (
        <form
          action={handleEstorno}
          className="mt-2 flex flex-wrap items-end gap-2 bg-paper border border-line rounded-lg p-3"
        >
          <div className="flex-1 min-w-[10rem]">
            <label className="block text-xs mb-1" htmlFor={`motivo_estorno_${parcelaId}`}>
              Motivo (opcional)
            </label>
            <input
              id={`motivo_estorno_${parcelaId}`}
              name="motivo"
              className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg border border-bad text-bad px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {enviando ? "Estornando..." : "Confirmar estorno"}
          </button>
        </form>
      )}

      {formAberto === "comprovante" && comprovantePendente && (
        <div className="mt-2 bg-paper border border-line rounded-lg p-3 space-y-2">
          {comprovantePendente.urlAssinada && (
            <a
              href={comprovantePendente.urlAssinada}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-accent hover:underline"
            >
              Abrir {comprovantePendente.nomeArquivo ?? "arquivo enviado"}
            </a>
          )}
          <form action={handleAprovarComprovante} className="grid grid-cols-2 gap-2">
            <input type="hidden" name="valor_pago" value={centavosParaReais(valorCentavos)} />
            <input type="hidden" name="data_pagamento" value={new Date().toISOString().slice(0, 10)} />
            <input type="hidden" name="metodo_pagamento" value="comprovante" />
            <button
              type="submit"
              disabled={enviando}
              className="col-span-2 rounded-lg bg-good text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              Aprovar e dar baixa
            </button>
          </form>
          <form action={handleRejeitarComprovante} className="flex gap-2">
            <input
              name="motivo"
              placeholder="Motivo da rejeição"
              className="flex-1 rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg border border-bad text-bad px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              Rejeitar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
