import { createClient, getProfile } from "@/lib/supabase/server";
import { buscarNotificacoesSino } from "@/lib/notificacoes";
import DashboardShell from "@/components/DashboardShell";
import Sidebar from "./Sidebar";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  const notificacoes = await buscarNotificacoesSino(createClient(), profile?.id);

  return (
    <DashboardShell
      nome={profile?.nome}
      papel="Aluno"
      cadastroHref="/aluno/cadastro"
      painelHref="/aluno"
      notificacoes={notificacoes}
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
}
