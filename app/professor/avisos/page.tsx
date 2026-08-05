import { createClient, getProfile } from "@/lib/supabase/server";
import EstadoVazio from "@/components/EstadoVazio";
import NovoAvisoForm from "./NovoAvisoForm";

function formatarDataHora(iso: string) {
  const dt = new Date(iso);
  return `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default async function AvisosPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const { data: avisos } = await supabase
    .from("notificacoes")
    .select("id, envio_id, titulo, mensagem, destinatario_id, created_at")
    .eq("tipo", "aviso_professor")
    .eq("remetente_id", profile?.id)
    .order("created_at", { ascending: false });

  const listaAvisos = avisos ?? [];
  const destinatarioIds = [...new Set(listaAvisos.map((a) => a.destinatario_id))];
  const { data: alunosDestinatarios } = destinatarioIds.length
    ? await supabase.from("alunos").select("profile_id, nome").in("profile_id", destinatarioIds)
    : { data: [] };
  const nomePorProfileId = new Map((alunosDestinatarios ?? []).map((a) => [a.profile_id, a.nome]));

  type Grupo = { titulo: string; mensagem: string; created_at: string; destinatarios: string[] };
  const grupos = new Map<string, Grupo>();
  for (const a of listaAvisos) {
    const chave = a.envio_id ?? a.id;
    const grupo = grupos.get(chave) ?? {
      titulo: a.titulo,
      mensagem: a.mensagem,
      created_at: a.created_at,
      destinatarios: [] as string[],
    };
    grupo.destinatarios.push(a.destinatario_id);
    grupos.set(chave, grupo);
  }
  const avisosAgrupados = [...grupos.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Avisos</h1>

      <div className="max-w-2xl space-y-8">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Novo aviso</h2>
          <NovoAvisoForm alunos={alunos ?? []} />
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Avisos publicados</h2>
          {avisosAgrupados.length === 0 ? (
            <EstadoVazio texto="Nenhum aviso publicado ainda." />
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
              {avisosAgrupados.map((a, i) => {
                const destinatario =
                  a.destinatarios.length === 1
                    ? nomePorProfileId.get(a.destinatarios[0]) ?? "Aluno"
                    : `Geral (${a.destinatarios.length} alunos)`;
                return (
                  <li key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{a.titulo}</p>
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-accentSoft text-accent shrink-0">
                        {destinatario}
                      </span>
                    </div>
                    <p className="text-sm text-ink/60 mt-1">{a.mensagem}</p>
                    <p className="text-xs text-ink/40 mt-1">{formatarDataHora(a.created_at)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
