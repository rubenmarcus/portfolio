export const prerender = false;

export const GET = () =>
  new Response(
    JSON.stringify({
      status: "ok",
      service: "rubenmarcus-portfolio-api",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    },
  );
