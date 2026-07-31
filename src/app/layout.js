import "./globals.css"; // Essa linha faz a mágica do Tailwind funcionar

export const metadata = {
  title: "StaffVance",
  description: "Wadjet Segurança",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}