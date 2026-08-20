import type { APIRoute } from 'astro';
import { searchProductsAndPosts, type SearchLanguage } from '../../lib/sanity';

export const prerender = false;

const ALLOWED_LANGUAGES = new Set<SearchLanguage>(['en', 'ru', 'es', 'ar']);
const CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600';

const json = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? CACHE_CONTROL : 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  },
);

export const GET: APIRoute = async ({ url }) => {
  const rawQuery = (url.searchParams.get('q') || '').trim().replace(/\s+/g, ' ');
  const query = rawQuery
    .replace(/^cas\s*:?\s*/i, '')
    .replace(/[?*]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 64);
  const requestedLanguage = url.searchParams.get('lang') || 'en';

  if (rawQuery.length > 64) {
    return json({ ok: false, error: 'Search query is too long.' }, 400);
  }
  if (query.length < 2) {
    return json({ ok: true, products: [], posts: [] });
  }
  if (!ALLOWED_LANGUAGES.has(requestedLanguage as SearchLanguage)) {
    return json({ ok: false, error: 'Unsupported language.' }, 400);
  }

  try {
    const results = await searchProductsAndPosts(query, requestedLanguage as SearchLanguage);
    return json({ ok: true, ...results });
  } catch (error) {
    console.error('[Search] Sanity query failed.', error);
    return json({ ok: false, error: 'Search is temporarily unavailable.' }, 503);
  }
};
