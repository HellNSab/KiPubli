import { useEffect, useRef, useState } from 'react'
import type { BookMetadata } from '../lib/googleBooks'
import type { OwnershipChain } from '../data/types'

type Props = {
  book: BookMetadata
  chain: OwnershipChain | null
  onClose: () => void
}

const REPO = 'HellNSab/KiPubli'

function buildIssueBody(book: BookMetadata, chain: OwnershipChain | null, comment: string): string {
  const lines = [
    '## Livre concerné',
    `**Titre :** ${book.title}`,
    `**Auteur(s) :** ${book.authors.join(', ') || 'inconnu'}`,
    `**ISBN :** ${book.isbn}`,
    `**Éditeur brut (Google Books) :** ${book.publisherRaw ?? 'non renseigné'}`,
    '',
    '## Résultat affiché par l\'application',
    chain
      ? [
          `**Éditeur identifié :** ${chain.publisher.name}`,
          `**Groupe :** ${chain.group.name}`,
          `**Propriétaire ultime :** ${chain.group.owner}`,
        ].join('\n')
      : '**Aucun éditeur identifié dans la base.**',
  ]

  if (comment.trim()) {
    lines.push('', '## Commentaire', comment.trim())
  }

  return lines.join('\n')
}

async function createGithubIssue(title: string, body: string): Promise<void> {
  const token = import.meta.env.VITE_GITHUB_TOKEN
  if (!token) throw new Error('TOKEN_MISSING')

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      title,
      body,
      labels: ['données'],
    }),
  })

  if (!res.ok) throw new Error(`github_${res.status}`)
}

export function ReportModal({ book, chain, onClose }: Props) {
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg(null)
    try {
      const title = `Erreur signalée : ${book.title} (ISBN ${book.isbn})`
      const body = buildIssueBody(book, chain, comment)
      await createGithubIssue(title, body)
      setStatus('success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'TOKEN_MISSING') {
        setErrorMsg('Fonctionnalité non configurée. Veuillez contacter l\'administrateur.')
      } else {
        setErrorMsg('Une erreur est survenue. Réessayez dans quelques instants.')
      }
      setStatus('error')
    }
  }

  return (
    // Backdrop — items-end on mobile (bottom sheet), items-center on desktop
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 md:items-center"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-white px-6 pb-10 pt-6 shadow-xl dark:bg-dark-card md:mx-auto md:max-w-lg md:rounded-2xl md:pb-6"
      >
        {/* Handle bar — mobile only */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-stone-200 md:hidden" />

        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-ink dark:text-white">Signaler une erreur</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1 text-stone-400 hover:text-stone-600"
          >
            ✕
          </button>
        </div>

        {status === 'success' ? (
          <div className="mt-6 flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-4xl">✓</p>
            <p className="font-medium text-ink dark:text-white">Merci pour votre signalement !</p>
            <p className="text-sm text-stone-500">
              Nous prendrons en compte votre retour lors de la prochaine mise à jour des données.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-md bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            {/* Pre-filled book info — read-only */}
            <div className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700 dark:bg-[#1C1C1A] dark:text-[#C5C5C0]">
              <p><span className="font-medium">Titre :</span> {book.title}</p>
              <p className="mt-1"><span className="font-medium">ISBN :</span> {book.isbn}</p>
              {book.publisherRaw && (
                <p className="mt-1">
                  <span className="font-medium">Éditeur (Google Books) :</span> {book.publisherRaw}
                </p>
              )}
              {chain ? (
                <p className="mt-1">
                  <span className="font-medium">Identifié comme :</span>{' '}
                  {chain.publisher.name} → {chain.group.name} → {chain.group.owner}
                </p>
              ) : (
                <p className="mt-1 text-amber-700">Non identifié dans la base</p>
              )}
            </div>

            {/* Optional comment */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-comment" className="text-sm font-medium text-ink dark:text-white">
                Commentaire <span className="font-normal text-stone-400 dark:text-subtle">(facultatif)</span>
              </label>
              <textarea
                id="report-comment"
                rows={3}
                placeholder="Ex. : le propriétaire a changé, l'éditeur est mal orthographié…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-[#2A2A28] dark:bg-[#111110] dark:text-white"
              />
            </div>

            {errorMsg && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
            )}

            <div className="flex items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-md bg-accent px-5 transition-colors py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {status === 'loading' ? 'Envoi…' : 'Envoyer le signalement'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-stone-500 underline-offset-2 hover:underline"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
