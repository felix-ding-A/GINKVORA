import type { APIRoute } from 'astro';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';

export const prerender = false;

type RevalidationPayload = {
  _type?: string;
  slug?: string | { current?: string };
};

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

  // This first rollout deliberately covers only the route currently using ISR.
  if (payload._type !== 'post') {
    return json({ ok: true, skipped: true, reason: 'Unsupported document type.' });
  }

  const slug = typeof payload.slug === 'string' ? payload.slug : payload.slug?.current;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
    return json({ ok: false, error: 'A valid post slug is required.' }, 422);
  }

  const origin = import.meta.env.REVALIDATE_BASE_URL || 'https://ginkvora.com';
  const target = new URL(`/insights/${encodeURIComponent(slug)}`, origin);

  try {
    const response = await fetch(target, {
      headers: { 'x-prerender-revalidate': bypassToken },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`[Revalidate] Vercel returned ${response.status} for ${target.pathname}.`);
      return json({ ok: false, error: 'Vercel revalidation failed.' }, 502);
    }

    console.info(`[Revalidate] Revalidated ${target.pathname}.`);
    return json({ ok: true, revalidated: [target.pathname] });
  } catch (error) {
    console.error('[Revalidate] Unable to call Vercel ISR.', error);
    return json({ ok: false, error: 'Vercel revalidation request failed.' }, 502);
  }
};
