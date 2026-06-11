import { normalizeIsbn } from "./isbn";
import { appendIsbnCache } from "./githubJson";

export type BookMetadata = {
  isbn: string;
  title: string;
  authors: string[];
  publisherRaw: string | null;
  thumbnail: string | null;
};

type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

type GoogleResponse = {
  totalItems: number;
  items?: GoogleVolume[];
};

// ── Layer 1: bundled static cache ────────────────────────────────────────────

type IsbnCacheFile = Record<string, BookMetadata>;

let bundledCache: IsbnCacheFile | null = null;

async function getBundledCache(): Promise<IsbnCacheFile> {
  if (bundledCache) return bundledCache;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/isbn-cache.json`);
    if (res.ok) bundledCache = (await res.json()) as IsbnCacheFile;
  } catch {
    /* ignore — cache miss is fine */
  }
  bundledCache ??= {};
  return bundledCache;
}

async function setCacheEntry(isbn: string, data: BookMetadata): Promise<void> {
  const cache = await getBundledCache();
  cache[isbn] = data;
  // Note: we don't persist this to disk, but it will be available for the next fetches in the same session
}

// ── Layer 2: Google Books API ────────────────────────────────────────────────

const RETRYABLE = new Set([500, 502, 503, 504]);

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url);
    if (res.ok || !RETRYABLE.has(res.status)) return res;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * 2 ** i));
  }
  return fetch(url);
}

async function fetchFromApi(isbn: string): Promise<BookMetadata | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Google Books a répondu ${res.status}`);

  const data = (await res.json()) as GoogleResponse;
  if (!data.items || data.items.length === 0) return null;

  const info = data.items[0].volumeInfo ?? {};
  return {
    isbn,
    title: info.title ?? "Titre inconnu",
    authors: info.authors ?? [],
    publisherRaw: info.publisher ?? null,
    thumbnail:
      info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null,
  };
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function fetchBookByIsbn(
  rawIsbn: string,
): Promise<BookMetadata | null> {
  const isbn = normalizeIsbn(rawIsbn);

  const cache = await getBundledCache();
  if (cache[isbn]) return cache[isbn];

  const result = await fetchFromApi(isbn);
  if (result) {
    setCacheEntry(isbn, result);
    appendIsbnCache(isbn, result).catch(() => { /* background — ignore failures */ });
  }
  return result;
}
