import { getAllPublishers } from '../data/repository'
import type { Publisher } from '../data/types'

// Normalize for comparison: lowercase, strip accents, collapse whitespace.
function normalize(s: string | undefined | null): string {
  if (!s) return ''
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Match raw publisher string from Google Books against the known list.
// Strategy:
// 1. Exact normalized match against name + variants (highest confidence).
// 2. Substring containment either way — handles "Éditions Gallimard" vs "Gallimard".
// We prefer the longest variant match to avoid e.g. matching "Le Livre"
// when the actual publisher is "Le Livre de Poche".
export async function matchPublisher(raw: string): Promise<Publisher | null> {
  const target = normalize(raw)
  if (!target) return null

  const publishers = await getAllPublishers()
  let best: { publisher: Publisher; score: number } | null = null

  for (const publisher of publishers) {
    const candidates = [publisher.name, ...publisher.name_variants]
    for (const candidate of candidates) {
      const norm = normalize(candidate)
      if (!norm) continue

      let score = 0
      if (target === norm) score = 1000 + norm.length
      else if (target.includes(norm)) score = 500 + norm.length
      else if (norm.includes(target)) score = 250 + target.length

      if (score > 0 && (!best || score > best.score)) {
        best = { publisher, score }
      }
    }
  }

  return best?.publisher ?? null
}
