import { createClient, getProfile } from "@/lib/supabase/server";
import { promoverUsuario } from "./actions";

const LABEL_ROLE: Record<string, string> = {
  aluno: "Aluno",
  professor: "Professor",
  gestor: "Gestão",
};

export default async function UsuariosPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, nome, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Usuários</h1>
        <span className="text-sm text-ink/50">Área de gestão</span>
      </div>

      <p className="text-sm text-ink/60 max-w-xl mb-6">
        Altere o papel de qualquer usuário do sistema. Use com cuidado —
        promover alguém a Gestão dá acesso a esta mesma tela.
      </p>

      <div className="max-w-2xl border border-line rounded-xl bg-white overflow-hidden">
        {!usuarios || usuarios.length === 0 ? (
          <p className="text-sm text-ink/60 px-5 py-4">
            Nenhum usuário cadastrado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {usuarios.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.nome}
                    {u.id === profile?.id && (
                      <span className="text-xs text-ink/40"> (você)</span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50">
                    Desde {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <form
                  action={promoverUsuario.bind(null, u.id)}
                  className="flex items-center gap-2 shrink-0"
                >
                  <select
                    name="role"
                    defaultValue={u.role}
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {Object.entries(LABEL_ROLE).map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent transition-colors"
                  >
                    Salvar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
