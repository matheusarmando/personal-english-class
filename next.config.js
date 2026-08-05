/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Sem isso, o Router Cache do lado do cliente reaproveita a
    // resposta pré-buscada (prefetch) de um <Link> em navegações
    // subsequentes pra rotas dinâmicas (ex.: /professor?mes=...) —
    // a URL muda mas o conteúdo fica preso na versão antiga por até
    // 30s (o padrão do Next.js). staleTimes.dynamic = 0 desliga esse
    // cache pra rota dinâmica, sempre buscando fresco no servidor.
    staleTimes: {
      dynamic: 0,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Sem isso, a tela de login e as telas financeiras podem
          // ser carregadas dentro de um <iframe> em site malicioso
          // (clickjacking). frame-ancestors cobre os navegadores que
          // priorizam CSP; X-Frame-Options é o fallback pros que não.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
