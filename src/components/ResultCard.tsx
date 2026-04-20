import { useState } from 'react'
import type { BookMetadata } from '../lib/googleBooks'
import type { OwnershipChain } from '../data/types'
import { ReportModal } from './ReportModal'

type Props = {
  book: BookMetadata
  chain: OwnershipChain | null
}

type Tab = 'edition' | 'diffusion' | 'distribution'

// ── Shared sub-components ─────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.08em] text-subtle">
      {children}
    </p>
  )
}

function ChainRow({
  dot,
  label,
  value,
  subtitle,
}: {
  dot: string
  label: string
  value: string
  subtitle?: string
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-subtle">{label}</p>
        <p className="mt-0.5 font-semibold text-ink dark:text-white">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

function ChainCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E5E3] bg-white dark:border-[#2A2A28] dark:bg-dark-card">
      {children}
    </div>
  )
}

function Divider() {
  return <div className="mx-4 border-t border-[#E5E5E3] dark:border-[#2A2A28]" />
}

function NoteBox({ text, url }: { text: string; url?: string }) {
  return (
    <div className="rounded-2xl bg-accent-tint px-4 py-3.5 dark:bg-indigo-950/50">
      <p className="text-sm font-medium leading-relaxed text-[#3730A3] dark:text-accent-light">
        {text}
      </p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block text-sm text-accent underline-offset-2 hover:underline dark:text-accent-light"
        >
          En savoir plus →
        </a>
      )}
    </div>
  )
}

function RoleBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E5E5E3] bg-white px-4 py-3.5 dark:border-[#2A2A28] dark:bg-dark-card">
      <p className="text-sm leading-relaxed text-muted dark:text-subtle">{children}</p>
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 dark:border-amber-800/40 dark:bg-amber-950/30">
      <p className="text-sm font-medium leading-relaxed text-amber-800 dark:text-amber-300">
        {children}
      </p>
    </div>
  )
}

// ── Static concentration bar for Distribution ─────────────────

const DISTRIB_BARS = [
  { label: 'Hachette', pct: 40, color: '#EF4444' },
  { label: 'Interforum', pct: 22, color: '#F97316' },
  { label: 'Sodis', pct: 15, color: '#A855F7' },
  { label: 'Autres', pct: 23, color: '#94A3B8' },
]

function ConcentrationBar() {
  return (
    <div>
      <SectionLabel>Concentration du marché</SectionLabel>
      <div className="overflow-hidden rounded-2xl border border-[#E5E5E3] bg-white px-4 py-4 dark:border-[#2A2A28] dark:bg-dark-card">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {DISTRIB_BARS.map(b => (
            <div key={b.label} style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {DISTRIB_BARS.map(b => (
            <div key={b.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
              <span className="text-xs text-muted dark:text-subtle">{b.label} {b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab contents ──────────────────────────────────────────────

function EditionTab({ chain }: { chain: OwnershipChain }) {
  const ownerSubtitle = chain.group.listed ? 'Groupe coté en bourse' : 'Groupe familial, non coté'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SectionLabel>Chaîne de propriété</SectionLabel>
        <ChainCard>
          <ChainRow dot="#818CF8" label="Éditeur" value={chain.publisher.name} />
          <Divider />
          <ChainRow dot="#4F46E5" label="Groupe" value={chain.group.name} />
          <Divider />
          <ChainRow dot="#3730A3" label="Propriétaire" value={chain.group.owner} subtitle={ownerSubtitle} />
        </ChainCard>
      </div>

      {chain.group.note && (
        <NoteBox text={chain.group.note} url={chain.group.wikipedia_url} />
      )}
    </div>
  )
}

function DiffusionTab({ chain }: { chain: OwnershipChain }) {
  const { diffuseur, diffuseur_owner, owner } = chain.group
  const isExternal = diffuseur_owner && diffuseur_owner !== owner

  return (
    <div className="flex flex-col gap-4">
      <RoleBox>
        Le diffuseur envoie des représentants en librairie pour présenter les nouveautés, négocier les mises en avant et transmettre les commandes.
      </RoleBox>

      {diffuseur ? (
        <div>
          <SectionLabel>Diffuseur</SectionLabel>
          <ChainCard>
            <ChainRow dot="#818CF8" label="Entreprise" value={diffuseur} />
            {diffuseur_owner && (
              <>
                <Divider />
                <ChainRow dot="#3730A3" label="Propriétaire" value={diffuseur_owner} />
              </>
            )}
          </ChainCard>
        </div>
      ) : (
        <p className="text-sm text-muted dark:text-subtle">Données non disponibles.</p>
      )}

      {isExternal && (
        <WarningBox>
          Attention : malgré son indépendance éditoriale, cet éditeur diffuse via {diffuseur_owner}. Une partie des flux financiers transite par ce groupe.
        </WarningBox>
      )}
    </div>
  )
}

function DistributionTab({ chain }: { chain: OwnershipChain }) {
  const { distributeur, distributeur_owner, owner } = chain.group
  const isExternal = distributeur_owner && distributeur_owner !== owner

  return (
    <div className="flex flex-col gap-4">
      <RoleBox>
        Le distributeur achemine physiquement les livres vers les librairies, gère les stocks en entrepôt et traite les retours des invendus.
      </RoleBox>

      {distributeur ? (
        <div>
          <SectionLabel>Distributeur</SectionLabel>
          <ChainCard>
            <ChainRow dot="#818CF8" label="Entreprise" value={distributeur} />
            {distributeur_owner && (
              <>
                <Divider />
                <ChainRow dot="#3730A3" label="Propriétaire" value={distributeur_owner} />
              </>
            )}
          </ChainCard>
        </div>
      ) : (
        <p className="text-sm text-muted dark:text-subtle">Données non disponibles.</p>
      )}

      {isExternal && (
        <WarningBox>
          Attention : malgré son indépendance éditoriale, cet éditeur distribue via {distributeur_owner}. Une partie des flux financiers transite par ce groupe.
        </WarningBox>
      )}

      <ConcentrationBar />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function ResultCard({ book, chain }: Props) {
  const [tab, setTab] = useState<Tab>('edition')
  const [reporting, setReporting] = useState(false)

  const badge = chain
    ? chain.group.listed
      ? { label: 'Groupe coté en bourse', className: 'bg-[#FEE2E2] text-[#991B1B] dark:bg-red-950/40 dark:text-red-300' }
      : { label: 'Groupe indépendant', className: 'bg-accent-tint text-[#4338CA] dark:bg-indigo-950/60 dark:text-accent-light' }
    : null

  const TABS: { id: Tab; label: string }[] = [
    { id: 'edition', label: 'Édition' },
    { id: 'diffusion', label: 'Diffusion' },
    { id: 'distribution', label: 'Distribution' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Book header */}
      <div className="flex items-start gap-4 rounded-2xl border border-[#E5E5E3] bg-white p-4 dark:border-[#2A2A28] dark:bg-dark-card">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-xl text-white">?</div>
        )}
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-snug text-ink dark:text-white">
            {book.title}
          </h2>
          {book.authors.length > 0 && (
            <p className="mt-0.5 text-sm text-muted">{book.authors.join(', ')}</p>
          )}
          {book.isbn && (
            <p className="mt-0.5 text-xs text-subtle">{book.isbn}</p>
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
          {/* Tabs */}
          <div className="flex border-b border-[#E5E5E3] dark:border-[#2A2A28]">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 pb-2.5 pt-1 text-sm transition-colors ${
                  tab === t.id
                    ? 'border-b-2 border-accent font-semibold text-accent dark:border-accent-light dark:text-accent-light'
                    : 'text-muted dark:text-subtle'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {tab === 'edition' && <EditionTab chain={chain} />}
            {tab === 'diffusion' && <DiffusionTab chain={chain} />}
            {tab === 'distribution' && <DistributionTab chain={chain} />}
          </div>
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
        Signaler une erreur sur ces données
      </button>

      {reporting && (
        <ReportModal book={book} chain={chain} onClose={() => setReporting(false)} />
      )}
    </div>
  )
}
