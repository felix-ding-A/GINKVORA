import type { APIRoute } from 'astro';
import { getAllProducts, getAllPosts } from '../lib/sanity';

const SITE_URL = 'https://ginkvora.com';
const LOCALES = ['en', 'ru', 'es', 'ar'];

const staticPages = [
  '',
  'about',
  'contact',
  'quality',
  'terms',
  'privacy',
  'products',
  'insights'
];

function generateUrl(path: string, locale: string) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const fullPath = path ? `/${path}` : '';
  return `${SITE_URL}${prefix}${fullPath}`;
}

export const GET: APIRoute = async () => {
  try {
    const products = await getAllProducts();
    const posts = await getAllPosts(100);

    const now = new Date().toISOString();
    let urlsXml = '';

    // Helper to generate alternate links for all locales
    const getAlternateLinks = (path: string) => {
      return LOCALES.map(loc => 
        `<xhtml:link rel="alternate" hreflang="${loc}" href="${generateUrl(path, loc)}" />`
      ).join('\n    ');
    };

    LOCALES.forEach(locale => {
      // Add static pages
      staticPages.forEach(page => {
        let priority = 0.8;
        if (page === '') priority = 1.0;
        else if (page === 'terms' || page === 'privacy') priority = 0.3;

        urlsXml += `
  <url>
    <loc>${generateUrl(page, locale)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority.toFixed(1)}</priority>
    ${getAlternateLinks(page)}
  </url>`;
      });

      // Add product pages
      if (products && Array.isArray(products)) {
        products.forEach((product: any) => {
          if (product?.slug) {
            const path = `products/${product.slug}`;
            urlsXml += `
  <url>
    <loc>${generateUrl(path, locale)}</loc>
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString() : now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    ${getAlternateLinks(path)}
  </url>`;
          }
        });
      }

      // Add insight pages
      if (posts && Array.isArray(posts)) {
        posts.forEach((post: any) => {
          if (post?.slug) {
            const path = `insights/${post.slug}`;
            urlsXml += `
  <url>
    <loc>${generateUrl(path, locale)}</loc>
    <lastmod>${post.publishedAt ? new Date(post.publishedAt).toISOString() : now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    ${getAlternateLinks(path)}
  </url>`;
          }
        });
      }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml}
</urlset>`;

    return new Response(sitemap.trim(), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
};
