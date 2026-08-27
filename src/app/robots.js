export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gerenciador.wadjet.seg.br";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cadastro", "/esqueci-senha", "/nova-senha"],
        disallow: [
          "/admin",
          "/admin/*",
          "/coordenador",
          "/coordenador/*",
          "/freelancers",
          "/freelancers/*",
          "/api/*",
          "/dashboard",
          "/mapa",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
