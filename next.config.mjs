/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Aplica essas regras de segurança em TODAS as telas do site
        source: '/(.*)',
        headers: [
          {
            // Bloqueia ataques de Clickjacking (Relatório pediu XFO e frame-ancestors)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Impede que o navegador seja enganado por arquivos disfarçados
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Isola o site de abas maliciosas abertas no celular/PC (Relatório pediu COOP)
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            // A famosa CSP (Relatório pediu para mitigar XSS)
            // Libera o próprio site e o Supabase. Bloqueia o resto.
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';",
          }
        ],
      },
    ];
  },
};

export default nextConfig;