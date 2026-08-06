import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import NovaTarefaForm from "../NovaTarefaForm";

export default async function NovaTarefaPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <Link
        href="/professor/tarefas"
        className="text-sm text-ink/50 hover:text-ink transition-colors"
      >
        ← Voltar
      </Link>
      <h1 className="font-display font-semibold text-3xl mt-2 mb-8">Nova tarefa</h1>

      <div className="max-w-3xl">
        <NovaTarefaForm alunos={alunos ?? []} />
      </div>
    </main>
  );
}
