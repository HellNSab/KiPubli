import { useState } from 'react'
import { Scanner } from './components/Scanner'
import { ResultCard } from './components/ResultCard'
import { fetchBookByIsbn, type BookMetadata } from './lib/googleBooks'
import { matchPublisher } from './lib/matchPublisher'
import { getOwnershipChain } from './data/repository'
import type { OwnershipChain } from './data/types'

type View =
  | { kind: 'home' }
  | { kind: 'scanning' }
  | { kind: 'loading'; isbn: string }
  | { kind: 'error'; message: string }
  | { kind: 'result'; book: BookMetadata; chain: OwnershipChain | null }

function App() {
  const [view, setView] = useState<View>({ kind: 'home' })

  async function handleIsbn(isbn: string) {
    setView({ kind: 'loading', isbn })
    try {
      const book = await fetchBookByIsbn(isbn)
      if (!book) {
        setView({
          kind: 'error',
          message: "Aucun livre trouvé pour cet ISBN. Vérifiez le code et réessayez.",
        })
        return
      }
      const publisher = book.publisherRaw ? await matchPublisher(book.publisherRaw) : null
      const chain = publisher ? await getOwnershipChain(publisher) : null
      setView({ kind: 'result', book, chain })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setView({ kind: 'error', message: `Échec de la recherche : ${message}` })
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 py-8">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Qui publie ce livre ?
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Scannez l'ISBN d'un livre pour voir à qui appartient l'éditeur.
        </p>
      </header>

      <main className="flex-1">
        {view.kind === 'home' && (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setView({ kind: 'scanning' })}
              className="rounded-xl bg-accent px-5 py-4 text-lg font-medium text-white shadow-sm hover:bg-orange-700"
            >
              Scanner un livre
            </button>
            <p className="text-xs text-stone-500">
              La caméra de votre appareil sera utilisée uniquement pour lire le code-barres.
              Aucune image n'est conservée.
            </p>
          </div>
        )}

        {view.kind === 'scanning' && (
          <Scanner
            onDetected={handleIsbn}
            onCancel={() => setView({ kind: 'home' })}
          />
        )}

        {view.kind === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-12 text-stone-600">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-accent" />
            <p className="text-sm">Recherche du livre {view.isbn}…</p>
          </div>
        )}

        {view.kind === 'error' && (
          <div className="flex flex-col gap-4">
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              {view.message}
            </p>
            <button
              type="button"
              onClick={() => setView({ kind: 'home' })}
              className="self-start rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Réessayer
            </button>
          </div>
        )}

        {view.kind === 'result' && (
          <ResultCard
            book={view.book}
            chain={view.chain}
            onReset={() => setView({ kind: 'home' })}
          />
        )}
      </main>

      <footer className="mt-10 text-xs text-stone-400">
        Données éditoriales saisies à la main · Métadonnées via Google Books
      </footer>
    </div>
  )
}

export default App
