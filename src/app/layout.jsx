import "./globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://gerenciador.wadjet.seg.br";

export const viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Gerenciador Wadjet — Gestão Operacional & Segurança",
    template: "%s | Gerenciador Wadjet",
  },
  description:
    "Plataforma oficial de gestão operacional, escalas de segurança privada e apoio a eventos da Wadjet Segurança LTDA.",
  applicationName: "Gerenciador Wadjet",
  authors: [
    { name: "Wadjet Segurança LTDA", url: "https://cnpj.biz/54011901000108" },
    { name: "Sunset Field Solutions" },
  ],
  generator: "Next.js",
  keywords: [
    "Wadjet Segurança",
    "Gerenciador Wadjet",
    "segurança privada",
    "vigilância patrimonial",
    "segurança para eventos",
    "staff eventos",
    "escalas de segurança",
    "Fortaleza",
    "Ceará",
    "Sunset Field Solutions",
  ],
  creator: "Sunset Field Solutions",
  publisher: "Wadjet Segurança LTDA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Gerenciador Wadjet — Gestão Operacional & Segurança",
    description:
      "Plataforma oficial de gestão de segurança privada, eventos e equipe da Wadjet Segurança LTDA.",
    url: appUrl,
    siteName: "Gerenciador Wadjet",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Logo Wadjet Segurança",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Gerenciador Wadjet",
    description:
      "Plataforma oficial de gestão de segurança privada e eventos da Wadjet Segurança LTDA.",
    images: ["/icon.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SecurityService",
  name: "Wadjet Segurança LTDA",
  legalName: "Wadjet Segurança LTDA",
  taxID: "54.011.901/0001-08",
  foundingDate: "2024-02-21",
  url: appUrl,
  logo: `${appUrl}/icon.png`,
  image: `${appUrl}/icon.png`,
  description:
    "Empresa especializada em atividades de vigilância, segurança privada, apoio operacional e gestão de eventos.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Avenida Barão de Studart, 1165, Complemento 5",
    addressLocality: "Fortaleza",
    addressRegion: "CE",
    postalCode: "60120-001",
    addressCountry: "BR",
  },
  founder: {
    "@type": "Person",
    name: "Terezinha Carlos da Silva",
  },
  knowsAbout: [
    "Atividades de vigilância e segurança privada (CNAE 80.11-1-01)",
    "Serviços combinados de escritório e apoio administrativo (CNAE 82.11-3-00)",
    "Outras atividades de serviços de segurança (CNAE 80.20-0-02)",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}