import { createClient, getProfile } from "@/lib/supabase/server";
import CalendarioMensal from "@/components/CalendarioMensal";
import { chaveDia, resolverMesReferencia, type AulaDoDia } from "@/lib/calendario";

export default async function AlunoPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const mesRef = resolverMesReferencia(searchParams.mes);
  const inicioMes = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const fimMes = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);

  const { data: meuRegistroAluno } = await supabase
    .from("alunos")
    .select("id, link_aula, valor, status_pagamento, pix_copia_cola")
    .eq("profile_id", profile?.id);

  const meusRegistros = meuRegistroAluno ?? [];
  const meusRegistroIds = meusRegistros.map((a) => a.id);
  const dadosPorRegistroId = new Map(meusRegistros.map((a) => [a.id, a]));

  const { data: horariosDoMes } = meusRegistroIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("id, data_hora, aluno_id")
        .in("aluno_id", meusRegistroIds)
        .gte("data_hora", inicioMes.toISOString())
        .lt("data_hora", fimMes.toISOString())
        .order("data_hora")
    : { data: [] };

  const aulasPorDia: Record<string, AulaDoDia[]> = {};
  for (const h of horariosDoMes ?? []) {
    const dt = new Date(h.data_hora);
    const hora = dt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const registro = dadosPorRegistroId.get(h.aluno_id);
    (aulasPorDia[chaveDia(dt)] ??= []).push({
      id: h.id,
      hora,
      titulo: "Aula agendada",
      linkAula: registro?.link_aula,
      valor: registro?.valor,
      statusPagamento: registro?.status_pagamento,
      pixCopiaCola: registro?.pix_copia_cola,
    });
  }

  const { data: presencas } = await supabase
    .from("presencas")
    .select("presente, aulas(titulo, data, turmas(nome))")
    .eq("aluno_id", profile?.id)
    .order("created_at", { ascending: false });

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display text-3xl mb-8">Olá, {profile?.nome}</h1>

      <section className="max-w-3xl mb-10">
        <h2 className="font-display text-lg mb-3">Minhas aulas do mês</h2>
        <CalendarioMensal
          mesRef={mesRef}
          aulasPorDia={aulasPorDia}
          baseHref="/aluno"
        />
      </section>

      <section className="max-w-xl">
        <h2 className="font-display text-lg mb-3">Minha frequência</h2>
        {!presencas || presencas.length === 0 ? (
          <p className="text-sm text-ink/60">
            Nenhum registro de presença ainda.
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white/60">
            {presencas.map((p: any, i: number) => (
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{p.aulas?.titulo}</p>
                  <p className="text-xs text-ink/50">
                    {p.aulas?.turmas?.nome} · {p.aulas?.data}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    p.presente
                      ? "bg-accentSoft text-accent"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {p.presente ? "Presente" : "Ausente"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
