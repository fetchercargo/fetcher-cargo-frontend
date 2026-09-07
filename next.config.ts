import type { NextConfig } from "next";

// All backend logic lives in the Go service. The frontend stays same-origin by
// proxying /api/* to that service via rewrites, which is what keeps CORS,
// cookies and the captcha flow working without any of them being configured.
//
// ⚠️  THIS DEFAULT IS THE **DEV** BACKEND, AND IT MUST NOT REACH `main`.
//
// `main` talks to https://fetcher-cargo-backend-tsxw.onrender.com. If this line
// merges as-is, the production frontend silently starts reading and WRITING to
// the dev database — with no error, no warning, and nothing on screen that
// looks wrong. Change it back in the merge commit, or set BACKEND_API_URL on
// the production service so the default is never consulted.
//
// See PRE_MERGE_CHECKLIST.md in the backend repo.
const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "https://fetcher-cargo-backend-1.onrender.com";

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
