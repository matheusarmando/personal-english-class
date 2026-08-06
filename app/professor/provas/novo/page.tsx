import Link from "next/link";
import NovaProvaForm from "../NovaProvaForm";

export default function NovaProvaPage() {
  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <Link
        href="/professor/provas"
        className="text-sm text-ink/50 hover:text-ink transition-colors"
      >
        ← Voltar
      </Link>
      <h1 className="font-display font-semibold text-3xl mt-2 mb-8">Nova prova</h1>

      <div className="max-w-2xl">
        <NovaProvaForm />
      </div>
    </main>
  );
}
