import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  const url = new URL(context.request.url);
  const isHtml = response.headers.get('content-type')?.includes('text/html');
  const isGet = context.request.method === 'GET';
  const isPage = !url.pathname.startsWith('/api');

  if (isPage && isGet && isHtml) {
    const isPersonalizedPage = /^(?:\/(?:ar|es|ru))?\/(?:contact|thank-you)$/.test(url.pathname);
    const isDetailPage = /^(?:\/(?:ar|es|ru))?\/(?:products|insights)\/[^/]+$/.test(url.pathname);

    if (isPersonalizedPage) {
      response.headers.set('Cache-Control', 'private, no-store');
    } else if (isDetailPage) {
      response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=86400');
    }

    return response;
  }

  return response;
});
