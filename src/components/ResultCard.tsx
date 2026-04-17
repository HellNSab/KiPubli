import { useState } from 'react'
import type { BookMetadata } from '../lib/googleBooks'
import type { OwnershipChain } from '../data/types'
import { ReportModal } from './ReportModal'

type Props = {
  book: BookMetadata
  chain: OwnershipChain | null
}

const CHAIN_DOTS = [
  { color: '#818CF8', weight: 'font-normal' },
  { color: '#4F46E5', weight: 'font-medium' },
  { color: '#3730A3', weight: 'font-semibold' },
]

export function ResultCard({ book, chain }: Props) {
  const [reporting, setReporting] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-[#E5E5E3] bg-white p-4 dark:border-[#2A2A28] dark:bg-dark-card">
        {/* Book */}
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle">
          {book.isbn}
        </p>
        <h2 className="mt-1 text-[17px] font-semibold leading-snug text-ink dark:text-white">
          {book.title}
        </h2>
        {book.authors.length > 0 && (
          <p className="mt-0.5 text-sm text-muted">{book.authors.join(', ')}</p>
        )}

        {chain ? (
          <>
            {/* Chain */}
            <ol className="mt-4 flex flex-col gap-2">
              {[
                chain.publisher.name,
                chain.group.name,
                chain.group.owner,
              ].map((value, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: CHAIN_DOTS[i].color }}
                  />
                  <span className={`text-sm text-ink dark:text-white ${CHAIN_DOTS[i].weight}`}>
                    {value}
                  </span>
                </li>
              ))}
            </ol>

            {/* Badge */}
            <div className="mt-4">
              {chain.group.listed ? (
                <span className="inline-block rounded-lg bg-[#FEE2E2] px-3 py-1.5 text-sm font-medium text-[#991B1B]">
                  Coté en bourse
                </span>
              ) : (
                <span className="inline-block rounded-lg bg-accent-tint px-3 py-1.5 text-sm font-medium text-[#4338CA] dark:bg-indigo-950/50 dark:text-accent-light">
                  Groupe indépendant
                </span>
              )}
            </div>

            {/* Note */}
            {chain.group.note && (
              <p className="mt-3 text-sm leading-relaxed text-muted dark:text-subtle">
                {chain.group.note}
              </p>
            )}

            {chain.group.wikipedia_url && (
              <a
                href={chain.group.wikipedia_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-accent hover:underline dark:text-accent-light"
              >
                En savoir plus →
              </a>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-xl bg-amber-50 px-3 py-3 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
              Éditeur non identifié
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
              {book.publisherRaw
                ? <>Google Books indique <em>« {book.publisherRaw} »</em> mais cet éditeur ne figure pas encore dans notre base.</>
                : <>Aucune information d'éditeur n'a été trouvée pour ce livre.</>
              }
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setReporting(true)}
        className="self-start text-xs text-subtle underline-offset-2 hover:underline hover:text-muted"
      >
        Signaler une erreur
      </button>

      {reporting && (
        <ReportModal book={book} chain={chain} onClose={() => setReporting(false)} />
      )}
    </div>
  )
}
