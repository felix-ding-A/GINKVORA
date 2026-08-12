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
  adapter: vercel(),

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