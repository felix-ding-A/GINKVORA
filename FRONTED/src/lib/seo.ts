interface ListingCanonicalOptions {
  origin?: string;
  pathname: string;
  category?: string | null;
  mechanism?: string | null;
  page?: number;
}

/** Build a stable canonical URL for crawlable catalog/blog listing states. */
export function buildListingCanonical({
  origin = 'https://ginkvora.com',
  pathname,
  category,
  mechanism,
  page = 1,
}: ListingCanonicalOptions): string {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (mechanism) params.set('mechanism', mechanism);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();
  return `${origin}${pathname}${query ? `?${query}` : ''}`;
}
