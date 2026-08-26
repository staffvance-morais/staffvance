export default function manifest() {
  return {
    name: "Gerenciador Wadjet",
    short_name: "Wadjet",
    description: "Plataforma de Gestão Operacional e Segurança Privada da Wadjet Segurança LTDA.",
    start_url: "/",
    display: "standalone",
    background_color: "#171717",
    theme_color: "#171717",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

