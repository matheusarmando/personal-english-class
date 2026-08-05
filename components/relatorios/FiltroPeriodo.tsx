/** Form GET simples (sem client component) — recarrega a própria página com ?de=&ate= novos. */
export default function FiltroPeriodo({ de, ate }: { de: string; ate: string }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-2 mb-6 bg-white border border-line rounded-xl p-3">
      <div>
        <label className="block text-xs mb-1" htmlFor="de">
          De
        </label>
        <input
          id="de"
          name="de"
          type="date"
          defaultValue={de}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div>
        <label className="block text-xs mb-1" htmlFor="ate">
          Até
        </label>
        <input
          id="ate"
          name="ate"
          type="date"
          defaultValue={ate}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent transition-colors"
      >
        Filtrar
      </button>
    </form>
  );
}
