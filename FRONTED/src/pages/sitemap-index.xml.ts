import type { APIRoute } from 'astro';
import { SITE_URL, xmlResponse } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-products.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-posts.xml</loc>
  </sitemap>
</sitemapindex>`;

  return xmlResponse(indexXml);
};
