import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // CSS (~10 KB gzip) vai inline no HTML: some a requisição que bloqueava a
    // primeira pintura no celular (Lighthouse mobile).
    inlineCss: true,
  },
};

export default nextConfig;
