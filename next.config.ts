import type { NextConfig } from "next";

// All backend logic lives in the Go service. The frontend stays same-origin by
// proxying /api/* to that service via rewrites (no CORS, token/captcha flows
// keep working unchanged). Override the target with BACKEND_API_URL.
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

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
