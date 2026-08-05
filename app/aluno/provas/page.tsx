import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import EstadoVazio from "@/components/EstadoVazio";

export default async function AlunoProvasPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id")
    .eq("profile_id", profile?.id)
    .maybeSingle();

  const { data: atribuicoes } = aluno
    ? await supabase
        .from("prova_atribuicoes")
        .select("prova_id, nota, respondido_em")
        .eq("aluno_id", aluno.id)
    : { data: [] };

  const listaAtribuicoes = atribuicoes ?? [];
  const provaIds = listaAtribuicoes.map((a) => a.prova_id);

  const { data: provas } = provaIds.length
    ? await supabase.from("provas").select("id, titulo, data_aplicacao").in("id", provaIds)
    : { data: [] };

  const provaPorId = new Map((provas ?? []).map((p) => [p.id, p]));

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Provas</h1>

      <div className="max-w-2xl">
        {listaAtribuicoes.length === 0 ? (
          <EstadoVazio texto="Nenhuma prova atribuída ainda." />
        ) : (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
            {listaAtribuicoes.map((a) => {
              const prova = provaPorId.get(a.prova_id);
              // provas em rascunho já têm atribuição, mas o aluno não deve vê-las ainda
              if (!prova) return null;
              return (
                <li key={a.prova_id}>
                  <Link
                    href={`/aluno/provas/${a.prova_id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-accentSoft/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{prova.titulo}</p>
                      {prova.data_aplicacao && (
                        <p className="text-xs text-ink/50">
                          {new Date(prova.data_aplicacao + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                        a.respondido_em ? "bg-good/15 text-good" : "bg-warn/15 text-warn"
                      }`}
                    >
                      {a.respondido_em ? `Respondida · ${a.nota} pts` : "Pendente"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
