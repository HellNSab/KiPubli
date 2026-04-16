// Shape mirrors the Supabase tables described in CLAUDE.md.
// When we wire Supabase, we can keep these types and swap the
// implementation in src/data/repository.ts.

export type Group = {
  id: string
  name: string
  owner: string
  listed: boolean
  note: string
  wikipedia_url?: string
}

export type Publisher = {
  id: string
  name: string
  name_variants: string[]
  country: string
  founded_year?: number
  group_id: string
}

export type OwnershipChain = {
  publisher: Publisher
  group: Group
}
