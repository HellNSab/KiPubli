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

type OpenLibraryResponse = {
  title?: string;
  authors: { key: string }[];
  publishers: string[];
  covers: number[];
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

// ── Layer 2: Open Library API ────────────────────────────────────────────────

const RETRYABLE = new Set([500, 502, 503, 504]);

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url);
    if (res.ok || !RETRYABLE.has(res.status)) return res;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * 2 ** i));
  }
  return fetch(url);
}

async function fetchFromOpenLibraryApi(
  isbn: string,
): Promise<BookMetadata | null> {
  const url = `https://openlibrary.org/isbn/${isbn}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Open library a répondu ${res.status}`);

  const data = (await res.json()) as OpenLibraryResponse;
  const authorIds = data.authors.map((a) => a.key.split("/").slice(-1)[0]);
  const authorNames = await Promise.all(
    authorIds.map(async (id) => {
      const res = await fetchWithRetry(
        `https://openlibrary.org/authors/${id}.json`,
      );
      if (!res.ok) return "Auteur inconnu";
      const authorData = await res.json();
      return authorData.name ?? "Auteur inconnu";
    }),
  );
  return {
    isbn,
    title: data.title ?? "Titre inconnu",
    authors: authorNames,
    publisherRaw: data.publishers[0] ?? null,
    thumbnail: `https://openlibrary.org/covers/id/${data.covers[0]}-M.jpg`,
  };
}

// ── Layer 3: Google Books API ────────────────────────────────────────────────

async function fetchFromGoogleApi(isbn: string): Promise<BookMetadata | null> {
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

  const resultOpenLibrary = await fetchFromOpenLibraryApi(isbn);
  if (resultOpenLibrary) {
    setCacheEntry(isbn, resultOpenLibrary);
    appendIsbnCache(isbn, resultOpenLibrary).catch(() => {
      /* background — ignore failures */
    });
    return resultOpenLibrary;
  }

  const resultGoogleBooks = await fetchFromGoogleApi(isbn);
  if (resultGoogleBooks) {
    setCacheEntry(isbn, resultGoogleBooks);
    appendIsbnCache(isbn, resultGoogleBooks).catch(() => {
      /* background — ignore failures */
    });
  }
  return resultGoogleBooks;
}
