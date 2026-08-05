import { getProfile } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";
import Sidebar from "./Sidebar";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <DashboardShell
      nome={profile?.nome}
      papel="Professor"
      cadastroHref="/professor/cadastro"
      painelHref="/professor"
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
}
