// The public pickup form posts its photos here instead of through the /api/*
// rewrite in next.config.ts. That rewrite copies every body it forwards into
// memory and keeps the copy until the request ends; with up to 60 MB of photos
// per request, a handful of uploads at once could run the website out of
// memory and take the whole site down. This route streams the body to the
// backend as it arrives, and streams the answer back.
//
// Only POST lives here. The form's other calls (verify, resend, locations)
// carry small JSON bodies and still go through the rewrite.

// Fixed when the site is BUILT, from the same value as the rewrite target
// (next.config.ts), so the two can never point at different backends.
const BACKEND = process.env.PICKUP_UPLOAD_BACKEND_URL;

// The request headers the backend uses. Hop-by-hop headers belong to this
// connection, and cookies mean nothing to this public endpoint.
// X-Forwarded-For is passed on untouched, exactly as the rewrite does, so the
// backend's per-visitor rate limits see the same chain as before.
const FORWARD_REQUEST = ['content-type', 'content-length', 'x-forwarded-for', 'user-agent', 'accept'];
// The response headers the form reads.
const FORWARD_RESPONSE = ['content-type', 'cache-control'];

export async function POST(request: Request): Promise<Response> {
  if (!BACKEND) return new Response(null, { status: 500 });

  const headers = new Headers();
  for (const name of FORWARD_REQUEST) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  const init: RequestInit & { duplex: 'half' } = {
    method: 'POST',
    headers,
    body: request.body,
    // Required by Node's fetch for a streamed body.
    duplex: 'half',
    // Node's fetch keeps a full copy of a streamed body while redirects are
    // possible, in case it must send it again — the very copy this route
    // exists to avoid. The backend never redirects this call.
    redirect: 'error',
    window: null,
    cache: 'no-store',
    // A visitor who gives up mid-upload cancels the backend request too.
    signal: request.signal,
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}/api/pickup/requests`, init);
  } catch (err) {
    // A visitor who gave up lands here too; only a real backend failure is
    // worth a log line.
    if (!request.signal.aborted) {
      console.error(`pickup upload: backend request to ${BACKEND} failed`, err);
    }
    // The form explains a bare 502 as "did not go through, your photos are
    // still attached". Close the connection: the rest of the visitor's upload
    // may still be arriving, and keeping the connection open would hold the
    // answer back until the browser finished sending it.
    return new Response(null, { status: 502, headers: { connection: 'close' } });
  }

  const out = new Headers();
  for (const name of FORWARD_RESPONSE) {
    const value = upstream.headers.get(name);
    if (value !== null) out.set(name, value);
  }
  // An error (a rate limit, "too large") can come back before the photos have
  // all arrived; closing lets it reach the browser at once, as the backend
  // itself does.
  if (!upstream.ok) out.set('connection', 'close');
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
