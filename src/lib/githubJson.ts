import type { BookMetadata } from './googleBooks'

const OWNER = 'HellNSab'
const REPO = 'KiPubli'
const API = 'https://api.github.com'
const ISBN_CACHE_PATH = 'public/data/isbn-cache.json'

function token(): string {
  return import.meta.env.VITE_GITHUB_TOKEN ?? ''
}

export function hasToken(): boolean {
  return Boolean(import.meta.env.VITE_GITHUB_TOKEN)
}

function b64decode(encoded: string): string {
  const bytes = Uint8Array.from(atob(encoded.replace(/\n/g, '')), c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function b64encode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

async function getJsonFile<T>(path: string): Promise<{ sha: string; data: T }> {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const file = await res.json()
  return { sha: file.sha, data: JSON.parse(b64decode(file.content)) as T }
}

async function putJsonFile(path: string, data: unknown, sha: string, message: string): Promise<void> {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content: b64encode(JSON.stringify(data, null, 2)), sha }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `GitHub API ${res.status}`)
  }
}

export async function appendIsbnCache(isbn: string, book: BookMetadata): Promise<void> {
  if (!hasToken()) return
  const { sha, data } = await getJsonFile<Record<string, BookMetadata>>(ISBN_CACHE_PATH)
  if (data[isbn]) return
  data[isbn] = book
  await putJsonFile(ISBN_CACHE_PATH, data, sha, `cache: ISBN ${isbn} — ${book.title}`)
}
