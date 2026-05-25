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

  integrations: [
    vue(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          ru: 'ru-RU',
          es: 'es-ES',
          ar: 'ar-SA',
        },
      },
    }),
    mdx(),
  ],

  // i18n routing
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'es', 'ar'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // Image optimization
  image: {
    domains: ['cdn.sanity.io'],
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
    formats: ['image/avif', 'image/webp'],
  },

  // Vite config — Tailwind 4 uses Vite plugin
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['vue'],
    },
  },
});