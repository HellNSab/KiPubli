import { useState } from 'react'
import { Scanner } from './components/Scanner'
import { ResultCard } from './components/ResultCard'
import { InstallPrompt } from './components/InstallPrompt'
import { fetchBookByIsbn, type BookMetadata } from './lib/googleBooks'
import { matchPublisher } from './lib/matchPublisher'
import { getOwnershipChain } from './data/repository'
import type { OwnershipChain } from './data/types'

type View = 'home' | 'result'

type Status =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'error'; message: string }

type LastResult = {
  book: BookMetadata
  chain: OwnershipChain | null
}

function App() {
  const [view, setView] = useState<View>('home')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [lastResult, setLastResult] = useState<LastResult | null>(null)

  async function handleIsbn(isbn: string) {
    setStatus({ kind: 'processing' })
    try {
      const book = await fetchBookByIsbn(isbn)
      if (!book) {
        setStatus({ kind: 'error', message: "Aucun livre trouvé pour cet ISBN. Vérifiez le code et réessayez." })
        return
      }
      const publisher = book.publisherRaw ? await matchPublisher(book.publisherRaw) : null
      const chain = publisher ? await getOwnershipChain(publisher) : null
      setLastResult({ book, chain })
      setStatus({ kind: 'idle' })
      setView('result')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setStatus({ kind: 'error', message: `Échec de la recherche : ${message}` })
    }
  }

  if (view === 'result' && lastResult) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-6">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => setView('home')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink dark:text-subtle dark:hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Scanner un autre livre
        </button>

        <main className="flex flex-1 flex-col gap-4">
          <ResultCard book={lastResult.book} chain={lastResult.chain} />
        </main>

        <footer className="mt-8 text-center text-[11px] text-subtle">
          Données mises à jour bénévolement, susceptibles d'être incomplètes · Métadonnées via Google Books
        </footer>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        {/* App icon */}
        <svg width="36" height="36" viewBox="0 0 80 80" className="shrink-0 rounded-xl">
          <rect width="80" height="80" rx="20" fill="#4F46E5"/>
          <text x="29" y="50" textAnchor="middle" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="white">?</text>
          <rect x="42" y="24" width="22" height="5" rx="2.5" fill="white"/>
          <rect x="42" y="34" width="15" height="5" rx="2.5" fill="white" opacity="0.6"/>
          <rect x="42" y="44" width="9" height="5" rx="2.5" fill="white" opacity="0.3"/>
          <circle cx="62" cy="60" r="6" fill="white"/>
          <circle cx="62" cy="60" r="3" fill="#4F46E5"/>
        </svg>
        <div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-ink dark:text-white">
            À qui ?
          </h1>
          <p className="text-xs text-muted dark:text-subtle">Transparence éditoriale</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5">
        <Scanner onDetected={handleIsbn} processing={status.kind === 'processing'} />

        {status.kind === 'error' && (
          <div className="flex items-start justify-between rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
            <p className="text-sm text-red-800 dark:text-red-300">{status.message}</p>
            <button
              type="button"
              onClick={() => setStatus({ kind: 'idle' })}
              aria-label="Fermer"
              className="ml-3 shrink-0 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {lastResult && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-[#E5E5E3] dark:border-[#2A2A28]" />
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle">
                Dernier résultat
              </p>
              <hr className="flex-1 border-[#E5E5E3] dark:border-[#2A2A28]" />
            </div>

            {/* Compact teaser — taps to result view */}
            <button
              type="button"
              onClick={() => setView('result')}
              className="flex w-full items-center justify-between rounded-xl border border-[#E5E5E3] bg-white px-4 py-3.5 text-left transition-colors hover:bg-stone-50 dark:border-[#2A2A28] dark:bg-dark-card dark:hover:bg-[#242422]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink dark:text-white">
                  {lastResult.book.title}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {[
                    lastResult.book.authors[0],
                    lastResult.chain?.publisher.name ?? lastResult.book.publisherRaw,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-3 shrink-0 text-subtle">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </section>
        )}
      </main>

      <InstallPrompt />

      <footer className="mt-8 text-center text-[11px] text-subtle">
        Données mises à jour bénévolement, susceptibles d'être incomplètes · Métadonnées via Google Books
      </footer>
    </div>
  )
}

export default App
