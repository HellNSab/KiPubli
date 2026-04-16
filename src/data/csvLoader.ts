import type { Group, Publisher } from './types'

// Minimal RFC 4180-compliant CSV parser.
// Handles quoted fields (commas inside quotes, "" for a literal quote).
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []

  const headers = parseLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ''
    })
    rows.push(row)
  }

  return rows
}

function parseLine(line: string): string[] {
  const fields: string[] = []
  let i = 0

  while (i <= line.length) {
    if (line[i] === '"') {
      // Quoted field
      i++ // skip opening quote
      let value = ''
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          value += '"'
          i += 2
        } else if (line[i] === '"') {
          i++ // skip closing quote
          break
        } else {
          value += line[i++]
        }
      }
      fields.push(value)
      if (line[i] === ',') i++ // skip comma after closing quote
    } else {
      // Unquoted field
      const end = line.indexOf(',', i)
      if (end === -1) {
        fields.push(line.slice(i))
        break
      } else {
        fields.push(line.slice(i, end))
        i = end + 1
      }
    }
  }

  return fields
}

// Module-level cache so we only fetch once per session.
let groupsPromise: Promise<Group[]> | null = null
let publishersPromise: Promise<Publisher[]> | null = null

export function loadGroups(): Promise<Group[]> {
  if (!groupsPromise) {
    groupsPromise = fetch(`${import.meta.env.BASE_URL}data/groups.csv`)
      .then((r) => r.text())
      .then((text) =>
        parseCSV(text).map((row) => ({
          id: row.id,
          name: row.name,
          owner: row.owner,
          listed: row.listed === 'true',
          note: row.note,
          wikipedia_url: row.wikipedia_url || undefined,
        }))
      )
  }
  return groupsPromise
}

export function loadPublishers(): Promise<Publisher[]> {
  if (!publishersPromise) {
    publishersPromise = fetch(`${import.meta.env.BASE_URL}data/publishers.csv`)
      .then((r) => r.text())
      .then((text) =>
        parseCSV(text).map((row) => ({
          id: row.id,
          name: row.name,
          name_variants: row.name_variants ? row.name_variants.split('|') : [],
          country: row.country,
          founded_year: row.founded_year ? parseInt(row.founded_year, 10) : undefined,
          group_id: row.group_id,
        }))
      )
  }
  return publishersPromise
}
