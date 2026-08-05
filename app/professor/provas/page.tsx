import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import EstadoVazio from "@/components/EstadoVazio";
import NovaProvaForm from "./NovaProvaForm";

const LABEL_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  encerrada: "Encerrada",
};

const CLASSE_STATUS: Record<string, string> = {
  rascunho: "bg-line/50 text-ink/60",
  publicada: "bg-good/15 text-good",
  encerrada: "bg-ink/10 text-ink/50",
};

export default async function ProvasPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: provas } = await supabase
    .from("provas")
    .select("id, titulo, status, data_aplicacao")
    .eq("professor_id", profile?.id)
    .order("created_at", { ascending: false });

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Provas</h1>

      <div className="max-w-2xl space-y-8">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Nova prova</h2>
          <NovaProvaForm />
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Todas as provas</h2>
          {!provas || provas.length === 0 ? (
            <EstadoVazio texto="Nenhuma prova criada ainda." />
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
              {provas.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/professor/provas/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-accentSoft/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.titulo}</p>
                      {p.data_aplicacao && (
                        <p className="text-xs text-ink/50">
                          {new Date(p.data_aplicacao + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${CLASSE_STATUS[p.status]}`}
                    >
                      {LABEL_STATUS[p.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
