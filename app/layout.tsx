import type { Metadata, Viewport } from "next";
import "./globals.css";

const TITULO = "Personal Class — sistema para quem dá aula particular";
const DESCRICAO =
  "Alunos, agenda, provas, avisos pelo WhatsApp e financeiro num lugar só. 30 dias grátis, sem cartão de crédito.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-body">{children}</body>
    </html>
  );
}
