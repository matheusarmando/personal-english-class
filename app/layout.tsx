import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Class",
  description: "Controle de aulas: turmas, presença e acompanhamento.",
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
