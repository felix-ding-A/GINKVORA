import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  
  const url = new URL(context.request.url);
  const isHtml = response.headers.get('content-type')?.includes('text/html');
  const isGet  = context.request.method === 'GET';
  const isPage = !url.pathname.startsWith('/api');

  if (isPage && isGet && isHtml) {
    // ── Cache headers ──────────────────────────────────────────────────────
    response.headers.set(
      'Cache-Control',
      'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    );

    return response;
  }

  return response;
});

