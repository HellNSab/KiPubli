import { useEffect, useState } from 'react'
import { Scanner } from './components/Scanner'
import { ResultCard } from './components/ResultCard'
import { InstallPrompt } from './components/InstallPrompt'
import { HomeChart } from './components/HomeChart'
import { ChainExplainer } from './components/ChainExplainer'
import { AdminPage } from './pages/AdminPage'
import { fetchBookByIsbn, type BookMetadata } from './lib/googleBooks'
import { matchPublisher } from './lib/matchPublisher'
import { getOwnershipChain } from './data/repository'
import type { OwnershipChain } from './data/types'

type View = 'home' | 'learn' | 'result'

type Status =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'error'; message: string }

type ScanResult = {
  book: BookMetadata
  chain: OwnershipChain | null
}

const MAX_RECENTS = 5
const STORAGE_KEY = 'kipubli-recents'

function loadRecents(): ScanResult[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecents(results: ScanResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  } catch { /* ignore quota errors */ }
}

function App() {
  const [page, setPage] = useState<'app' | 'admin'>(() =>
    window.location.hash === '#admin' ? 'admin' : 'app'
  )
  const [view, setView] = useState<View>('home')
  const [showScanner, setShowScanner] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [recentResults, setRecentResults] = useState<ScanResult[]>(loadRecents)
  const [viewedResult, setViewedResult] = useState<ScanResult | null>(null)

  useEffect(() => {
    const onHashChange = () => setPage(window.location.hash === '#admin' ? 'admin' : 'app')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (page === 'admin') {
    return (
      <AdminPage
        onNavigateToApp={() => { window.location.hash = ''; setPage('app') }}
      />
    )
  }

  function addToRecents(result: ScanResult) {
    setRecentResults(prev => {
      const deduped = prev.filter(r => r.book.isbn !== result.book.isbn)
      const updated = [result, ...deduped].slice(0, MAX_RECENTS)
      saveRecents(updated)
      return updated
    })
  }

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
      const result: ScanResult = { book, chain }
      addToRecents(result)
      setViewedResult(result)
      setStatus({ kind: 'idle' })
      setShowScanner(false)
      setView('result')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setStatus({ kind: 'error', message: `Échec de la recherche : ${message}` })
    }
  }

  function openResult(result: ScanResult) {
    setViewedResult(result)
    setView('result')
  }

  // ── Result view ──────────────────────────────────────────────
  if (view === 'result' && viewedResult) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-6">
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
          <ResultCard book={viewedResult.book} chain={viewedResult.chain} />
        </main>

        <footer className="mt-8 text-center text-[11px] text-subtle">
          Données mises à jour bénévolement, susceptibles d'être incomplètes · Métadonnées via Google Books
        </footer>
      </div>
    )
  }

  // ── Learn view ───────────────────────────────────────────────
  if (view === 'learn') {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-6 animate-fade-in">
        <header className="mb-5 flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 80 80" className="shrink-0 rounded-xl">
            <rect width="80" height="80" rx="20" fill="#4F46E5"/>
            <text x="29" y="50" textAnchor="middle" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="white">?</text>
            <rect x="42" y="24" width="22" height="5" rx="2.5" fill="white"/>
            <rect x="42" y="34" width="15" height="5" rx="2.5" fill="white" opacity="0.6"/>
            <rect x="42" y="44" width="9" height="5" rx="2.5" fill="white" opacity="0.3"/>
            <circle cx="62" cy="60" r="6" fill="white"/>
            <circle cx="62" cy="60" r="3" fill="#4F46E5"/>
          </svg>
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-ink dark:text-white">
            À qui ?
          </h1>
        </header>

        <main className="flex flex-1 flex-col">
          <ChainExplainer
            onScan={() => { setView('home'); setShowScanner(true) }}
            onSkip={() => setView('home')}
          />
        </main>
      </div>
    )
  }

  // ── Home view ────────────────────────────────────────────────
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-6">
      <header className="mb-5 flex items-center gap-3">
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
          <p className="text-xs text-muted dark:text-subtle">
            {showScanner ? 'Scannez un code-barres ISBN' : 'Où va l\'argent d\'un livre à 20 €'}
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5">
        <div className="panel-swap-grid">
          {/* Chart panel — slides up and out when scanner opens */}
          <div className={showScanner ? 'panel-out-up' : 'panel-in'}>
            <HomeChart />
          </div>

          {/* Scanner panel — slides up from below when scanner opens */}
          <div className={showScanner ? 'panel-in' : 'panel-out-down'}>
            <Scanner
              onDetected={handleIsbn}
              processing={status.kind === 'processing'}
              active={showScanner}
              onCancel={() => { setShowScanner(false); setStatus({ kind: 'idle' }) }}
            />

            {status.kind === 'error' && (
              <div className="mt-4 flex items-start justify-between rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
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
          </div>
        </div>

        {!showScanner && (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#E5E5E3] bg-transparent py-4 text-base font-semibold text-ink transition-colors hover:bg-stone-50 dark:border-white dark:text-white dark:hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="4" height="18" rx="1"/>
                <rect x="9" y="3" width="2" height="18" rx="0.5"/>
                <rect x="13" y="3" width="3" height="18" rx="0.5"/>
                <rect x="18" y="3" width="3" height="18" rx="1"/>
              </svg>
              Scanner un livre
            </button>

            <button
              type="button"
              onClick={() => setView('learn')}
              className="text-sm font-medium text-accent hover:underline"
            >
              En savoir plus sur la chaîne du livre →
            </button>
          </div>
        )}

        {!showScanner && recentResults.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-[#E5E5E3] dark:border-[#2A2A28]" />
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle">
                Recherches récentes
              </p>
              <hr className="flex-1 border-[#E5E5E3] dark:border-[#2A2A28]" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E5E5E3] dark:border-[#2A2A28]">
              {recentResults.map((result, i) => {
                const badge = result.chain
                  ? result.chain.group.listed
                    ? { label: 'Coté en bourse', className: 'bg-[#FEE2E2] text-[#991B1B] dark:bg-red-950/40 dark:text-red-300' }
                    : { label: 'Indépendant', className: 'bg-accent-tint text-[#4338CA] dark:bg-indigo-950/60 dark:text-accent-light' }
                  : null

                return (
                  <div key={result.book.isbn}>
                    {i > 0 && <div className="border-t border-[#E5E5E3] dark:border-[#2A2A28]" />}
                    <button
                      type="button"
                      onClick={() => openResult(result)}
                      className="flex w-full items-center gap-3 bg-white px-4 py-3.5 text-left transition-colors hover:bg-stone-50 dark:bg-dark-card dark:hover:bg-[#242422]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink dark:text-white">
                          {result.book.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="truncate text-sm text-muted">
                            {[
                              result.book.authors[0],
                              result.chain?.publisher.name ?? result.book.publisherRaw,
                            ].filter(Boolean).join(' · ')}
                          </p>
                          {badge && (
                            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-subtle">
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
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
