import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SERVIDOR 360 · Gestão de Cadastro Funcional e Vantagens Pessoais",
  description:
    "Plataforma de gestão do cadastro de servidores públicos, com área exclusiva para o servidor acompanhar vencimentos, licenças e vantagens adquiridas ao longo da carreira.",
  keywords: [
    "gestão de servidores",
    "cadastro funcional",
    "vantagens pessoais",
    "recursos humanos público",
    "vencimentos",
    "licença-prêmio",
    "quinquênio",
  ],
  openGraph: {
    title: "SERVIDOR 360 · Gestão de cadastro funcional e vantagens pessoais",
    description:
      "Dossiê funcional completo, área exclusiva do servidor e painel do gestor em um só sistema.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans text-[15px] leading-relaxed antialiased">
        {children}
      </body>
    </html>
  );
}
