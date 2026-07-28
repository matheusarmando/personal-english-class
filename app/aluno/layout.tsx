import { getProfile } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";
import Sidebar from "./Sidebar";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <DashboardShell
      nome={profile?.nome}
      papel="Aluno"
      cadastroHref="/aluno/cadastro"
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
}
