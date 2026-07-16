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

    // ── Strip Astro framework fingerprint from HTML ─────────────────────────
    // Wappalyzer and BuiltWith detect Astro via the <astro-island> custom
    // element injected by client:* directives. We replace it with a neutral
    // <div> so the Vue component still mounts correctly but leaves no trace.
    const original = await response.text();
    const cleaned = original
      .replace(/<astro-island(\s[^>]*)?>/gi, '<div data-ui="interactive"$1>')
      .replace(/<\/astro-island>/gi, '</div>');

    return new Response(cleaned, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
});

