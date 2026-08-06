import { NextResponse } from "next/server";
import { createClient, getProfile } from "@/lib/supabase/server";
import { calcularRelatorioFinanceiro } from "@/lib/financeiro/relatorio";
import { gerarRelatorioFinanceiroPdf } from "@/lib/financeiro/relatorio-pdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const dataInicio = url.searchParams.get("de");
  const dataFim = url.searchParams.get("ate");
  if (!dataInicio || !dataFim) {
    return NextResponse.json({ error: "Informe de e ate (YYYY-MM-DD)." }, { status: 400 });
  }

  const supabase = createClient();

  const { data: contratosRaw } = await supabase
    .from("contratos")
    .select("id, data_inicio")
    .eq("professor_id", profile.id);

  const contratos = contratosRaw ?? [];
  const contratoIds = contratos.map((c) => c.id);

  const { data: parcelasRaw } = contratoIds.length
    ? await supabase
        .from("parcelas")
        .select("valor_centavos, valor_pago_centavos, vencimento, status, contrato_id, contratos(alunos(nome))")
        .in("contrato_id", contratoIds)
        .gte("vencimento", dataInicio)
        .lte("vencimento", dataFim)
        .order("vencimento")
    : { data: [] };

  const parcelas = parcelasRaw ?? [];

  const resultado = calcularRelatorioFinanceiro(
    parcelas.map((p) => ({
      valorCentavos: p.valor_centavos,
      valorPagoCentavos: p.valor_pago_centavos,
      vencimento: p.vencimento,
      status: p.status as "pendente" | "paga" | "cancelada",
      contratoId: p.contrato_id,
    })),
    contratos.map((c) => ({ id: c.id, dataInicio: c.data_inicio })),
    dataInicio,
    dataFim
  );

  const buffer = await gerarRelatorioFinanceiroPdf({
    professorNome: profile.nome,
    dataInicio,
    dataFim,
    resultado,
    parcelas: parcelas.map((p: any) => ({
      alunoNome: p.contratos?.alunos?.nome ?? "—",
      vencimento: p.vencimento,
      valorCentavos: p.valor_centavos,
      status: p.status,
    })),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="relatorio-financeiro-${dataInicio}-a-${dataFim}.pdf"`,
    },
  });
}
