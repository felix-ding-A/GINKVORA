import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/sanity';
import { LOCALES, alternateLinks, sitemapUrl, xmlResponse } from '../lib/sitemap';

const SITEMAP_POST_LIMIT = 10_000;

export const GET: APIRoute = async () => {
  try {
    const posts = await getAllPosts(SITEMAP_POST_LIMIT);
    const now = new Date().toISOString();
    const urls = posts.flatMap((post: any) => post?.slug ? LOCALES.map((locale) => {
      const path = `insights/${post.slug}`;
      const lastmod = post.updatedAt ? new Date(post.updatedAt).toISOString() : (post.publishedAt ? new Date(post.publishedAt).toISOString() : now);
      return `<url><loc>${sitemapUrl(path, locale)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority>${alternateLinks(path)}</url>`;
    }) : []).join('\n');
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`);
  } catch (error) {
    console.error('Error generating post sitemap:', error);
    return new Response('Error generating post sitemap', { status: 503 });
  }
};
