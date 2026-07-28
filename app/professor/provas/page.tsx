export default function ProvasPage() {
  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Provas</h1>

      <div className="max-w-xl border border-line rounded-xl bg-white p-8 text-center">
        <p className="text-sm font-semibold mb-1">Em breve</p>
        <p className="text-sm text-ink/60">
          Montar provas com correção automática (múltipla escolha e
          dissertativa) está planejado no item 2.1 do roadmap do projeto —
          ainda não foi construído.
        </p>
      </div>
    </main>
  );
}
