import type { APIRoute } from 'astro';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { rememberDocumentPreviousSlug } from '../../lib/sanity';

export const prerender = false;

type RevalidationPayload = {
  // Sanity webhook Projection must include the published document ID so a
  // slug change can be persisted as a durable redirect before ISR refreshes.
  _id?: string;
  _type?: string;
  beforeSlug?: string | { current?: string };
  afterSlug?: string | { current?: string };
  operation?: 'create' | 'update' | 'delete' | 'slug-change';
  // Backward compatibility while the Sanity webhook projection is updated.
  slug?: string | { current?: string };
};

type RevalidationTarget = {
  slug: string;
  pathname: string;
  expectedToBeMissing: boolean;
};

const CONTENT_LOCALE_PREFIXES = ['', '/ru', '/ar', '/es'] as const;
const CONTENT_ROUTE_SEGMENTS = {
  post: 'insights',
  product: 'products',
} as const;

const normalizeSlug = (value?: string | { current?: string }) =>
  typeof value === 'string' ? value : value?.current;

const isValidSlug = (slug?: string): slug is string =>
  Boolean(slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug));

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.SANITY_REVALIDATE_SECRET;
  const bypassToken = import.meta.env.ISR_BYPASS_TOKEN;
  const protectionBypass = import.meta.env.REVALIDATE_PROTECTION_BYPASS;

  if (!secret || !bypassToken) {
    console.error('[Revalidate] Missing SANITY_REVALIDATE_SECRET or ISR_BYPASS_TOKEN.');
    return json({ ok: false, error: 'Revalidation is not configured.' }, 503);
  }

  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME);

  if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
    console.warn('[Revalidate] Rejected webhook with an invalid Sanity signature.');
    return json({ ok: false, error: 'Invalid signature.' }, 401);
  }

  let payload: RevalidationPayload;
  try {
    payload = JSON.parse(rawBody) as RevalidationPayload;
  } catch {
    return json({ ok: false, error: 'Invalid JSON payload.' }, 400);
  }

  if (payload._type !== 'post' && payload._type !== 'product') {
    return json({ ok: true, skipped: true, reason: 'Unsupported document type.' });
  }

  const routeSegment = CONTENT_ROUTE_SEGMENTS[payload._type];

  const beforeSlug = normalizeSlug(payload.beforeSlug);
  const afterSlug = normalizeSlug(payload.afterSlug);
  const legacySlug = normalizeSlug(payload.slug);
  const operation = beforeSlug && afterSlug && beforeSlug !== afterSlug
    ? 'slug-change'
    : payload.operation || (
        beforeSlug && !afterSlug
          ? 'delete'
          : !beforeSlug && afterSlug
            ? 'create'
            : 'update'
      );

  if (operation === 'slug-change') {
    if (!payload._id || !beforeSlug || !afterSlug) {
      return json({ ok: false, error: 'Slug changes require _id, beforeSlug and afterSlug.' }, 422);
    }

    try {
      const recorded = await rememberDocumentPreviousSlug(payload._id, beforeSlug, afterSlug);
      console.info(
        recorded
          ? `[Revalidate] Recorded previous slug ${beforeSlug} for ${afterSlug}.`
          : `[Revalidate] Previous slug ${beforeSlug} was already recorded.`
      );
    } catch (error) {
      console.error('[Revalidate] Unable to record the previous slug in Sanity.', error);
      return json({ ok: false, error: 'Unable to persist the previous slug redirect.' }, 502);
    }
  }

  const targetsByPathname = new Map<string, RevalidationTarget>();
  const addTarget = (slug: string | undefined, expectedToBeMissing: boolean) => {
    if (!isValidSlug(slug)) return;
    for (const localePrefix of CONTENT_LOCALE_PREFIXES) {
      const pathname = `${localePrefix}/${routeSegment}/${encodeURIComponent(slug)}`;
      targetsByPathname.set(pathname, { slug, pathname, expectedToBeMissing });
    }
  };

  if (beforeSlug || afterSlug) {
    addTarget(beforeSlug, operation === 'delete' || operation === 'slug-change');
    addTarget(afterSlug, false);
  } else {
    addTarget(legacySlug, false);
  }

  const targets = [...targetsByPathname.values()];
  if (targets.length === 0) {
    return json({ ok: false, error: 'At least one valid content slug is required.' }, 422);
  }

  const origin = import.meta.env.REVALIDATE_BASE_URL || 'https://ginkvora.com';
  const revalidated: string[] = [];
  const removed: string[] = [];

  try {
    // Each localized route has its own ISR entry. Refresh them concurrently so
    // a four-language slug change does not turn into eight sequential waits.
    const results = await Promise.all(targets.map(async (item) => {
      const target = new URL(item.pathname, origin);
      const response = await fetch(target, {
        headers: {
          'x-prerender-revalidate': bypassToken,
          ...(protectionBypass ? { 'x-vercel-protection-bypass': protectionBypass } : {}),
        },
        cache: 'no-store',
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      });

      return { item, response };
    }));

    for (const { item, response } of results) {
      if (response.ok) {
        revalidated.push(item.pathname);
        console.info(`[Revalidate] Revalidated ${item.pathname}.`);
        continue;
      }

      if (response.status === 404 && item.expectedToBeMissing) {
        removed.push(item.pathname);
        console.info(`[Revalidate] Removed ${item.pathname} from ISR.`);
        continue;
      }

      console.error(`[Revalidate] Vercel returned ${response.status} for ${item.pathname}.`);
      return json({
        ok: false,
        error: 'Vercel revalidation failed.',
        failed: item.pathname,
        status: response.status,
        revalidated,
        removed,
      }, 502);
    }

    return json({ ok: true, operation, revalidated, removed });
  } catch (error) {
    console.error('[Revalidate] Unable to call Vercel ISR.', error);
    return json({ ok: false, error: 'Vercel revalidation request failed.' }, 502);
  }
};
