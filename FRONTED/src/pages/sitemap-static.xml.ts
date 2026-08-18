import type { APIRoute } from 'astro';
import { LOCALES, alternateLinks, sitemapUrl, staticPages, xmlResponse } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const urls = LOCALES.flatMap((locale) => staticPages.map((path) => {
    const priority = path === '' ? 1 : ['products', 'insights', 'custom-formulation'].includes(path) ? 0.9 : 0.8;
    return `<url><loc>${sitemapUrl(path, locale)}</loc><changefreq>weekly</changefreq><priority>${priority}</priority>${alternateLinks(path)}</url>`;
  })).join('\n');
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`);
};
