import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  const url = new URL(context.request.url);
  const isApi = url.pathname.startsWith('/api/');

  // API responses may contain validation outcomes or webhook results. They must
  // never be stored by a browser, Cloudflare, or Vercel's CDN.
  if (isApi) {
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const isHtml = response.headers.get('content-type')?.includes('text/html');
  const isGet = context.request.method === 'GET';

  if (isGet && isHtml) {
    const isPersonalizedPage = /^(?:\/(?:ar|es|ru))?\/(?:contact|thank-you)$/.test(url.pathname);
    const isDetailPage = /^(?:\/(?:ar|es|ru))?\/(?:products|insights)\/[^/]+$/.test(url.pathname);

    if (isPersonalizedPage) {
      response.headers.set('Cache-Control', 'private, no-store');
    } else if (isDetailPage) {
      // Detail content is cached by the Astro/Vercel ISR layer. Its 7-day
      // ceiling lives in astro.config.mjs and Sanity refreshes it on demand.
      // Keep browsers from retaining HTML after a CMS publish/slug change.
      response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=86400');
    }

    return response;
  }

  return response;
});
