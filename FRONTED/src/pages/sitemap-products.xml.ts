import type { APIRoute } from 'astro';
import { getAllProducts } from '../lib/sanity';
import { LOCALES, alternateLinks, sitemapUrl, xmlResponse } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  try {
    const products = await getAllProducts();
    const now = new Date().toISOString();
    const urls = products.flatMap((product: any) => product?.slug ? LOCALES.map((locale) => {
      const path = `products/${product.slug}`;
      const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString() : now;
      return `<url><loc>${sitemapUrl(path, locale)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority>${alternateLinks(path)}</url>`;
    }) : []).join('\n');
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`);
  } catch (error) {
    console.error('Error generating product sitemap:', error);
    return new Response('Error generating product sitemap', { status: 503 });
  }
};
