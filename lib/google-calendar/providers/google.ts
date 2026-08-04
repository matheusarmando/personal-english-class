import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarProvider } from "./tipo";
import { verificarConflito } from "../conflito";
import { sincronizarConta } from "../sync";

export class GoogleCalendarProvider implements CalendarProvider {
  constructor(private readonly supabase: SupabaseClient) {}

  async verificarOcupacao(professorId: string, inicio: Date, fim: Date) {
    return verificarConflito(this.supabase, professorId, inicio, fim);
  }

  async sincronizar(accountId: string): Promise<void> {
    await sincronizarConta(this.supabase, accountId);
  }
}
