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
  // The pickup upload route (src/app/api/pickup/requests/route.ts) forwards to
  // the backend itself. Baked in at build time, like the rewrite target below,
  // so both always reach the same backend.
  env: {
    PICKUP_UPLOAD_BACKEND_URL: BACKEND_API_URL,
  },
  experimental: {
    // Next copies every request body it forwards through the rewrite below
    // into memory, keeps the copy until the request ends, and silently drops
    // anything past this limit (10 MB by default). The docs say this only
    // applies with a proxy.ts file; in 16.2.2 it also applies to these
    // rewrites — verified by sending 12 MB through one: 10 MB arrived and the
    // backend waited for the rest until it timed out. Pickup photos no longer
    // come this way (their route streams), so the limit only has to clear the
    // largest other body the backend accepts: a bulk shipment create, 32 MiB
    // of JSON (maxBulkJSONBytes; admin documents are 25 MiB). Every MB here is
    // memory any caller can make the website hold per request.
    proxyClientMaxBodySize: "33mb",
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
