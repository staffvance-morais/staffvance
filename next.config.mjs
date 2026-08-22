/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" }, // Bloqueia Clickjacking
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // Protege o histórico de navegação
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }, // Bloqueia recursos não usados
        ],
      },
    ];
  },
};
export default nextConfig;