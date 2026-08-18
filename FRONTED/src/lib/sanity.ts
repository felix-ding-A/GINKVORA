// src/lib/sanity.ts — Sanity client and query helpers (with robust Mock Data fallback)
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_POSTS, MOCK_SITE_SETTINGS, MOCK_AUTHORS } from './mockData';

// ---------------------------------------------------------------------------
// Client Configuration
// ---------------------------------------------------------------------------
export const sanityClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'h5gs7zpr',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
  token: import.meta.env.SANITY_API_TOKEN,
});

// Detail pages are already protected by Vercel ISR. When an ISR regeneration
// happens, correctness is more important than adding another CDN/cache layer:
// a just-deleted document or a newly assigned slug must be visible immediately.
const sanityFreshClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'h5gs7zpr',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: import.meta.env.SANITY_API_TOKEN,
});

// ---------------------------------------------------------------------------
// In-Memory Query Cache & Circuit Breaker for Astro Build Optimization
// ---------------------------------------------------------------------------
type FetchCacheEntry = {
  promise: Promise<any>;
  expiresAt: number;
};

// A production build reuses the same catalog queries across many prerendered
// locale pages, so keep those results for the duration of the build. Runtime
// serverless instances use a short TTL and therefore cannot retain stale CMS
// data indefinitely.
const isBuildProcess = process.env.npm_lifecycle_event === 'build';
const DEFAULT_FETCH_CACHE_TTL_MS = isBuildProcess
  ? 30 * 60_000
  : 60_000;
const MAX_FETCH_CACHE_ENTRIES = 500;
const fetchCache = new Map<string, FetchCacheEntry>();
const canUseMockFallback = import.meta.env.DEV;

function mockOrThrow<T>(fallback: () => T, message: string, cause?: unknown): T {
  if (canUseMockFallback) return fallback();
  console.error(`[Sanity API] ${message}`, cause);
  throw new Error(message);
}

export async function cachedFetch(
  query: string,
  params: Record<string, any> = {},
  ttlMs = DEFAULT_FETCH_CACHE_TTL_MS
) {
  const key = `${query}::${JSON.stringify(params)}`;
  const now = Date.now();
  const cached = fetchCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  fetchCache.delete(key);

  // Remove expired entries and cap the cache so high-cardinality pagination
  // parameters cannot grow a warm serverless instance without bounds.
  for (const [cachedKey, entry] of fetchCache) {
    if (entry.expiresAt <= now) fetchCache.delete(cachedKey);
  }
  while (fetchCache.size >= MAX_FETCH_CACHE_ENTRIES) {
    const oldestKey = fetchCache.keys().next().value;
    if (typeof oldestKey !== 'string') break;
    fetchCache.delete(oldestKey);
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timeoutMs = 10000; // 10 seconds for reliable global CDN / Sanity API responses
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await sanityClient.fetch(query, params, { signal: controller.signal });
      clearTimeout(timer);
      return result;
    } catch (err: any) {
      clearTimeout(timer);
      console.warn(`⚠️ [Sanity API] Query failed or timed out (${err?.message || err}).`);
      fetchCache.delete(key);
      throw err;
    }
  })();

  fetchCache.set(key, {
    promise,
    expiresAt: now + Math.max(0, ttlMs),
  });
  return promise;
}

async function freshFetch(query: string, params: Record<string, any> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    return await sanityFreshClient.fetch(query, params, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Image URL Builder
// ---------------------------------------------------------------------------
const builder = createImageUrlBuilder(sanityClient);

function setUrlParam(urlStr: string, param: string, value: string): string {
  try {
    const url = new URL(urlStr);
    url.searchParams.set(param, value);
    return url.toString();
  } catch {
    return urlStr;
  }
}

function removeUrlParam(urlStr: string, param: string): string {
  try {
    const url = new URL(urlStr);
    url.searchParams.delete(param);
    return url.toString();
  } catch {
    return urlStr;
  }
}

export function urlFor(source: any) {
  // If source is already a direct URL string (used in mock data or direct fetched URLs), return it directly
  if (typeof source === 'string' && source.startsWith('http')) {
    let currentUrl = source.includes('cdn.sanity.io') 
      ? source.replace('https://cdn.sanity.io', '/media/images') 
      : source;
    const mockBuilder = {
      url: () => currentUrl,
      width: (w: number) => {
        currentUrl = setUrlParam(currentUrl, 'w', w.toString());
        return mockBuilder;
      },
      height: (h: number) => {
        currentUrl = setUrlParam(currentUrl, 'h', h.toString());
        return mockBuilder;
      },
      format: (fmt: string) => {
        currentUrl = setUrlParam(currentUrl, 'fm', fmt);
        // Remove auto=format to let Imgix/Unsplash prioritize explicit fm format
        currentUrl = removeUrlParam(currentUrl, 'auto');
        return mockBuilder;
      },
      fit: (f: string) => {
        currentUrl = setUrlParam(currentUrl, 'fit', f);
        return mockBuilder;
      },
      auto: (a: string) => {
        currentUrl = setUrlParam(currentUrl, 'auto', a);
        return mockBuilder;
      },
    };
    return mockBuilder;
  }
  // If the image source is a dummy/mock value or not defined, return a placeholder
  if (!source || typeof source !== 'object' || source.asset === undefined) {
    let currentUrl = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80';
    const fallbackBuilder = {
      url: () => currentUrl,
      width: (w: number) => {
        currentUrl = setUrlParam(currentUrl, 'w', w.toString());
        return fallbackBuilder;
      },
      height: (h: number) => {
        currentUrl = setUrlParam(currentUrl, 'h', h.toString());
        return fallbackBuilder;
      },
      format: (fmt: string) => {
        currentUrl = setUrlParam(currentUrl, 'fm', fmt);
        currentUrl = removeUrlParam(currentUrl, 'auto');
        return fallbackBuilder;
      },
      fit: (f: string) => {
        currentUrl = setUrlParam(currentUrl, 'fit', f);
        return fallbackBuilder;
      },
      auto: (a: string) => {
        currentUrl = setUrlParam(currentUrl, 'auto', a);
        return fallbackBuilder;
      },
    };
    return fallbackBuilder;
  }
  try {
    const b = builder.image(source).auto('format');
    const originalUrl = b.url.bind(b);
    b.url = () => {
      const url = originalUrl();
      return url ? url.replace('https://cdn.sanity.io', '/media/images') : '';
    };
    return b;
  } catch (err) {
    let currentUrl = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80';
    const fallbackBuilder = {
      url: () => currentUrl,
      width: (w: number) => {
        currentUrl = setUrlParam(currentUrl, 'w', w.toString());
        return fallbackBuilder;
      },
      height: (h: number) => {
        currentUrl = setUrlParam(currentUrl, 'h', h.toString());
        return fallbackBuilder;
      },
      format: (fmt: string) => {
        currentUrl = setUrlParam(currentUrl, 'fm', fmt);
        currentUrl = removeUrlParam(currentUrl, 'auto');
        return fallbackBuilder;
      },
      fit: (f: string) => {
        currentUrl = setUrlParam(currentUrl, 'fit', f);
        return fallbackBuilder;
      },
      auto: (a: string) => {
        currentUrl = setUrlParam(currentUrl, 'auto', a);
        return fallbackBuilder;
      },
    };
    return fallbackBuilder;
  }
}

// ---------------------------------------------------------------------------
// GROQ Queries
// ---------------------------------------------------------------------------

export const PRODUCT_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  "categories": select(
    defined(category[0]) => category[]->{name, "slug": slug.current},
    defined(category) => [category->{name, "slug": slug.current}]
  ),
  "category": select(
    defined(category[0]) => category[0]->{name, "slug": slug.current},
    defined(category) => category->{name, "slug": slug.current}
  ),
  botanicalName,
  purity,
  activeIngredient,
  casNumber,
  shortDescription,
  shortDescription_ru,
  shortDescription_ar,
  shortDescription_es,
  featured,
  weight,
  heroImage,
  applications,
  applications_ru,
  applications_ar,
  applications_es,
  application,
  inciName,
  certifications[],
  mainCategories,
  antiAgingMechanisms,
  applicationDisplay,
  "updatedAt": _updatedAt
`;

// Catalog routes render only cards, so avoid fetching detail-only fields and
// all locale payloads beyond the short descriptions used by those cards.
export const PRODUCT_CARD_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  "categories": select(
    defined(category[0]) => category[]->{name, "slug": slug.current},
    defined(category) => [category->{name, "slug": slug.current}]
  ),
  "category": select(
    defined(category[0]) => category[0]->{name, "slug": slug.current},
    defined(category) => category->{name, "slug": slug.current}
  ),
  botanicalName,
  purity,
  casNumber,
  shortDescription,
  shortDescription_ru,
  shortDescription_ar,
  shortDescription_es,
  heroImage,
  mainCategories,
  antiAgingMechanisms,
  applicationDisplay
`;

export const PRODUCT_DETAIL_FIELDS = `
  ${PRODUCT_FIELDS},
  description,
  description_ru,
  description_ar,
  description_es,
  specifications[]{label, value},
  gallery[],
  coaFile{asset->{url}},
  msdsFile{asset->{url}},
  complianceNote,
  complianceNote_ru,
  complianceNote_ar,
  meta_title,
  meta_description,
  meta_title_ru,
  meta_description_ru,
  meta_title_ar,
  meta_description_ar,
  meta_title_es,
  meta_description_es,
  faqItems,
  faqItems_ru,
  faqItems_ar,
  faqItems_es,
  minimumOrderQuantity
`;

export async function getAllProducts(category: string | null = null, mechanism: string | null = null) {
  const queryParams: any = {
    category: category || '',
    mechanism: mechanism || ''
  };

  const query = `
    *[_type == "product"
      && ($category == "" || $category in mainCategories)
      && ($mechanism == "" || $mechanism in antiAgingMechanisms)
    ] | order(coalesce(weight, 0) desc, _updatedAt desc) {
      ${PRODUCT_FIELDS}
    }
  `;

  try {
    const data = await cachedFetch(query, queryParams);
    if (data && data.length > 0) return data;
    return mockOrThrow(() => filterMockProducts(MOCK_PRODUCTS, category, mechanism), 'Product catalog returned no published products.');
  } catch (err) {
    return mockOrThrow(() => filterMockProducts(MOCK_PRODUCTS, category, mechanism), 'Unable to load product catalog.', err);
  }
}

export async function getProductsPaginated({
  category = null,
  mechanism = null,
  page = 1,
  pageSize = 12,
}: {
  category?: string | null;
  mechanism?: string | null;
  page?: number;
  pageSize?: number;
} = {}) {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const params = {
    category: category || '',
    mechanism: mechanism || '',
    start,
    end,
  };
  const filter = `*[_type == "product"
    && ($category == "" || $category in mainCategories)
    && ($mechanism == "" || $mechanism in antiAgingMechanisms)
  ]`;

  try {
    const [products, total] = await Promise.all([
      cachedFetch(`${filter} | order(coalesce(weight, 0) desc, _updatedAt desc) [$start...$end] { ${PRODUCT_CARD_FIELDS} }`, params),
      cachedFetch(`count(${filter})`, params),
    ]);
    return { products: products || [], total: total || 0 };
  } catch (err) {
    if (import.meta.env.DEV) {
      const products = filterMockProducts(MOCK_PRODUCTS, category, mechanism);
      return { products: products.slice(start, end), total: products.length };
    }
    throw err;
  }
}

function filterMockProducts(products: any[], category: string | null, mechanism: string | null) {
  const filtered = products.filter(prod => {
    const matchCat = !category || (prod.mainCategories && prod.mainCategories.includes(category));
    const matchMech = !mechanism || (prod.antiAgingMechanisms && prod.antiAgingMechanisms.includes(mechanism));
    return matchCat && matchMech;
  });
  return filtered.sort((a, b) => (b.weight || 0) - (a.weight || 0));
}

export async function getFeaturedProducts() {
  try {
    const data = await cachedFetch(`
      *[_type == "product" && (featured == true || coalesce(weight, 0) > 0)] | order(coalesce(weight, 0) desc, _updatedAt desc) [0...6] {
        ${PRODUCT_FIELDS}
      }
    `);
    if (data && data.length > 0) return data;
    return mockOrThrow(() => MOCK_PRODUCTS.filter(p => p.featured || (p.weight && p.weight > 0)).sort((a, b) => (b.weight || 0) - (a.weight || 0)), 'Featured products returned no published data.');
  } catch (err) {
    return mockOrThrow(() => MOCK_PRODUCTS.filter(p => p.featured || (p.weight && p.weight > 0)).sort((a, b) => (b.weight || 0) - (a.weight || 0)), 'Unable to load featured products.', err);
  }
}

export async function getProductBySlug(slug: string) {
  try {
    // Product detail pages use Vercel ISR as their durable cache. Always read
    // the authoritative Sanity API during regeneration so publish/delete/slug
    // changes cannot be masked by Sanity CDN or process-memory cache entries.
    const data = await freshFetch(
      `*[_type == "product" && !(_id in path("drafts.**")) && slug.current == $slug][0] {
        ${PRODUCT_DETAIL_FIELDS}
      }`,
      { slug }
    );
    if (data) {
      if (data.coaFile?.asset?.url) {
        data.coaFile.asset.url = data.coaFile.asset.url.replace('https://files.sanity.io', '/media/files');
      }
      if (data.msdsFile?.asset?.url) {
        data.msdsFile.asset.url = data.msdsFile.asset.url.replace('https://files.sanity.io', '/media/files');
      }
      return data;
    }
    return canUseMockFallback ? MOCK_PRODUCTS.find(p => p.slug === slug) || null : null;
  } catch (err) {
    return mockOrThrow(() => MOCK_PRODUCTS.find(p => p.slug === slug) || null, `Unable to load product ${slug}.`, err);
  }
}

export async function getProductRedirectByPreviousSlug(slug: string) {
  try {
    return await freshFetch(
      `*[
        _type == "product" &&
        !(_id in path("drafts.**")) &&
        $slug in coalesce(previousSlugs, [])
      ][0] {
        "slug": slug.current
      }`,
      { slug }
    ) as { slug?: string } | null;
  } catch (err) {
    console.error(`[Sanity] Unable to resolve previous product slug "${slug}".`, err);
    return null;
  }
}

export async function getProductsByCategory(categorySlug: string) {
  try {
    const data = await cachedFetch(
      `*[_type == "product" && category->slug.current == $categorySlug] | order(coalesce(weight, 0) desc, _updatedAt desc) {
        ${PRODUCT_FIELDS}
      }`,
      { categorySlug }
    );
    if (data && data.length > 0) return data;
    return mockOrThrow(() => MOCK_PRODUCTS.filter(p => p.category.slug === categorySlug).sort((a, b) => (b.weight || 0) - (a.weight || 0)), 'Product category returned no published data.');
  } catch (err) {
    return mockOrThrow(() => MOCK_PRODUCTS.filter(p => p.category.slug === categorySlug), `Unable to load product category ${categorySlug}.`, err);
  }
}

// Categories
export async function getAllCategories() {
  try {
    const data = await cachedFetch(`
      *[_type == "category"] | order(order asc) {
        _id, name, "slug": slug.current, description, icon, color
      }
    `);
    if (data && data.length > 0) return data;
    return mockOrThrow(() => MOCK_CATEGORIES, 'Categories returned no published data.');
  } catch (err) {
    return mockOrThrow(() => MOCK_CATEGORIES, 'Unable to load categories.', err);
  }
}

export async function getNavigationData() {
  try {
    const data = await cachedFetch(`{
      "categories": *[_type == "category"] | order(order asc) {
        _id, name, "slug": slug.current
      },
      "products": *[_type == "product" && !(_id in path("drafts.**"))] {
        _id,
        "slug": slug.current,
        name,
        name_ru,
        name_ar,
        name_es,
        purity,
        casNumber,
        botanicalName,
        shortDescription,
        shortDescription_ru,
        shortDescription_ar,
        shortDescription_es,
        heroImage
      },
      "posts": *[_type == "post" && !(_id in path("drafts.**"))]
        | order(publishedAt desc) [0...10] {
          _id,
          "slug": slug.current,
          title,
          title_ru,
          title_ar,
          title_es,
          excerpt,
          excerpt_ru,
          excerpt_ar,
          excerpt_es,
          tags,
          mainImage,
          coverImage
        }
    }`);

    return {
      categories: Array.isArray(data?.categories) ? data.categories : [],
      products: Array.isArray(data?.products) ? data.products : [],
      posts: Array.isArray(data?.posts) ? data.posts : [],
    };
  } catch (err) {
    // Navigation search is optional UI. A temporary CMS outage must not turn
    // an otherwise valid cached content page into a 500 response.
    console.warn('[Navigation] Sanity data unavailable; rendering without dynamic search data.', err);
    return { categories: [], products: [], posts: [] };
  }
}

// Blog Posts
export const POST_FIELDS = `
  _id,
  title,
  title_ru,
  title_ar,
  title_es,
  "slug": slug.current,
  excerpt,
  excerpt_ru,
  excerpt_ar,
  excerpt_es,
  coverImage,
  featured,
  publishedAt,
  updatedAt,
  tags[],
  author->{
    name,
    name_ru,
    name_ar,
    name_es,
    avatar,
    credentials,
    credentials_ru,
    credentials_ar,
    credentials_es
  },
  readTime
`;

export async function getAllPosts(limit = 10) {
  try {
    const data = await cachedFetch(`
      *[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...${limit}] {
        ${POST_FIELDS}
      }
    `);
    if (data && data.length > 0) return data;
    return mockOrThrow(() => MOCK_POSTS.slice(0, limit), 'Posts returned no published data.');
  } catch (err) {
    return mockOrThrow(() => MOCK_POSTS.slice(0, limit), 'Unable to load posts.', err);
  }
}

export async function getPostsPaginated({
  category = null,
  search = '',
  page = 1,
  pageSize = 6,
}: {
  category?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const start = (page - 1) * pageSize;
  const end = page * pageSize;

  const filterConditions = ['_type == "post"', '!(_id in path("drafts.**"))'];
  const params: any = { start, end };

  if (category) {
    filterConditions.push('$category in tags');
    params.category = category;
  }

  if (search && search.trim() !== '') {
    filterConditions.push('(title match $search || title_ru match $search || excerpt match $search || excerpt_ru match $search || tags[] match $search)');
    params.search = search.trim() + '*';
  }

  const filter = `*[${filterConditions.join(' && ')}]`;

  const query = `${filter} | order(publishedAt desc) [$start...$end] {
    ${POST_FIELDS}
  }`;

  const countQuery = `count(${filter})`;

  try {
    const posts = await cachedFetch(query, params);
    const total = await cachedFetch(countQuery, params);
    return { posts, total };
  } catch (err) {
    if (!import.meta.env.DEV) {
      throw err;
    }
    console.warn('Sanity API connection failed, using fallback blog posts.');
    let allMock = MOCK_POSTS;
    if (category) {
      const catSlug = category.toLowerCase().replace(/[^a-z0-9]/g, '');
      allMock = MOCK_POSTS.filter(post =>
        post.tags && post.tags.some(tag =>
          tag.toLowerCase().replace(/[^a-z0-9]/g, '') === catSlug
        )
      );
    }
    if (search && search.trim() !== '') {
      const lowerSearch = search.toLowerCase().trim();
      allMock = allMock.filter(post => {
        const titleMatch = post.title && post.title.toLowerCase().includes(lowerSearch);
        const titleRuMatch = post.title_ru && post.title_ru.toLowerCase().includes(lowerSearch);
        const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(lowerSearch);
        const excerptRuMatch = post.excerpt_ru && post.excerpt_ru.toLowerCase().includes(lowerSearch);
        const tagsMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerSearch));
        return titleMatch || titleRuMatch || excerptMatch || excerptRuMatch || tagsMatch;
      });
    }
    const posts = allMock.slice(start, end);
    const total = allMock.length;
    return { posts, total };
  }
}

export async function getPostBySlug(slug: string) {
  try {
    // Do not use the process-level query cache here. Vercel ISR is the durable
    // page cache; bypassing Sanity CDN and local memory during regeneration
    // prevents deleted posts and newly assigned slugs from staying stale.
    const data = await freshFetch(
      `*[_type == "post" && !(_id in path("drafts.**")) && slug.current == $slug][0] {
        ${POST_FIELDS},
        body,
        body_ru,
        body_ar,
        body_es,
        meta_title,
        meta_title_ru,
        meta_title_ar,
        meta_title_es,
        meta_description,
        meta_description_ru,
        meta_description_ar,
        meta_description_es,
        faqItems,
        faqItems_ru,
        faqItems_ar,
        faqItems_es,
        relatedProduct->{
          name,
          "slug": slug.current,
          shortDescription,
          shortDescription_ru,
          shortDescription_ar,
          shortDescription_es,
          purity,
          heroImage
        }
      }`,
      { slug }
    );
    if (data) return data;
    return canUseMockFallback ? MOCK_POSTS.find(p => p.slug === slug) || null : null;
  } catch (err) {
    return mockOrThrow(() => MOCK_POSTS.find(p => p.slug === slug) || null, `Unable to load post ${slug}.`, err);
  }
}

export async function getPostRedirectByPreviousSlug(slug: string) {
  try {
    return await freshFetch(
      `*[
        _type == "post" &&
        !(_id in path("drafts.**")) &&
        $slug in coalesce(previousSlugs, [])
      ][0] {
        "slug": slug.current
      }`,
      { slug }
    ) as { slug?: string } | null;
  } catch (err) {
    console.error(`[Sanity] Unable to resolve previous post slug "${slug}".`, err);
    return null;
  }
}

export async function rememberDocumentPreviousSlug(
  documentId: string,
  beforeSlug: string,
  afterSlug: string
) {
  if (!documentId || !beforeSlug || beforeSlug === afterSlug) return false;

  const writeToken = import.meta.env.SANITY_REDIRECT_WRITE_TOKEN;
  if (!writeToken) {
    throw new Error('SANITY_REDIRECT_WRITE_TOKEN is not configured.');
  }

  const publishedId = documentId.replace(/^drafts\./, '');
  const existing = await sanityFreshClient.fetch<string[] | null>(
    `*[_id == $documentId][0].previousSlugs`,
    { documentId: publishedId }
  );

  // If an editor reuses a historical slug, it becomes current again and must
  // be removed from redirect history. All older slugs still redirect directly
  // to the latest current slug, avoiding redirect chains.
  const previousSlugs = [...new Set([
    ...(existing || []).filter((slug) => slug !== afterSlug),
    beforeSlug,
  ])];

  if (JSON.stringify(previousSlugs) === JSON.stringify(existing || [])) return false;

  await sanityFreshClient
    .withConfig({ token: writeToken, useCdn: false })
    .patch(publishedId)
    .set({ previousSlugs })
    .commit();

  return true;
}

// Site settings
export async function getSiteSettings() {
  try {
    const data = await cachedFetch(`
      *[_type == "siteSettings"][0] {
        siteName, tagline, contactEmail, phone, address, socialLinks,
        certifications[]{name, logo, href},
        stats[]{value, suffix, label}
      }
    `);
    if (data) return data;
    return mockOrThrow(() => MOCK_SITE_SETTINGS, 'Site settings returned no published data.');
  } catch (err) {
    return mockOrThrow(() => MOCK_SITE_SETTINGS, 'Unable to load site settings.', err);
  }
}

export async function getAllAuthors() {
  try {
    const data = await cachedFetch(`
      *[_type == "author"] | order(name asc) {
        _id,
        name,
        name_ru,
        name_ar,
        name_es,
        title,
        title_ru,
        title_ar,
        title_es,
        credentials,
        credentials_ru,
        credentials_ar,
        credentials_es,
        avatar,
        bio,
        bio_ru,
        bio_ar,
        bio_es
      }
    `);
    if (data && data.length > 0) return data;
    return mockOrThrow(() => MOCK_AUTHORS, 'Authors returned no published data.');
  } catch (err) {
    return mockOrThrow(() => MOCK_AUTHORS, 'Unable to load authors.', err);
  }
}

// ---------------------------------------------------------------------------
// Re-export i18n helpers for convenience in page files
// ---------------------------------------------------------------------------
export { getLocalizedField } from '../i18n/utils';

// ---------------------------------------------------------------------------
// Utility Types (for TypeScript)
// ---------------------------------------------------------------------------
export type SanityProduct = {
  _id: string;
  name: string;
  name_ru?: string;
  name_ar?: string;
  name_es?: string;
  slug: string;
  category: { name: string; slug: string };
  categories?: { name: string; slug: string }[];
  botanicalName?: string;
  purity?: string;
  activeIngredient?: string;
  casNumber?: string;
  shortDescription?: string;
  shortDescription_ru?: string;
  shortDescription_ar?: string;
  shortDescription_es?: string;
  description?: any;
  description_ru?: any;
  description_ar?: any;
  description_es?: any;
  featured?: boolean;
  weight?: number;
  heroImage?: any;
  applications?: any;
  applications_ru?: any;
  applications_ar?: any;
  applications_es?: any;
  certifications?: string[];
  updatedAt?: string;
  application?: string[];
  inciName?: string;
  complianceNote?: string;
  complianceNote_ru?: string;
  complianceNote_ar?: string;
  complianceNote_es?: string;
  meta_title?: string;
  meta_description?: string;
  meta_title_ru?: string;
  meta_description_ru?: string;
  meta_title_ar?: string;
  meta_description_ar?: string;
  meta_title_es?: string;
  meta_description_es?: string;
  mainCategories?: string[];
  antiAgingMechanisms?: string[];
  applicationDisplay?: 'topical' | 'oral' | 'dual';
  faqItems?: { question: string; answer: string }[];
  faqItems_ru?: { question: string; answer: string }[];
  faqItems_ar?: { question: string; answer: string }[];
};

export type SanityPost = {
  _id: string;
  title: string;
  title_ru?: string;
  title_ar?: string;
  slug: string;
  excerpt?: string;
  excerpt_ru?: string;
  excerpt_ar?: string;
  body?: any;
  body_ru?: any;
  body_ar?: any;
  coverImage?: any;
  featured?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  tags?: string[];
  readTime?: number;
  author?: {
    name: string;
    name_ru?: string;
    name_ar?: string;
    name_es?: string;
    avatar?: any;
    credentials?: string;
    credentials_ru?: string;
    credentials_ar?: string;
    credentials_es?: string;
  };
  meta_title?: string;
  meta_title_ru?: string;
  meta_title_ar?: string;
  meta_description?: string;
  meta_description_ru?: string;
  meta_description_ar?: string;
  faqItems?: { question: string; answer: string }[];
  faqItems_ru?: { question: string; answer: string }[];
  faqItems_ar?: { question: string; answer: string }[];
  relatedProduct?: {
    name: string;
    slug: string;
    shortDescription?: string;
    shortDescription_ru?: string;
    shortDescription_ar?: string;
    purity?: string;
    heroImage?: any;
  };
};

export type SanityAuthor = {
  _id: string;
  name: string;
  name_ru?: string;
  name_ar?: string;
  name_es?: string;
  title?: string;
  title_ru?: string;
  title_ar?: string;
  title_es?: string;
  credentials?: string;
  credentials_ru?: string;
  credentials_ar?: string;
  credentials_es?: string;
  avatar?: any;
  bio?: string;
  bio_ru?: string;
  bio_ar?: string;
  bio_es?: string;
};

export { MOCK_POSTS };

// ---------------------------------------------------------------------------
// Related Products & Related Posts Queries for Product Detail Pages
// ---------------------------------------------------------------------------
export async function getRelatedProductsForProduct(productId: string, categorySlug?: string, categoryRef?: string) {
  try {
    const cslug = categorySlug || '';
    const cref = categoryRef || '';
    const query = `*[_type == "product" && _id != $productId && (
      ($cslug != "" && ($cslug == category->slug.current || $cslug in category[]->slug.current || $cslug in mainCategories))
      || ($cref != "" && ($cref == category._ref || $cref in category[]._ref))
    )][0...3] {
      ${PRODUCT_FIELDS}
    }`;
    const data = await cachedFetch(query, { productId: productId || '', cslug, cref });
    if (data && data.length > 0) return data;
    return mockOrThrow(() => MOCK_PRODUCTS.filter(p => p._id !== productId && (!categorySlug || p.category?.slug === categorySlug || (p.mainCategories && p.mainCategories.includes(categorySlug)))).slice(0, 3), 'Related products returned no published data.');
  } catch (err) {
    return mockOrThrow(() => MOCK_PRODUCTS.filter(p => p._id !== productId).slice(0, 3), 'Unable to load related products.', err);
  }
}

export async function getRelatedPostsForProduct(productId: string, categorySlug?: string, categoryRef?: string) {
  try {
    const cslug = categorySlug || '';
    const cref = categoryRef || '';

    // A single ordered query replaces up to three sequential requests. Exact
    // product references win, then category matches, then recent posts.
    const query = `*[_type == "post" && !(_id in path("drafts.**"))] | order(
      select(
        relatedProduct._ref == $productId => 0,
        (($cref != "" && ($cref == category._ref || $cref in category[]._ref))
          || ($cslug != "" && ($cslug == category->slug.current || $cslug in category[]->slug.current || $cslug in tags))) => 1,
        2
      ) asc,
      publishedAt desc
    )[0...3] {
      ${POST_FIELDS}
    }`;
    const posts = await cachedFetch(query, { productId: productId || '', cslug, cref });

    if (posts && posts.length > 0) return posts;
    return mockOrThrow(() => MOCK_POSTS.slice(0, 3), 'Related posts returned no published data.');
  } catch (err) {
    return mockOrThrow(() => MOCK_POSTS.slice(0, 3), 'Unable to load related posts.', err);
  }
}
