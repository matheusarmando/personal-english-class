import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 20, fontWeight: 700 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { color: "#666666" },
  section: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#dddddd" },
  rodape: { marginTop: 40, fontSize: 9, color: "#999999" },
});

export type DadosRecibo = {
  professorNome: string;
  alunoNome: string;
  tipoPlano: string;
  numeroParcela: number;
  totalParcelas: number;
  valorPagoCentavos: number;
  /** Data pura YYYY-MM-DD. */
  dataPagamento: string;
  metodoPagamento: string | null;
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataBR(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

const LABEL_PLANO: Record<string, string> = {
  mensal: "Mensal",
  semestral: "Semestral",
  anual: "Anual",
};

function ReciboDocument({ dados }: { dados: DadosRecibo }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Recibo de pagamento</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Professor</Text>
          <Text>{dados.professorNome}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Aluno</Text>
          <Text>{dados.alunoNome}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Plano</Text>
          <Text>{LABEL_PLANO[dados.tipoPlano] ?? dados.tipoPlano}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Parcela</Text>
          <Text>
            {dados.numeroParcela}/{dados.totalParcelas}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Valor pago</Text>
            <Text>{formatarReais(dados.valorPagoCentavos)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data do pagamento</Text>
            <Text>{formatarDataBR(dados.dataPagamento)}</Text>
          </View>
          {dados.metodoPagamento && (
            <View style={styles.row}>
              <Text style={styles.label}>Método</Text>
              <Text>{dados.metodoPagamento}</Text>
            </View>
          )}
        </View>

        <Text style={styles.rodape}>Gerado automaticamente por Personal English Class.</Text>
      </Page>
    </Document>
  );
}

export async function gerarReciboPdf(dados: DadosRecibo): Promise<Buffer> {
  return renderToBuffer(<ReciboDocument dados={dados} />);
}
