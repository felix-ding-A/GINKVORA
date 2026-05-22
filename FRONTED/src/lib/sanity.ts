// src/lib/sanity.ts — Sanity client and query helpers (with robust Mock Data fallback)
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_POSTS, MOCK_SITE_SETTINGS } from './mockData';

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

export function urlFor(source: any) {
  // If source is already a direct URL string (used in mock data), return it directly
  if (typeof source === 'string' && source.startsWith('http')) {
    return { url: () => source, width: (_w: number) => ({ url: () => source }) };
  }
  // If the image source is a dummy/mock value or not defined, return a placeholder
  if (!source || typeof source !== 'object' || source.asset === undefined) {
    return {
      url: () => 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
      width: (_w: number) => ({ url: () => 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80' }),
    };
  }
  try {
    return builder.image(source);
  } catch (err) {
    return {
      url: () => 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
    };
  }
}

// ---------------------------------------------------------------------------
// GROQ Queries
// ---------------------------------------------------------------------------

export const PRODUCT_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  category->{name, "slug": slug.current},
  botanicalName,
  purity,
  activeIngredient,
  casNumber,
  shortDescription,
  featured,
  heroImage,
  applications[],
  certifications[],
  "updatedAt": _updatedAt
`;

export const PRODUCT_DETAIL_FIELDS = `
  ${PRODUCT_FIELDS},
  description,
  specifications[]{label, value},
  gallery[],
  coaFile{asset->{url}},
  msdsFile{asset->{url}},
  seo{title, description}
`;

export async function getAllProducts() {
  try {
    const data = await sanityClient.fetch(`
      *[_type == "product"] | order(featured desc, name asc) {
        ${PRODUCT_FIELDS}
      }
    `);
    if (data && data.length > 0) return data;
    return MOCK_PRODUCTS;
  } catch (err) {
    console.warn('Sanity API connection failed, using fallback mock data for products.');
    return MOCK_PRODUCTS;
  }
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
  "slug": slug.current,
  excerpt,
  coverImage,
  publishedAt,
  tags[],
  author->{name, avatar},
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

export async function getPostBySlug(slug: string) {
  try {
    const data = await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        ${POST_FIELDS},
        body,
        seo{title, description}
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

// ---------------------------------------------------------------------------
// Utility Types (for TypeScript)
// ---------------------------------------------------------------------------
export type SanityProduct = {
  _id: string;
  name: string;
  slug: string;
  category: { name: string; slug: string };
  botanicalName?: string;
  purity?: string;
  activeIngredient?: string;
  casNumber?: string;
  shortDescription?: string;
  featured?: boolean;
  heroImage?: any;
  applications?: string[];
  certifications?: string[];
  updatedAt?: string;
};

export type SanityPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: any;
  publishedAt?: string;
  tags?: string[];
  readTime?: number;
};
