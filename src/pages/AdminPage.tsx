import { useEffect, useRef, useState } from 'react'
import { getAllGroups, getAllPublishers } from '../data/repository'
import { saveGroup, savePublisher, hasToken } from '../lib/githubCsv'
import type { Group, Publisher } from '../data/types'

// ── Admin lock screen ─────────────────────────────────────────

const SESSION_KEY = 'kipubli-admin-auth'

function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

function AdminLock({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const expected = import.meta.env.VITE_ADMIN_PASSWORD
    if (!expected || password === expected) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true)
      setPassword('')
      setTimeout(() => setError(false), 1200)
    }
  }

  // 3 dots fill as you type
  const dots = [1, 2, 3].map(n => password.length >= n)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2F0] px-4 dark:bg-[#0F0F0E]">
      <div className={`w-full max-w-sm rounded-3xl bg-white px-8 py-10 shadow-xl transition-transform dark:bg-[#1C1C1A] ${error ? 'animate-shake' : ''}`}>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <svg width="72" height="72" viewBox="0 0 80 80" className="rounded-2xl">
            <rect width="80" height="80" rx="20" fill="#4F46E5"/>
            <text x="29" y="50" textAnchor="middle" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="white">?</text>
            <rect x="42" y="24" width="22" height="5" rx="2.5" fill="white"/>
            <rect x="42" y="34" width="15" height="5" rx="2.5" fill="white" opacity="0.6"/>
            <rect x="42" y="44" width="9" height="5" rx="2.5" fill="white" opacity="0.3"/>
            <circle cx="62" cy="60" r="6" fill="white"/>
            <circle cx="62" cy="60" r="3" fill="#4F46E5"/>
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-bold tracking-tight text-ink dark:text-white">
          Accès administrateur
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted dark:text-subtle">
          Entrez votre mot de passe pour accéder à la base de données éditoriale.
        </p>

        {/* Dots */}
        <div className="my-6 flex justify-center gap-2.5">
          {dots.map((filled, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-150 ${
                filled
                  ? error
                    ? 'bg-red-500'
                    : 'bg-accent'
                  : 'bg-[#DDDDD9] dark:bg-[#2A2A28]'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Password input */}
          <div className="flex overflow-hidden rounded-2xl bg-[#1C1C1A] dark:bg-[#111110]">
            <input
              ref={inputRef}
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 bg-transparent px-5 py-4 text-base text-white placeholder:text-gray-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              className="px-4 text-gray-500 transition-colors hover:text-white"
              aria-label={visible ? 'Masquer' : 'Afficher'}
            >
              {visible ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-2xl border border-[#DDDDD9] py-4 text-base font-medium text-ink transition-colors hover:bg-stone-100 dark:border-[#2A2A28] dark:text-white dark:hover:bg-[#242422]"
          >
            {error ? 'Mot de passe incorrect' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  )
}

const GROUP_COLORS: Record<string, string> = {
  lagardere: '#EF4444',
  editis: '#F97316',
  madrigall: '#A855F7',
  'media-participations': '#0EA5E9',
  'actes-sud': '#10B981',
  'albin-michel': '#06B6D4',
  humensis: '#94A3B8',
}

function groupColor(id: string) {
  return GROUP_COLORS[id] ?? '#9CA3AF'
}

// ── Shared modal shell ────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        ref={ref}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-[#1C1C1A] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Field helpers ─────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-400">
        {label}
        {hint && <span className="ml-1.5 font-normal text-gray-600">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'rounded-lg border border-white/10 bg-[#111110] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

const Chevron = () => (
  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function SelectWrap({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <div className="relative">
      <select className={`w-full appearance-none ${className ?? ''}`} {...props}>
        {children}
      </select>
      <Chevron />
    </div>
  )
}

// ── Group form ────────────────────────────────────────────────

function GroupForm({ groups, onSaved, onClose }: { groups: Group[]; onSaved: () => void; onClose: () => void }) {
  const empty: Group = { id: '', name: '', owner: '', listed: false, note: '', wikipedia_url: '' }
  const [form, setForm] = useState<Group>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof Group, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await saveGroup(form, groups)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setSaving(false)
    }
  }

  return (
    <Modal title="Ajouter un groupe" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ID" hint="(slug, ex: lagardere)">
            <input required className={inputCls} value={form.id} onChange={e => set('id', e.target.value)} placeholder="lagardere" />
          </Field>
          <Field label="Nom">
            <input required className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Lagardère" />
          </Field>
        </div>
        <Field label="Propriétaire">
          <input required className={inputCls} value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Famille Arnault / LVMH" />
        </Field>
        <Field label="Note éditoriale">
          <textarea required rows={2} className={inputCls} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Brève description affichée à l'utilisateur…" />
        </Field>
        <Field label="Wikipedia" hint="(optionnel)">
          <input className={inputCls} value={form.wikipedia_url ?? ''} onChange={e => set('wikipedia_url', e.target.value)} placeholder="https://fr.wikipedia.org/wiki/…" />
        </Field>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="group-listed"
            checked={form.listed}
            onChange={e => set('listed', e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-[#111110] accent-indigo-500"
          />
          <label htmlFor="group-listed" className="text-sm text-gray-300">Coté en bourse</label>
        </div>

        {error && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-white">Annuler</button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Publisher form ────────────────────────────────────────────

function PublisherForm({ groups, publishers, onSaved, onClose }: { groups: Group[]; publishers: Publisher[]; onSaved: () => void; onClose: () => void }) {
  const empty: Publisher & { name_variants_raw: string } = {
    id: '', name: '', name_variants: [], name_variants_raw: '', country: 'FR', group_id: groups[0]?.id ?? '',
  }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const publisher: Publisher = {
      id: form.id,
      name: form.name,
      name_variants: form.name_variants_raw.split('|').map(s => s.trim()).filter(Boolean),
      country: form.country,
      founded_year: form.founded_year ? Number(form.founded_year) : undefined,
      group_id: form.group_id,
    }
    try {
      await savePublisher(publisher, publishers)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setSaving(false)
    }
  }

  return (
    <Modal title="Ajouter un éditeur" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ID" hint="(slug, ex: seuil)">
            <input required className={inputCls} value={form.id} onChange={e => set('id', e.target.value)} placeholder="seuil" />
          </Field>
          <Field label="Nom canonique">
            <input required className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Le Seuil" />
          </Field>
        </div>
        <Field label="Variantes" hint="(séparées par |)">
          <input className={inputCls} value={form.name_variants_raw} onChange={e => set('name_variants_raw', e.target.value)} placeholder="Editions du Seuil|Éditions du Seuil" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pays">
            <input required className={inputCls} value={form.country} onChange={e => set('country', e.target.value)} placeholder="FR" />
          </Field>
          <Field label="Année de fondation" hint="(optionnel)">
            <input type="number" className={inputCls} value={form.founded_year ?? ''} onChange={e => set('founded_year', e.target.value)} placeholder="1935" />
          </Field>
        </div>
        <Field label="Groupe">
          <SelectWrap required className={inputCls} value={form.group_id} onChange={e => set('group_id', e.target.value)}>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </SelectWrap>
        </Field>

        {error && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-white">Annuler</button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────

type Tab = 'données' | 'signalements'
type AddModal = 'group' | 'publisher' | null

interface Props {
  onNavigateToApp: () => void
}

export function AdminPage({ onNavigateToApp }: Props) {
  const [authed, setAuthed] = useState(isAuthenticated)
  const [groups, setGroups] = useState<Group[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('données')
  const [groupsExpanded, setGroupsExpanded] = useState(false)
  const [addModal, setAddModal] = useState<AddModal>(null)
  const [groupSearch, setGroupSearch] = useState('')
  const [publisherSearch, setPublisherSearch] = useState('')
  const [publisherGroupFilter, setPublisherGroupFilter] = useState('')

  const tokenAvailable = hasToken()

  function loadData() {
    return Promise.all([getAllGroups(), getAllPublishers()]).then(([g, p]) => {
      setGroups(g)
      setPublishers(p)
      setLoading(false)
    })
  }

  useEffect(() => { if (authed) loadData() }, [authed])

  if (!authed) return <AdminLock onUnlock={() => setAuthed(true)} />

  const countries = [...new Set(publishers.map(p => p.country))].length
  const GROUPS_DEFAULT = 4
  const filteredGroups = groups.filter(g => g.id.toLowerCase().includes(groupSearch.trim().toLowerCase()))
  const filteredPublishers = publishers.filter(p =>
    p.id.toLowerCase().includes(publisherSearch.trim().toLowerCase()) &&
    (publisherGroupFilter === '' || p.group_id === publisherGroupFilter)
  )
  const displayedGroups = groupSearch.trim()
    ? filteredGroups
    : groupsExpanded ? filteredGroups : filteredGroups.slice(0, GROUPS_DEFAULT)

  return (
    <div className="min-h-screen bg-[#111110] text-white">
      {/* Mobile gate */}
      <div className="flex min-h-screen items-center justify-center md:hidden">
        <p className="px-8 text-center text-sm text-gray-400">
          La page Admin est disponible sur ordinateur uniquement.
        </p>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex md:flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-8 py-4">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 80 80" className="shrink-0 rounded-xl">
              <rect width="80" height="80" rx="20" fill="#4F46E5"/>
              <text x="27" y="48" textAnchor="middle" fontFamily="Georgia, serif" fontSize="38" fontWeight="700" fill="white">?</text>
              <rect x="40" y="23" width="20" height="5" rx="2.5" fill="white"/>
              <rect x="40" y="33" width="14" height="5" rx="2.5" fill="white" opacity="0.6"/>
              <rect x="40" y="43" width="8" height="5" rx="2.5" fill="white" opacity="0.3"/>
              <circle cx="57" cy="57" r="6" fill="white"/>
              <circle cx="57" cy="57" r="3" fill="#4F46E5"/>
            </svg>
            <div>
              <h1 className="text-base font-semibold leading-tight">À qui ? — Admin</h1>
              <p className="text-xs text-gray-400">Base de données éditoriale</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={onNavigateToApp}
              className="rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-white"
            >
              App
            </button>
            {(['données', 'signalements'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
                  tab === t
                    ? 'bg-white font-medium text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>
        </header>

        <main className="px-8 py-6">
          {loading ? (
            <p className="text-sm text-gray-400">Chargement…</p>
          ) : tab === 'données' ? (
            <div className="flex flex-col gap-6">
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <span>
                  <strong className="text-white">{groups.length}</strong>{' '}
                  <span className="text-gray-400">groupes</span>
                </span>
                <span>
                  <strong className="text-white">{publishers.length}</strong>{' '}
                  <span className="text-gray-400">éditeurs</span>
                </span>
                <span>
                  <strong className="text-white">{countries}</strong>{' '}
                  <span className="text-gray-400">pays</span>
                </span>
                {!tokenAvailable && (
                  <span className="ml-auto rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-1 text-xs text-amber-400">
                    VITE_GITHUB_TOKEN manquant — lecture seule
                  </span>
                )}
              </div>

              {/* Groups */}
              <section className="overflow-hidden rounded-xl border border-white/10">
                <div className="flex items-center gap-3 bg-white/5 px-5 py-4">
                  <h2 className="shrink-0 text-sm font-semibold">
                    Groupes{' '}
                    <span className="ml-1.5 font-normal text-gray-400">{filteredGroups.length}</span>
                  </h2>
                  <div className="ml-auto">
                    <input
                      type="search"
                      placeholder="Filtrer par ID…"
                      value={groupSearch}
                      onChange={e => setGroupSearch(e.target.value)}
                      className="w-60 rounded-lg border border-white/10 bg-[#111110] px-3 py-1.5 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <button
                    disabled={!tokenAvailable}
                    onClick={() => setAddModal('group')}
                    className="shrink-0 rounded-lg border border-white/20 px-3 py-1.5 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Ajouter
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-white/10">
                      <th className="w-36 px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">ID</th>
                      <th className="w-44 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Nom</th>
                      <th className="w-44 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Propriétaire</th>
                      <th className="w-24 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Coté</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedGroups.map((g, i) => (
                      <tr
                        key={g.id}
                        className={`transition-colors hover:bg-white/5 ${
                          i < displayedGroups.length - 1 ? 'border-b border-white/5' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{g.id}</td>
                        <td className="px-4 py-3.5 font-semibold">{g.name}</td>
                        <td className="px-4 py-3.5 text-gray-300">{g.owner}</td>
                        <td className="px-4 py-3.5">
                          {g.listed ? (
                            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                              Coté
                            </span>
                          ) : (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-gray-300">
                              Indép.
                            </span>
                          )}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3.5 text-xs text-gray-400">
                          {g.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!groupSearch.trim() && filteredGroups.length > GROUPS_DEFAULT && (
                  <button
                    onClick={() => setGroupsExpanded(v => !v)}
                    className="w-full border-t border-white/10 py-3 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {groupsExpanded ? 'Réduire' : `Tout afficher (${groups.length})`}
                  </button>
                )}
              </section>

              {/* Publishers */}
              <section className="overflow-hidden rounded-xl border border-white/10">
                <div className="flex items-center gap-3 bg-white/5 px-5 py-4">
                  <h2 className="shrink-0 text-sm font-semibold">
                    Éditeurs{' '}
                    <span className="ml-1.5 font-normal text-gray-400">{filteredPublishers.length}</span>
                  </h2>
                  <div className="ml-auto flex items-center gap-2">
                    <SelectWrap
                      value={publisherGroupFilter}
                      onChange={e => setPublisherGroupFilter(e.target.value)}
                      className="w-60 rounded-lg border border-white/10 bg-[#111110] px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Tous les groupes</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </SelectWrap>
                    <input
                      type="search"
                      placeholder="Filtrer par ID…"
                      value={publisherSearch}
                      onChange={e => setPublisherSearch(e.target.value)}
                      className="w-60 rounded-lg border border-white/10 bg-[#111110] px-3 py-1.5 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <button
                    disabled={!tokenAvailable}
                    onClick={() => setAddModal('publisher')}
                    className="shrink-0 rounded-lg border border-white/20 px-3 py-1.5 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Ajouter
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-white/10">
                      <th className="w-28 px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">ID</th>
                      <th className="w-36 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Nom</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Variantes</th>
                      <th className="w-16 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Pays</th>
                      <th className="w-20 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Fondé</th>
                      <th className="w-44 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Groupe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPublishers.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-white/5 ${
                          i < filteredPublishers.length - 1 ? 'border-b border-white/5' : ''
                        }`}
                      >
                        <td className="px-5 py-3 font-mono text-xs text-gray-400">{p.id}</td>
                        <td className="px-4 py-3 font-semibold">{p.name}</td>
                        <td className="max-w-[260px] truncate px-4 py-3 text-xs text-gray-400">
                          {p.name_variants.join('|')}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{p.country}</td>
                        <td className="px-4 py-3 text-gray-400">{p.founded_year ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-xs font-medium"
                            style={{ color: groupColor(p.group_id) }}
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: groupColor(p.group_id) }}
                            />
                            {p.group_id}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-400">Signalements — bientôt disponible</p>
            </div>
          )}
        </main>
      </div>

      {addModal === 'group' && (
        <GroupForm
          groups={groups}
          onSaved={loadData}
          onClose={() => setAddModal(null)}
        />
      )}
      {addModal === 'publisher' && (
        <PublisherForm
          groups={groups}
          publishers={publishers}
          onSaved={loadData}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  )
}
