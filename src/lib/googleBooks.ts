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

export async function fetchBookByIsbn(rawIsbn: string): Promise<BookMetadata | null> {
  const isbn = normalizeIsbn(rawIsbn)
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
  const res = await fetch(url)
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
