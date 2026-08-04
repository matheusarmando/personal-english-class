import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarReciboPdf } from "@/lib/financeiro/recibo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { parcelaId: string } }) {
  const supabase = createClient();

  const { data: parcela } = await supabase
    .from("parcelas")
    .select(
      `numero, valor_pago_centavos, valor_centavos, data_pagamento, metodo_pagamento, status,
       contratos (tipo_plano, numero_parcelas, alunos (nome), professor:profiles!contratos_professor_id_fkey (nome))`
    )
    .eq("id", params.parcelaId)
    .maybeSingle();

  // A RLS de `parcelas` já garante que só o professor dono, o aluno
  // dono ou um gestor conseguem ler essa linha — se veio nulo, ou é
  // outro usuário sem permissão, ou a parcela não existe.
  if (!parcela || parcela.status !== "paga") {
    return NextResponse.json({ error: "Recibo não disponível." }, { status: 404 });
  }

  const contrato = parcela.contratos as unknown as {
    tipo_plano: string;
    numero_parcelas: number;
    alunos: { nome: string } | null;
    professor: { nome: string } | null;
  } | null;

  const buffer = await gerarReciboPdf({
    professorNome: contrato?.professor?.nome ?? "—",
    alunoNome: contrato?.alunos?.nome ?? "—",
    tipoPlano: contrato?.tipo_plano ?? "—",
    numeroParcela: parcela.numero,
    totalParcelas: contrato?.numero_parcelas ?? 0,
    valorPagoCentavos: parcela.valor_pago_centavos ?? parcela.valor_centavos,
    dataPagamento: parcela.data_pagamento ?? "",
    metodoPagamento: parcela.metodo_pagamento,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-parcela-${parcela.numero}.pdf"`,
    },
  });
}
