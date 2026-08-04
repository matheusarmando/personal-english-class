"use client";

import { useState } from "react";
import { editarContrato } from "../actions";

type Props = {
  contratoId: string;
  valorParcelaCentavosAtual: number;
  diaVencimentoAtual: number;
  numeroParcelasAtual: number;
};

export default function EditarContratoForm({
  contratoId,
  valorParcelaCentavosAtual,
  diaVencimentoAtual,
  numeroParcelasAtual,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; erro: string | null } | null>(null);

  async function handleSubmit(formData: FormData) {
    setSalvando(true);
    const res = await editarContrato(contratoId, formData);
    setResultado(res);
    setSalvando(false);
    if (res.ok) setAberto(false);
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-xs font-semibold text-accent hover:underline"
      >
        Editar contrato
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-3 grid grid-cols-2 gap-3 bg-paper border border-line rounded-lg p-4">
      <p className="col-span-2 text-xs text-ink/60">
        Só as parcelas ainda não pagas são regravadas com os novos valores, a
        partir de hoje. Parcelas já pagas não são alteradas.
      </p>

      <div>
        <label className="block text-xs mb-1" htmlFor="valor_parcela_edit">
          Valor da parcela (R$)
        </label>
        <input
          id="valor_parcela_edit"
          name="valor_parcela"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={(valorParcelaCentavosAtual / 100).toFixed(2)}
          className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
        />
      </div>

      <div>
        <label className="block text-xs mb-1" htmlFor="dia_vencimento_edit">
          Dia de vencimento
        </label>
        <input
          id="dia_vencimento_edit"
          name="dia_vencimento"
          type="number"
          min="1"
          max="31"
          required
          defaultValue={diaVencimentoAtual}
          className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
        />
      </div>

      <div>
        <label className="block text-xs mb-1" htmlFor="numero_parcelas_edit">
          Total de parcelas
        </label>
        <input
          id="numero_parcelas_edit"
          name="numero_parcelas"
          type="number"
          min="1"
          required
          defaultValue={numeroParcelasAtual}
          className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-xs mb-1" htmlFor="observacoes_edit">
          Observações
        </label>
        <input
          id="observacoes_edit"
          name="observacoes"
          className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-xs mb-1" htmlFor="motivo_edit">
          Motivo da alteração
        </label>
        <input
          id="motivo_edit"
          name="motivo"
          placeholder="Ex.: reajuste combinado com o aluno"
          className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
        />
      </div>

      {resultado && !resultado.ok && (
        <p className="col-span-2 text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}

      <div className="col-span-2 flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-accent text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
