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
};

module.exports = nextConfig;
