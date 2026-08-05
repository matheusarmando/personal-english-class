"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";
import { GoogleCalendarProvider } from "@/lib/google-calendar/providers/google";
import { converterParaInstanteUTC } from "@/lib/google-calendar/timezone";
import { emailValido, telefoneValido } from "@/lib/validacao";

export type ResultadoAgendamento =
  | { ok: true }
  | { ok: false; conflito: true; tituloConflito: string | null; inicioConflito: string; fimConflito: string }
  | { ok: false; conflito: false; erro: string };

const DURACAO_PADRAO_MINUTOS = 60;

export async function criarAgendamentoAvulso(formData: FormData): Promise<ResultadoAgendamento> {
  const profile = await getProfile();
  if (!profile) return { ok: false, conflito: false, erro: "Não autenticado." };

  const supabase = createClient();
  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const telefone = formData.get("telefone") as string;
  const tipo = formData.get("tipo") as string;
  const data = formData.get("data") as string;
  const hora = formData.get("hora") as string;
  const observacoes = formData.get("observacoes") as string;
  const forcarAgendamento = formData.get("forcar_agendamento") === "on";

  if (!data || !hora) return { ok: false, conflito: false, erro: "Preencha data e hora." };
  // type="email"/type="tel" no input só ajuda o teclado do navegador —
  // não impede um POST forjado com valor qualquer, daí a checagem aqui.
  if (email && !emailValido(email)) {
    return { ok: false, conflito: false, erro: "E-mail em formato inválido." };
  }
  if (telefone && !telefoneValido(telefone)) {
    return { ok: false, conflito: false, erro: "Telefone em formato inválido." };
  }

  const inicio = converterParaInstanteUTC(data, hora, profile.timezone ?? "America/Sao_Paulo");
  const fim = new Date(inicio.getTime() + DURACAO_PADRAO_MINUTOS * 60 * 1000);

  if (!forcarAgendamento) {
    const provider = new GoogleCalendarProvider(supabase);
    const { conflito } = await provider.verificarOcupacao(profile.id, inicio, fim);
    if (conflito) {
      return {
        ok: false,
        conflito: true,
        tituloConflito: conflito.titulo,
        inicioConflito: conflito.inicio.toISOString(),
        fimConflito: conflito.fim.toISOString(),
      };
    }
  }

  await supabase.from("agendamentos_avulsos").insert({
    professor_id: profile.id,
    nome,
    email: email || null,
    telefone: telefone || null,
    tipo: tipo || "outro",
    data_hora: inicio.toISOString(),
    observacoes: observacoes || null,
  });

  revalidatePath("/professor/agendamentos");
  revalidatePath("/professor");
  return { ok: true };
}

export async function excluirAgendamentoAvulso(agendamentoId: string) {
  const supabase = createClient();
  await supabase.from("agendamentos_avulsos").delete().eq("id", agendamentoId);
  revalidatePath("/professor/agendamentos");
  revalidatePath("/professor");
}
