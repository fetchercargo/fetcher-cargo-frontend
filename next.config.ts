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
  experimental: {
    // Next copies every request body it forwards through a buffer that stops
    // at 10 MB by default and silently drops the rest. The docs say this only
    // applies with a proxy.ts file; in 16.2.2 it also cuts these rewrites —
    // verified by sending 12 MB through one: 10 MB arrived and the backend
    // waited for the rest until it timed out. A pickup request with more than
    // 10 MB of photos failed that way. 64 MB clears the largest body the
    // backend accepts: pickup photos, 60 MB plus the form fields.
    proxyClientMaxBodySize: "64mb",
    // How long a forwarded request may sit with no bytes moving before Next
    // gives up and answers 500 (default 30 s). Storing a large pickup
    // request, emailing its code, or copying its photos to Drive can take
    // longer, and the user was shown an error for a request that went through.
    proxyTimeout: 120_000,
  },
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
