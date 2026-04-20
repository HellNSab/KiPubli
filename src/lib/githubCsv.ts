import type { Group, Publisher } from '../data/types'

const OWNER = 'HellNSab'
const REPO = 'KiPubli'
const API = 'https://api.github.com'

function token(): string {
  return import.meta.env.VITE_GITHUB_TOKEN ?? ''
}

export function hasToken(): boolean {
  return Boolean(import.meta.env.VITE_GITHUB_TOKEN)
}

async function getFile(path: string): Promise<{ sha: string }> {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const data = await res.json()
  return { sha: data.sha }
}

async function putFile(path: string, content: string, sha: string, message: string): Promise<void> {
  // UTF-8 safe base64
  const encoded = btoa(unescape(encodeURIComponent(content)))
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content: encoded, sha }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `GitHub API ${res.status}`)
  }
}

function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function serializeCSV(headers: string[], rows: Record<string, string>[]): string {
  return [
    headers.join(','),
    ...rows.map(row => headers.map(h => escapeField(row[h] ?? '')).join(',')),
  ].join('\n')
}

// ── Groups ────────────────────────────────────────────────────

const GROUPS_PATH = 'public/data/groups.csv'
const GROUPS_HEADERS = ['id', 'name', 'owner', 'listed', 'note', 'wikipedia_url', 'distributeur', 'distributeur_owner', 'diffuseur', 'diffuseur_owner']

function groupToRow(g: Group): Record<string, string> {
  return {
    id: g.id,
    name: g.name,
    owner: g.owner,
    listed: g.listed ? 'true' : 'false',
    note: g.note,
    wikipedia_url: g.wikipedia_url ?? '',
    distributeur: g.distributeur ?? '',
    distributeur_owner: g.distributeur_owner ?? '',
    diffuseur: g.diffuseur ?? '',
    diffuseur_owner: g.diffuseur_owner ?? '',
  }
}

export async function saveGroup(group: Group, allGroups: Group[]): Promise<void> {
  const { sha } = await getFile(GROUPS_PATH)
  const isEdit = allGroups.some(g => g.id === group.id)
  const updated = isEdit
    ? allGroups.map(g => (g.id === group.id ? group : g))
    : [...allGroups, group]
  const csv = serializeCSV(GROUPS_HEADERS, updated.map(groupToRow))
  await putFile(GROUPS_PATH, csv, sha, `${isEdit ? 'Modifier' : 'Ajouter'} groupe "${group.id}"`)
}

export async function deleteGroup(groupId: string, allGroups: Group[]): Promise<void> {
  const { sha } = await getFile(GROUPS_PATH)
  const updated = allGroups.filter(g => g.id !== groupId)
  const csv = serializeCSV(GROUPS_HEADERS, updated.map(groupToRow))
  await putFile(GROUPS_PATH, csv, sha, `Supprimer groupe "${groupId}"`)
}

// ── Publishers ────────────────────────────────────────────────

const PUBLISHERS_PATH = 'public/data/publishers.csv'
const PUBLISHERS_HEADERS = ['id', 'name', 'name_variants', 'country', 'founded_year', 'group_id']

function publisherToRow(p: Publisher): Record<string, string> {
  return {
    id: p.id,
    name: p.name,
    name_variants: p.name_variants.join('|'),
    country: p.country,
    founded_year: p.founded_year != null ? String(p.founded_year) : '',
    group_id: p.group_id,
  }
}

export async function savePublisher(publisher: Publisher, allPublishers: Publisher[]): Promise<void> {
  const { sha } = await getFile(PUBLISHERS_PATH)
  const isEdit = allPublishers.some(p => p.id === publisher.id)
  const updated = isEdit
    ? allPublishers.map(p => (p.id === publisher.id ? publisher : p))
    : [...allPublishers, publisher]
  const csv = serializeCSV(PUBLISHERS_HEADERS, updated.map(publisherToRow))
  await putFile(PUBLISHERS_PATH, csv, sha, `${isEdit ? 'Modifier' : 'Ajouter'} éditeur "${publisher.id}"`)
}

export async function deletePublisher(publisherId: string, allPublishers: Publisher[]): Promise<void> {
  const { sha } = await getFile(PUBLISHERS_PATH)
  const updated = allPublishers.filter(p => p.id !== publisherId)
  const csv = serializeCSV(PUBLISHERS_HEADERS, updated.map(publisherToRow))
  await putFile(PUBLISHERS_PATH, csv, sha, `Supprimer éditeur "${publisherId}"`)
}
