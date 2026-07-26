import "./globals.css";

export const metadata = {
  title: "StaffVance - Wadjet",
  description: "Sistema de Gestão e Segurança",
  icons: {
    icon: "/logo_full_gray.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}