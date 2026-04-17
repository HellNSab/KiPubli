import { useState } from 'react'
import type { BookMetadata } from '../lib/googleBooks'
import type { OwnershipChain } from '../data/types'
import { ReportModal } from './ReportModal'

type Props = {
  book: BookMetadata
  chain: OwnershipChain | null
}

const CHAIN_ITEMS = [
  { label: 'Éditeur',       dot: '#818CF8' },
  { label: 'Groupe',        dot: '#4F46E5' },
  { label: 'Propriétaire',  dot: '#3730A3' },
]

export function ResultCard({ book, chain }: Props) {
  const [reporting, setReporting] = useState(false)

  const badge = chain
    ? chain.group.listed
      ? { label: 'Coté en bourse', className: 'bg-[#FEE2E2] text-[#991B1B]' }
      : { label: 'Indépendant', className: 'bg-accent-tint text-[#4338CA] dark:bg-indigo-950/60 dark:text-accent-light' }
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Book header */}
      <div className="flex items-start gap-4 rounded-2xl border border-[#E5E5E3] bg-white p-4 dark:border-[#2A2A28] dark:bg-dark-card">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt=""
            className="h-16 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-xl text-white">
            ?
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-snug text-ink dark:text-white">
            {book.title}
          </h2>
          {book.authors.length > 0 && (
            <p className="mt-0.5 text-sm text-muted">{book.authors.join(', ')}</p>
          )}
          {badge && (
            <span className={`mt-2 inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
      </div>

      {chain ? (
        <>
          {/* Chain */}
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-subtle">
              Chaîne de propriété
            </p>
            <div className="overflow-hidden rounded-2xl border border-[#E5E5E3] bg-white dark:border-[#2A2A28] dark:bg-dark-card">
              {[chain.publisher.name, chain.group.name, chain.group.owner].map((value, i) => (
                <div key={i}>
                  {i > 0 && <div className="mx-4 border-t border-[#E5E5E3] dark:border-[#2A2A28]" />}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className="mt-0.5 h-2 w-2 shrink-0 self-start rounded-full"
                      style={{ backgroundColor: CHAIN_ITEMS[i].dot }}
                    />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-subtle">
                        {CHAIN_ITEMS[i].label}
                      </p>
                      <p className="mt-0.5 font-semibold text-ink dark:text-white">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {chain.group.note && (
            <div className="rounded-2xl bg-accent-tint px-4 py-3.5 dark:bg-indigo-950/50">
              <p className="text-sm font-medium leading-relaxed text-[#3730A3] dark:text-accent-light">
                {chain.group.note}
              </p>
              {chain.group.wikipedia_url && (
                <a
                  href={chain.group.wikipedia_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-sm text-accent underline-offset-2 hover:underline dark:text-accent-light"
                >
                  En savoir plus →
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-amber-50 px-4 py-4 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Éditeur non identifié</p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
            {book.publisherRaw
              ? <>Google Books indique <em>« {book.publisherRaw} »</em> mais cet éditeur ne figure pas encore dans notre base.</>
              : <>Aucune information d'éditeur n'a été trouvée pour ce livre.</>
            }
          </p>
        </div>
      )}

      {/* Report button */}
      <button
        type="button"
        onClick={() => setReporting(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-[#E5E5E3] bg-white px-4 py-3.5 text-left text-sm text-muted transition-colors hover:bg-stone-50 dark:border-[#2A2A28] dark:bg-dark-card dark:text-subtle dark:hover:bg-[#242422]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M3 2v12M3 2h8l-2 3.5L11 9H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Signaler une erreur sur ce résultat
      </button>

      {reporting && (
        <ReportModal book={book} chain={chain} onClose={() => setReporting(false)} />
      )}
    </div>
  )
}
