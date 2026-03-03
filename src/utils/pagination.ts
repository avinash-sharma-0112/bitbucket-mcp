import type { AxiosInstance, AxiosResponse } from 'axios';

interface PaginatedResponse<T> {
  values: T[];
  next?: string;
}

/** Safety cap to prevent infinite loops on misbehaving APIs */
const MAX_PAGES = 100;

/**
 * Automatically fetches all pages from a Bitbucket paginated endpoint.
 *
 * Bitbucket returns `{ values: T[], next?: string }` for paginated responses.
 * When `next` is present, it is the full URL for the next page.
 */
export async function fetchAllPages<T>(
  client: AxiosInstance,
  url: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | undefined = url;
  let page = 0;

  while (nextUrl !== undefined && page < MAX_PAGES) {
    const response: AxiosResponse<PaginatedResponse<T>> = await client.get<PaginatedResponse<T>>(
      nextUrl,
      {
        // Only send params on the first request; subsequent pages use the full `next` URL
        params: page === 0 ? params : undefined,
      }
    );

    results.push(...response.data.values);
    nextUrl = response.data.next;
    page++;
  }

  return results;
}
