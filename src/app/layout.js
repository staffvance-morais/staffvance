import "./globals.css";

export const metadata = {
  title: "StaffVance",
  description: "Painel de Gestão e Escala",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}