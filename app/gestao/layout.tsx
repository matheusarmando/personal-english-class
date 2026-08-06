import { createClient, getProfile } from "@/lib/supabase/server";
import { buscarNotificacoesSino } from "@/lib/notificacoes";
import DashboardShell from "@/components/DashboardShell";
import Sidebar from "./Sidebar";

export default async function GestaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  const notificacoes = await buscarNotificacoesSino(createClient(), profile?.id);

  return (
    <DashboardShell
      nome={profile?.nome}
      papel="Gestão"
      painelHref="/gestao"
      notificacoes={notificacoes}
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
}
