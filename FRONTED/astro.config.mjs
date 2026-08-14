// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://ginkvora.com',
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel({
    isr: {
      // Preview PoC: existing public dynamic routes stay on their current path.
      expiration: 60 * 60 * 24 * 7,
      bypassToken: process.env.ISR_BYPASS_TOKEN,
      exclude: [
        '/products', '/es/products', '/ru/products', '/ar/products',
        '/insights', '/es/insights', '/ru/insights', '/ar/insights',
        '/products/[slug]', '/es/products/[slug]', '/ru/products/[slug]', '/ar/products/[slug]',
        '/insights/[slug]', '/es/insights/[slug]', '/ru/insights/[slug]', '/ar/insights/[slug]',
        '/contact', '/es/contact', '/ru/contact', '/ar/contact',
        '/thank-you', '/es/thank-you', '/ru/thank-you', '/ar/thank-you',
        '/sitemap.xml', '/sitemap-index.xml', '/sitemap-static.xml',
        '/sitemap-products.xml', '/sitemap-posts.xml',
        /^\/api\/.+/,
      ],
    },
  }),

  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
  },

  integrations: [
    vue(),
    mdx(),
  ],

  // i18n routing
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'ar', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // Image optimization
  image: {
    domains: ['cdn.sanity.io'],
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },

  // Vite config — Tailwind 4 uses Vite plugin
  vite: {
    plugins: [tailwindcss()],
    build: {
      modulePreload: {
        polyfill: true
      }
    },
    optimizeDeps: {
      include: ['vue'],
    },
    ssr: {
      external: ['@resvg/resvg-js', 'sharp'],
    },
  },
});
