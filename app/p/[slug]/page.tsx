import { createClient } from "@/lib/supabase/server";
import FormularioSolicitacao from "./FormularioSolicitacao";

export default async function PaginaPublicaProfessor({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data } = (await supabase
    .rpc("perfil_publico_por_slug", { p_slug: params.slug })
    .maybeSingle()) as {
    data: { id: string; nome: string; bio: string | null; preco_aula: number | null } | null;
  };

  if (!data) {
    return (
      <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
        <p className="text-sm text-ink/60">Esta página não existe ou não está ativa.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink px-6 py-16">
      <div className="mx-auto max-w-lg">
        <div className="bg-white border border-line rounded-2xl p-8 mb-6">
          <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
            Professor(a) de inglês
          </p>
          <h1 className="font-display font-bold text-3xl mb-3">{data.nome}</h1>
          {data.bio && <p className="text-sm text-ink/70 leading-relaxed mb-4">{data.bio}</p>}
          {data.preco_aula && (
            <p className="text-sm font-semibold">
              A partir de{" "}
              {Number(data.preco_aula).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}{" "}
              <span className="font-normal text-ink/50">por aula</span>
            </p>
          )}
        </div>

        <div className="bg-white border border-line rounded-2xl p-8">
          <h2 className="font-display font-semibold text-lg mb-4">Quero uma aula</h2>
          <FormularioSolicitacao slug={params.slug} />
        </div>
      </div>
    </main>
  );
}
