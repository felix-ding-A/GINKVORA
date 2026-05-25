import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  
  const url = new URL(context.request.url);
  
  // Apply caching header ONLY to page HTML responses (exclude API endpoints)
  if (
    !url.pathname.startsWith('/api') && 
    context.request.method === 'GET' && 
    response.headers.get('content-type')?.includes('text/html')
  ) {
    response.headers.set(
      'Cache-Control', 
      'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    );
  }
  
  return response;
});
