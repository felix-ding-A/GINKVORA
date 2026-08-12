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
      expiration: 86400,
    },
  }),

  build: {
    inlineStylesheets: 'always',
    assets: 'assets',
  },

  integrations: [
    vue(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          ru: 'ru-RU',
          ar: 'ar-SA',
          es: 'es-ES',
        },
      },
    }),
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
    optimizeDeps: {
      include: ['vue'],
    },
    ssr: {
      external: ['@resvg/resvg-js', 'sharp'],
    },
  },
});