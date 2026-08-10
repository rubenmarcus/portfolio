export const prerender = true;

// The compatibility OAuth flow issues opaque tokens, so there are no public
// signing keys. Publishing an empty JWKS keeps the metadata internally valid.
export const GET = () =>
  new Response(JSON.stringify({ keys: [] }), {
    headers: {
      "content-type": "application/jwk-set+json; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
