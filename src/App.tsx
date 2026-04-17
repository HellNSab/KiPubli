import { useState } from 'react'
import { Scanner } from './components/Scanner'
import { ResultCard } from './components/ResultCard'
import { InstallPrompt } from './components/InstallPrompt'
import { fetchBookByIsbn, type BookMetadata } from './lib/googleBooks'
import { matchPublisher } from './lib/matchPublisher'
import { getOwnershipChain } from './data/repository'
import type { OwnershipChain } from './data/types'

type Status =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'error'; message: string }

type LastResult = {
  book: BookMetadata
  chain: OwnershipChain | null
}

function App() {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setStatus({ kind: 'error', message: `Échec de la recherche : ${message}` })
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-6">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink dark:text-white">
          À qui ?
        </h1>
        <p className="mt-0.5 text-sm text-muted dark:text-subtle">
          Transparence éditoriale — savoir à qui appartient un livre
        </p>
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
            <ResultCard book={lastResult.book} chain={lastResult.chain} />
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
