import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ResultadoRelatorioFinanceiro } from "./relatorio";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, fontWeight: 700 },
  subtitulo: { fontSize: 11, color: "#666666", marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { color: "#666666" },
  section: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#dddddd" },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#eeeeee" },
  colAluno: { flex: 2 },
  colData: { flex: 1 },
  colValor: { flex: 1, textAlign: "right" },
  colStatus: { flex: 1, textAlign: "right" },
  rodape: { marginTop: 24, fontSize: 9, color: "#999999" },
});

export type LinhaParcelaRelatorio = {
  alunoNome: string;
  vencimento: string;
  valorCentavos: number;
  status: string;
};

export type DadosRelatorioFinanceiro = {
  professorNome: string;
  dataInicio: string;
  dataFim: string;
  resultado: ResultadoRelatorioFinanceiro;
  parcelas: LinhaParcelaRelatorio[];
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataBR(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

const LABEL_STATUS: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

function RelatorioFinanceiroDocument({ dados }: { dados: DadosRelatorioFinanceiro }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório financeiro</Text>
        <Text style={styles.subtitulo}>
          {dados.professorNome} · {formatarDataBR(dados.dataInicio)} a {formatarDataBR(dados.dataFim)}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Recebido no período</Text>
          <Text>{formatarReais(dados.resultado.recebidoCentavos)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Previsto no período</Text>
          <Text>{formatarReais(dados.resultado.previstoCentavos)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Inadimplência</Text>
          <Text>
            {formatarReais(dados.resultado.inadimplenciaCentavos)} ({dados.resultado.quantidadeParcelasInadimplentes}{" "}
            parcela(s))
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contratos novos</Text>
          <Text>{dados.resultado.contratosNovos}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parcelas no período</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colAluno}>Aluno</Text>
            <Text style={styles.colData}>Vencimento</Text>
            <Text style={styles.colValor}>Valor</Text>
            <Text style={styles.colStatus}>Status</Text>
          </View>
          {dados.parcelas.map((p, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colAluno}>{p.alunoNome}</Text>
              <Text style={styles.colData}>{formatarDataBR(p.vencimento)}</Text>
              <Text style={styles.colValor}>{formatarReais(p.valorCentavos)}</Text>
              <Text style={styles.colStatus}>{LABEL_STATUS[p.status] ?? p.status}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.rodape}>Gerado automaticamente por Personal English Class.</Text>
      </Page>
    </Document>
  );
}

export async function gerarRelatorioFinanceiroPdf(dados: DadosRelatorioFinanceiro): Promise<Buffer> {
  return renderToBuffer(<RelatorioFinanceiroDocument dados={dados} />);
}
