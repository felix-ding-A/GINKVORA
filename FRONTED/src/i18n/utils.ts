// src/i18n/utils.ts — i18n helper utilities

import { ui, defaultLang, languages, upcomingLanguages } from './ui';
import type { Lang, UIKey } from './ui';

export { defaultLang, languages, upcomingLanguages };
export type { Lang };

// ─────────────────────────────────────────────────────────────────────────────
// Language Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the language code from a URL pathname.
 * e.g. /ru/products → 'ru', /products → 'en'
 */
export function getLangFromUrl(url: URL): Lang {
  const [, firstSegment] = url.pathname.split('/');
  if (firstSegment in languages) return firstSegment as Lang;
  return defaultLang;
}

/**
 * Get all supported language codes
 */
export const supportedLangs = Object.keys(languages) as Lang[];

// ─────────────────────────────────────────────────────────────────────────────
// Translation Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a t() function scoped to the given language.
 * Falls back to English if a key is missing in the target language.
 */
export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    const translations = ui[lang] as Record<string, string> | undefined;
    const fallback = ui[defaultLang] as Record<string, string>;
    return translations?.[key] ?? fallback[key] ?? key;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Path Utilities
// ─────────────────────────────────────────────────────────────────────────────

const ALL_KNOWN_LANG_PREFIXES = new Set(['en', 'ru', 'es', 'ar', 'zh', 'ja', 'de', 'fr', 'pt', 'it']);

/**
 * Strip any language prefix(es) from a path.
 * Handles single or nested language prefixes (e.g. '/ru/products' -> '/products', '/es/ru/insights' -> '/insights', '/ru/ru/about' -> '/about').
 */
export function stripLangPrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  while (segments.length > 0 && ALL_KNOWN_LANG_PREFIXES.has(segments[0])) {
    segments.shift();
  }
  return '/' + segments.join('/');
}

/**
 * Build a localized path from a base path and target language.
 * e.g. getLocalePath('ru', '/products') → '/ru/products'
 *      getLocalePath('en', '/products') → '/products'
 */
export function getLocalePath(lang: Lang, path: string): string {
  const cleanPath = stripLangPrefix(path);
  if (lang === defaultLang) return cleanPath || '/';
  return `/${lang}${cleanPath}`;
}

/**
 * Given the current URL and current language, generate the equivalent paths
 * for all other languages. Used by the Navbar language switcher.
 * Returns an object: { en: '/products', ru: '/ru/products', ... }
 */
export function getAlternatePaths(currentUrl: URL, currentLang: Lang): Record<Lang, string> {
  const basePath = stripLangPrefix(currentUrl.pathname);
  const result = {} as Record<Lang, string>;
  for (const lang of supportedLangs) {
    result[lang] = getLocalePath(lang, basePath);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Localization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a localized field from a Sanity document.
 * Tries `fieldName_<lang>` first, then falls back to `fieldName` (English).
 * e.g. getLocalizedField(product, 'shortDescription', 'ru')
 *      → product.shortDescription_ru ?? product.shortDescription
 */
export function getLocalizedField<T>(
  doc: Record<string, any>,
  field: string,
  lang: Lang
): T | undefined {
  if (lang !== defaultLang) {
    const localizedKey = `${field}_${lang}`;
    if (doc[localizedKey] !== undefined && doc[localizedKey] !== null && doc[localizedKey] !== '') {
      return doc[localizedKey] as T;
    }
  }
  return doc[field] as T | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// RTL Detection
// ─────────────────────────────────────────────────────────────────────────────

const RTL_LANGS: string[] = ['ar'];

export function isRtl(lang: string): boolean {
  return RTL_LANGS.includes(lang);
}

export function getDir(lang: Lang): 'ltr' | 'rtl' {
  return isRtl(lang) ? 'rtl' : 'ltr';
}
