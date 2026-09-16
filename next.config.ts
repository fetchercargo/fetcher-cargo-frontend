import type { NextConfig } from "next";

// All backend logic lives in the Go service. The frontend stays same-origin by
// proxying /api/* to that service via rewrites, which is what keeps CORS,
// cookies and the captcha flow working without any of them being configured.
//
// Default to production. Set BACKEND_API_URL at build time to use a different
// backend for local development or staging.
const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "https://fetcher-cargo-backend-tsxw.onrender.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
