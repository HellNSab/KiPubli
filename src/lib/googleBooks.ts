import { normalizeIsbn } from './isbn'

export type BookMetadata = {
  isbn: string
  title: string
  authors: string[]
  publisherRaw: string | null
  thumbnail: string | null
}

type GoogleVolume = {
  volumeInfo?: {
    title?: string
    authors?: string[]
    publisher?: string
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
  }
}

type GoogleResponse = {
  totalItems: number
  items?: GoogleVolume[]
}

const RETRYABLE = new Set([429, 500, 502, 503, 504])

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url)
    if (res.ok || !RETRYABLE.has(res.status)) return res
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * 2 ** i))
  }
  // Return last response so caller can inspect the status
  return fetch(url)
}

export async function fetchBookByIsbn(rawIsbn: string): Promise<BookMetadata | null> {
  const isbn = normalizeIsbn(rawIsbn)
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
  const res = await fetchWithRetry(url)
  if (!res.ok) throw new Error(`Google Books a répondu ${res.status}`)

  const data = (await res.json()) as GoogleResponse
  if (!data.items || data.items.length === 0) return null

  const info = data.items[0].volumeInfo ?? {}
  return {
    isbn,
    title: info.title ?? 'Titre inconnu',
    authors: info.authors ?? [],
    publisherRaw: info.publisher ?? null,
    thumbnail: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null,
  }
}
