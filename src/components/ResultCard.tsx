import { useState } from 'react'
import type { BookMetadata } from '../lib/googleBooks'
import type { OwnershipChain } from '../data/types'
import { ReportModal } from './ReportModal'

type Props = {
  book: BookMetadata
  chain: OwnershipChain | null
  onReset: () => void
}

export function ResultCard({ book, chain, onReset }: Props) {
  const [reporting, setReporting] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex gap-4">
          {book.thumbnail && (
            <img
              src={book.thumbnail}
              alt=""
              className="h-28 w-auto rounded-md border border-stone-200 object-cover"
            />
          )}
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-xl leading-tight text-ink">{book.title}</h2>
            {book.authors.length > 0 && (
              <p className="text-sm text-stone-600">{book.authors.join(', ')}</p>
            )}
            <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
              ISBN {book.isbn}
            </p>
          </div>
        </div>
      </article>

      {chain ? (
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Chaîne de propriété
          </h3>

          <ol className="mt-4 flex flex-col gap-3">
            <ChainStep label="Éditeur" value={chain.publisher.name} />
            <ChainStep label="Groupe" value={chain.group.name} />
            <ChainStep label="Propriétaire ultime" value={chain.group.owner} highlight />
          </ol>

          <p className="mt-5 border-t border-stone-100 pt-4 font-serif text-[15px] leading-relaxed text-stone-700">
            {chain.group.note}
          </p>

          {chain.group.wikipedia_url && (
            <a
              href={chain.group.wikipedia_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-accent hover:underline"
            >
              En savoir plus sur Wikipédia →
            </a>
          )}

          <p className="mt-4 text-xs text-stone-400">
            Données mises à jour bénévolement, susceptibles d'être incomplètes ou imprécises.
          </p>
        </article>
      ) : (
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-900">Éditeur non identifié</h3>
          <p className="mt-2 text-sm text-amber-900">
            {book.publisherRaw ? (
              <>
                Google Books indique <em>« {book.publisherRaw} »</em>, mais cet éditeur ne
                figure pas encore dans notre base, qui est mise à jour bénévolement.
              </>
            ) : (
              <>Aucune information d'éditeur n'a été trouvée pour ce livre.</>
            )}
          </p>
        </article>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Scanner un autre livre
        </button>
        <button
          type="button"
          onClick={() => setReporting(true)}
          className="text-sm text-stone-500 underline-offset-2 hover:underline"
        >
          Signaler une erreur
        </button>
      </div>

      {reporting && (
        <ReportModal book={book} chain={chain} onClose={() => setReporting(false)} />
      )}
    </div>
  )
}

function ChainStep({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="w-32 shrink-0 text-xs uppercase tracking-wider text-stone-500">
        {label}
      </span>
      <span
        className={
          highlight
            ? 'font-serif text-lg font-semibold text-accent'
            : 'font-serif text-base text-ink'
        }
      >
        {value}
      </span>
    </li>
  )
}
