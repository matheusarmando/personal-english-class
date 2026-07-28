import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarTemplateWhatsapp } from "@/lib/whatsapp/client";
import {
  TEMPLATE_LEMBRETE_AULA,
  TEMPLATE_RESUMO_AULA,
  TEMPLATE_COBRANCA,
  renderizarLembreteAula,
  renderizarResumoAula,
  renderizarCobranca,
} from "@/lib/whatsapp/templates";

export const dynamic = "force-dynamic";

function autorizado(request: Request) {
  const auth = request.headers.get("authorization");
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
}

const FK_PROFESSOR = "profiles!alunos_professor_id_fkey";

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resultado = { lembretes: 0, resumos: 0, cobrancas: 0, falhas: 0 };

  const agora = new Date();
  const em2h = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
  const tresDiasAtras = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000);

  // ---- lembretes de aula (próximas 2h) ----
  const { data: horarios } = await supabase
    .from("aluno_horarios")
    .select(
      `id, data_hora, aluno_id, alunos(nome, telefone, link_aula, professor_id, ${FK_PROFESSOR}(nome, whatsapp_ativo))`
    )
    .eq("status", "agendada")
    .gte("data_hora", agora.toISOString())
    .lte("data_hora", em2h.toISOString());

  for (const h of horarios ?? []) {
    const aluno: any = h.alunos;
    const professor = aluno?.profiles;
    if (!aluno?.telefone || !professor?.whatsapp_ativo) continue;

    const { data: jaEnviado } = await supabase
      .from("whatsapp_mensagens")
      .select("id")
      .eq("aluno_horario_id", h.id)
      .eq("tipo", "lembrete_aula")
      .maybeSingle();
    if (jaEnviado) continue;

    const hora = new Date(h.data_hora).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const conteudo = renderizarLembreteAula({
      aluno: aluno.nome,
      professor: professor.nome,
      hora,
      linkAula: aluno.link_aula ?? "",
    });

    const envio = await enviarTemplateWhatsapp({
      para: aluno.telefone,
      templateName: TEMPLATE_LEMBRETE_AULA.nome,
      parametros: [aluno.nome, professor.nome, hora, aluno.link_aula ?? ""],
    });

    await supabase.from("whatsapp_mensagens").insert({
      professor_id: aluno.professor_id,
      aluno_id: h.aluno_id,
      aluno_horario_id: h.id,
      tipo: "lembrete_aula",
      destinatario_telefone: aluno.telefone,
      conteudo,
      status: envio.ok ? "enviada" : "falhou",
      whatsapp_message_id: envio.ok ? envio.whatsappMessageId : null,
      erro: envio.ok ? null : envio.erro,
      agendado_para: h.data_hora,
      enviado_em: envio.ok ? new Date().toISOString() : null,
    });

    envio.ok ? resultado.lembretes++ : resultado.falhas++;
  }

  // ---- resumo pós-aula ----
  const { data: concluidas } = await supabase
    .from("aluno_horarios")
    .select(
      `id, data_hora, aluno_id, conteudo, exercicio, alunos(nome, telefone, professor_id, ${FK_PROFESSOR}(whatsapp_ativo))`
    )
    .eq("status", "concluida")
    .gte("data_hora", tresDiasAtras.toISOString());

  for (const h of concluidas ?? []) {
    const aluno: any = h.alunos;
    const professor = aluno?.profiles;
    if (!aluno?.telefone || !professor?.whatsapp_ativo) continue;
    if (!h.conteudo && !h.exercicio) continue;

    const { data: jaEnviado } = await supabase
      .from("whatsapp_mensagens")
      .select("id")
      .eq("aluno_horario_id", h.id)
      .eq("tipo", "resumo_aula")
      .maybeSingle();
    if (jaEnviado) continue;

    const conteudoMsg = renderizarResumoAula({
      conteudo: h.conteudo ?? "—",
      exercicio: h.exercicio ?? "—",
    });

    const envio = await enviarTemplateWhatsapp({
      para: aluno.telefone,
      templateName: TEMPLATE_RESUMO_AULA.nome,
      parametros: [h.conteudo ?? "—", h.exercicio ?? "—"],
    });

    await supabase.from("whatsapp_mensagens").insert({
      professor_id: aluno.professor_id,
      aluno_id: h.aluno_id,
      aluno_horario_id: h.id,
      tipo: "resumo_aula",
      destinatario_telefone: aluno.telefone,
      conteudo: conteudoMsg,
      status: envio.ok ? "enviada" : "falhou",
      whatsapp_message_id: envio.ok ? envio.whatsappMessageId : null,
      erro: envio.ok ? null : envio.erro,
      agendado_para: h.data_hora,
      enviado_em: envio.ok ? new Date().toISOString() : null,
    });

    envio.ok ? resultado.resumos++ : resultado.falhas++;
  }

  // ---- cobrança (mensalidade vence amanhã) ----
  const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
  const diaVencimentoAlvo = amanha.getDate();

  const { data: alunosCobranca } = await supabase
    .from("alunos")
    .select(
      `id, nome, telefone, valor, pix_copia_cola, dia_vencimento, professor_id, ativo, status_pagamento, ${FK_PROFESSOR}(whatsapp_ativo)`
    )
    .eq("dia_vencimento", diaVencimentoAlvo)
    .eq("ativo", true)
    .neq("status_pagamento", "pago");

  for (const aluno of alunosCobranca ?? []) {
    const professor: any = aluno.profiles;
    if (!aluno.telefone || !professor?.whatsapp_ativo) continue;

    const desde = new Date(agora.getTime() - 20 * 60 * 60 * 1000).toISOString();
    const { data: jaEnviado } = await supabase
      .from("whatsapp_mensagens")
      .select("id")
      .eq("aluno_id", aluno.id)
      .eq("tipo", "cobranca")
      .gte("created_at", desde)
      .maybeSingle();
    if (jaEnviado) continue;

    const valorFormatado =
      aluno.valor != null
        ? Number(aluno.valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : "a combinar";

    const conteudoMsg = renderizarCobranca({
      aluno: aluno.nome,
      valor: valorFormatado,
      pix: aluno.pix_copia_cola ?? "",
    });

    const envio = await enviarTemplateWhatsapp({
      para: aluno.telefone,
      templateName: TEMPLATE_COBRANCA.nome,
      parametros: [aluno.nome, valorFormatado, aluno.pix_copia_cola ?? ""],
    });

    await supabase.from("whatsapp_mensagens").insert({
      professor_id: aluno.professor_id,
      aluno_id: aluno.id,
      tipo: "cobranca",
      destinatario_telefone: aluno.telefone,
      conteudo: conteudoMsg,
      status: envio.ok ? "enviada" : "falhou",
      whatsapp_message_id: envio.ok ? envio.whatsappMessageId : null,
      erro: envio.ok ? null : envio.erro,
      agendado_para: amanha.toISOString(),
      enviado_em: envio.ok ? new Date().toISOString() : null,
    });

    envio.ok ? resultado.cobrancas++ : resultado.falhas++;
  }

  return NextResponse.json(resultado);
}
