import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarTemplateWhatsapp } from "@/lib/whatsapp/client";
import {
  TEMPLATE_LEMBRETE_AULA,
  TEMPLATE_RESUMO_AULA,
  TEMPLATE_PARCELA_LEMBRETE,
  TEMPLATE_PARCELA_ATRASO,
  renderizarLembreteAula,
  renderizarResumoAula,
  renderizarParcelaLembrete,
  renderizarParcelaAtraso,
} from "@/lib/whatsapp/templates";
import { decidirNotificacoes, type ParcelaParaNotificar } from "@/lib/financeiro/notificacoes";

export const dynamic = "force-dynamic";

function autorizado(request: Request) {
  const auth = request.headers.get("authorization");
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
}

const FK_PROFESSOR = "profiles!alunos_professor_id_fkey";
const FK_PROFESSOR_CONTRATO = "profiles!contratos_professor_id_fkey";

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resultado = { lembretes: 0, resumos: 0, financeiro: 0, notificacoes: 0, falhas: 0 };

  const agora = new Date();
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date(agora);
  fimHoje.setHours(23, 59, 59, 999);
  const tresDiasAtras = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000);

  // ---- lembretes de aula (todas as aulas de hoje) ----
  // Roda 1x por dia (limite do plano Hobby da Vercel para cron jobs),
  // então o lembrete cobre o dia inteiro em vez de uma janela de poucas
  // horas antes da aula.
  const { data: horarios } = await supabase
    .from("aluno_horarios")
    .select(
      `id, data_hora, link_aula, aluno_id, alunos(nome, telefone, link_aula, professor_id, ${FK_PROFESSOR}(nome, whatsapp_ativo))`
    )
    .eq("status", "agendada")
    .gte("data_hora", inicioHoje.toISOString())
    .lte("data_hora", fimHoje.toISOString());

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
    const linkAula = h.link_aula ?? aluno.link_aula ?? "";
    const conteudo = renderizarLembreteAula({
      aluno: aluno.nome,
      professor: professor.nome,
      hora,
      linkAula,
    });

    const envio = await enviarTemplateWhatsapp({
      para: aluno.telefone,
      templateName: TEMPLATE_LEMBRETE_AULA.nome,
      parametros: [aluno.nome, professor.nome, hora, linkAula],
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

  // ---- financeiro: lembrete/atraso de parcela + resumo do professor ----
  // Lembretes de vencimento, atraso e o resumo diário do professor são
  // derivados de `parcelas` (não mais de alunos.dia_vencimento) pela
  // mesma função pura usada nos testes automatizados
  // (lib/financeiro/notificacoes.ts), garantindo que cron e testes
  // nunca divirjam sobre "quando notificar".
  const { data: parcelasPendentes } = await supabase
    .from("parcelas")
    .select(
      `id, numero, valor_centavos, vencimento, status,
       contratos (professor_id, pix_copia_cola, alunos (id, nome, telefone, profile_id), ${FK_PROFESSOR_CONTRATO}(whatsapp_ativo, financeiro_dias_lembrete))`
    )
    .eq("status", "pendente");

  const dadosPorParcela = new Map(
    (parcelasPendentes ?? []).map((p: any) => [
      p.id,
      {
        alunoId: p.contratos?.alunos?.id as string | undefined,
        alunoNome: p.contratos?.alunos?.nome ?? "aluno",
        telefone: p.contratos?.alunos?.telefone as string | null | undefined,
        valorCentavos: p.valor_centavos as number,
        vencimento: p.vencimento as string,
        pixCopiaCola: (p.contratos?.pix_copia_cola ?? "") as string,
        professorId: p.contratos?.professor_id as string,
        whatsappAtivo: Boolean(p.contratos?.profiles?.whatsapp_ativo),
      },
    ])
  );

  const parcelasParaNotificar: ParcelaParaNotificar[] = (parcelasPendentes ?? []).map((p: any) => ({
    id: p.id,
    numero: p.numero,
    vencimento: p.vencimento,
    status: p.status,
    alunoProfileId: p.contratos?.alunos?.profile_id ?? null,
    professorId: p.contratos?.professor_id,
    professorDiasLembrete: p.contratos?.profiles?.financeiro_dias_lembrete ?? 3,
  }));

  const notificacoesParaCriar = decidirNotificacoes(parcelasParaNotificar, agora);

  for (const notif of notificacoesParaCriar) {
    const { error: erroNotif } = await supabase.from("notificacoes").upsert(
      {
        destinatario_id: notif.destinatarioId,
        tipo: notif.tipo,
        parcela_id: notif.parcelaId,
        titulo: notif.titulo,
        mensagem: notif.mensagem,
        chave_idempotencia: notif.chaveIdempotencia,
      },
      { onConflict: "chave_idempotencia", ignoreDuplicates: true }
    );
    if (!erroNotif) resultado.notificacoes++;

    if (!notif.parcelaId || notif.tipo === "resumo_professor_vencimentos") continue;

    const dados = dadosPorParcela.get(notif.parcelaId);
    if (!dados || !dados.telefone || !dados.whatsappAtivo) continue;

    const tipoWhatsapp = notif.tipo === "parcela_atrasada" ? "parcela_atraso" : "parcela_lembrete";

    const { data: jaEnviado } = await supabase
      .from("whatsapp_mensagens")
      .select("id")
      .eq("parcela_id", notif.parcelaId)
      .eq("tipo", tipoWhatsapp)
      .maybeSingle();
    if (jaEnviado) continue;

    const valorFormatado = (dados.valorCentavos / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const vencimentoFormatado = new Date(`${dados.vencimento}T00:00:00Z`).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });

    const template = tipoWhatsapp === "parcela_atraso" ? TEMPLATE_PARCELA_ATRASO : TEMPLATE_PARCELA_LEMBRETE;
    const renderizar = tipoWhatsapp === "parcela_atraso" ? renderizarParcelaAtraso : renderizarParcelaLembrete;

    const conteudoMsg = renderizar({
      aluno: dados.alunoNome,
      valor: valorFormatado,
      vencimento: vencimentoFormatado,
      pix: dados.pixCopiaCola,
    });

    const envio = await enviarTemplateWhatsapp({
      para: dados.telefone,
      templateName: template.nome,
      parametros: [dados.alunoNome, valorFormatado, vencimentoFormatado, dados.pixCopiaCola],
    });

    await supabase.from("whatsapp_mensagens").insert({
      professor_id: dados.professorId,
      aluno_id: dados.alunoId ?? null,
      parcela_id: notif.parcelaId,
      tipo: tipoWhatsapp,
      destinatario_telefone: dados.telefone,
      conteudo: conteudoMsg,
      status: envio.ok ? "enviada" : "falhou",
      whatsapp_message_id: envio.ok ? envio.whatsappMessageId : null,
      erro: envio.ok ? null : envio.erro,
      agendado_para: `${dados.vencimento}T00:00:00Z`,
      enviado_em: envio.ok ? new Date().toISOString() : null,
    });

    envio.ok ? resultado.financeiro++ : resultado.falhas++;
  }

  return NextResponse.json(resultado);
}
