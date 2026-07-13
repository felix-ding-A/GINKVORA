// src/lib/sanity.ts — Sanity client and query helpers (with robust Mock Data fallback)
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_POSTS, MOCK_SITE_SETTINGS, MOCK_AUTHORS } from './mockData';

// ---------------------------------------------------------------------------
// Client Configuration
// ---------------------------------------------------------------------------
export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'placeholder',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: import.meta.env.PROD ? true : false,
  token: import.meta.env.SANITY_API_TOKEN,
});

// ---------------------------------------------------------------------------
// Image URL Builder
// ---------------------------------------------------------------------------
const builder = imageUrlBuilder(sanityClient);

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
  // If source is already a direct URL string (used in mock data), return it directly
  if (typeof source === 'string' && source.startsWith('http')) {
    let currentUrl = source;
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
    return builder.image(source).auto('format');
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
    ] | order(_updatedAt desc) {
      ${PRODUCT_FIELDS}
    }
  `;

  try {
    const data = await sanityClient.fetch(query, queryParams);
    if (data && data.length > 0) return data;
    return filterMockProducts(MOCK_PRODUCTS, category, mechanism);
  } catch (err) {
    console.warn('Sanity API connection failed, filtering mock data locally.');
    return filterMockProducts(MOCK_PRODUCTS, category, mechanism);
  }
}

function filterMockProducts(products: any[], category: string | null, mechanism: string | null) {
  return products.filter(prod => {
    const matchCat = !category || (prod.mainCategories && prod.mainCategories.includes(category));
    const matchMech = !mechanism || (prod.antiAgingMechanisms && prod.antiAgingMechanisms.includes(mechanism));
    return matchCat && matchMech;
  });
}

export async function getFeaturedProducts() {
  try {
    const data = await sanityClient.fetch(`
      *[_type == "product" && featured == true] | order(name asc) [0...6] {
        ${PRODUCT_FIELDS}
      }
    `);
    if (data && data.length > 0) return data;
    return MOCK_PRODUCTS.filter(p => p.featured);
  } catch (err) {
    console.warn('Sanity API connection failed, using fallback mock data for featured products.');
    return MOCK_PRODUCTS.filter(p => p.featured);
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const data = await sanityClient.fetch(
      `*[_type == "product" && slug.current == $slug][0] {
        ${PRODUCT_DETAIL_FIELDS}
      }`,
      { slug }
    );
    if (data) return data;
    return MOCK_PRODUCTS.find(p => p.slug === slug) || null;
  } catch (err) {
    console.warn(`Sanity API connection failed, looking up fallback product: ${slug}`);
    return MOCK_PRODUCTS.find(p => p.slug === slug) || null;
  }
}

export async function getProductsByCategory(categorySlug: string) {
  try {
    const data = await sanityClient.fetch(
      `*[_type == "product" && category->slug.current == $categorySlug] | order(name asc) {
        ${PRODUCT_FIELDS}
      }`,
      { categorySlug }
    );
    if (data && data.length > 0) return data;
    return MOCK_PRODUCTS.filter(p => p.category.slug === categorySlug);
  } catch (err) {
    console.warn(`Sanity API connection failed, getting fallback products by category: ${categorySlug}`);
    return MOCK_PRODUCTS.filter(p => p.category.slug === categorySlug);
  }
}

// Categories
export async function getAllCategories() {
  try {
    const data = await sanityClient.fetch(`
      *[_type == "category"] | order(order asc) {
        _id, name, "slug": slug.current, description, icon, color
      }
    `);
    if (data && data.length > 0) return data;
    return MOCK_CATEGORIES;
  } catch (err) {
    console.warn('Sanity API connection failed, using fallback mock categories.');
    return MOCK_CATEGORIES;
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
    const data = await sanityClient.fetch(`
      *[_type == "post"] | order(publishedAt desc) [0...${limit}] {
        ${POST_FIELDS}
      }
    `);
    if (data && data.length > 0) return data;
    return MOCK_POSTS.slice(0, limit);
  } catch (err) {
    console.warn('Sanity API connection failed, using fallback blog posts.');
    return MOCK_POSTS.slice(0, limit);
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

  const filterConditions = ['_type == "post"'];
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
    const posts = await sanityClient.fetch(query, params);
    const total = await sanityClient.fetch(countQuery, params);
    return { posts, total };
  } catch (err) {
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
    const data = await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
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
    return MOCK_POSTS.find(p => p.slug === slug) || null;
  } catch (err) {
    console.warn(`Sanity API connection failed, finding fallback blog post: ${slug}`);
    return MOCK_POSTS.find(p => p.slug === slug) || null;
  }
}

// Site settings
export async function getSiteSettings() {
  try {
    const data = await sanityClient.fetch(`
      *[_type == "siteSettings"][0] {
        siteName, tagline, contactEmail, phone, address, socialLinks,
        certifications[]{name, logo, href},
        stats[]{value, suffix, label}
      }
    `);
    if (data) return data;
    return MOCK_SITE_SETTINGS;
  } catch (err) {
    console.warn('Sanity API connection failed, using fallback site settings.');
    return MOCK_SITE_SETTINGS;
  }
}

export async function getAllAuthors() {
  try {
    const data = await sanityClient.fetch(`
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
    return MOCK_AUTHORS;
  } catch (err) {
    console.warn('Sanity API connection failed, using fallback mock authors.');
    return MOCK_AUTHORS;
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
  description?: any;
  description_ru?: any;
  description_ar?: any;
  featured?: boolean;
  heroImage?: any;
  applications?: any;
  applications_ru?: any;
  applications_ar?: any;
  certifications?: string[];
  updatedAt?: string;
  application?: string[];
  inciName?: string;
  complianceNote?: string;
  complianceNote_ru?: string;
  complianceNote_ar?: string;
  meta_title?: string;
  meta_description?: string;
  meta_title_ru?: string;
  meta_description_ru?: string;
  meta_title_ar?: string;
  meta_description_ar?: string;
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

