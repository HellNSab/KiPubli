import { CHART_DATA } from '../data/chartData'

type Props = {
  onScan: () => void
  onSkip: () => void
}

const CONCENTRATION = [
  {
    label: 'Éditeurs',
    count: '~8 000 en France',
    fill: 0.42,
    color: '#6366F1',
    note: 'Mais 3 groupes = +50% des ventes',
  },
  {
    label: 'Distributeurs',
    count: '~5 majeurs',
    fill: 0.62,
    color: '#F59E0B',
    note: 'Hachette + Interforum = ~60% du marché',
  },
  {
    label: 'Librairies',
    count: '~3 200 indép.',
    fill: 0.38,
    color: '#10B981',
    note: '40% de part de marché, marge ~1%',
  },
  {
    label: 'Auteurs',
    count: '101 600',
    fill: 0.12,
    color: '#EC4899',
    note: '~8–10% du prix HT, payés en dernier',
  },
]

export function ChainExplainer({ onScan, onSkip }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Hero text */}
      <div>
        <h2 className="text-[22px] font-semibold leading-snug tracking-tight text-ink dark:text-white">
          Quand vous achetez un livre,<br />où va votre argent&nbsp;?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted dark:text-subtle">
          Entre l'auteur et vous, plusieurs acteurs se partagent le prix. Certains sont indépendants. D'autres appartiennent à de grands groupes.
        </p>
      </div>

      {/* Card 1 — répartition du prix */}
      <div className="rounded-2xl border border-[#E5E5E3] bg-white px-4 py-4 dark:border-[#2A2A28] dark:bg-[#161614]">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
          Pour un livre à 20&nbsp;€
        </p>

        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-ink dark:text-white">20&nbsp;€</span>
          <span className="text-xs text-muted dark:text-subtle">prix fixe (loi Lang)</span>
        </div>

        {/* Stacked bar */}
        <div className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full">
          {CHART_DATA.slices.map(s => (
            <div
              key={s.id}
              style={{ width: `${s.pct * 100}%`, background: s.color }}
            />
          ))}
        </div>

        {/* Line items */}
        <ul className="flex flex-col gap-2.5">
          {CHART_DATA.slices.map(s => (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="flex-1 text-sm text-ink dark:text-white">
                {s.id === 'diffusion-distribution' ? 'Diffusion + distribution' :
                 s.id === 'auteur' ? 'Auteur·e' :
                 s.id === 'groupe' ? 'Groupe holding' :
                 s.label}
              </span>
              <span className="text-sm font-medium text-ink dark:text-white">
                ~{s.euros.toFixed(2).replace('.', ',')}&nbsp;€
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Card 2 — concentration */}
      <div className="rounded-2xl border border-[#E5E5E3] bg-white px-4 py-4 dark:border-[#2A2A28] dark:bg-[#161614]">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
          Qui contrôle quoi&nbsp;?
        </p>

        <ul className="flex flex-col gap-4">
          {CONCENTRATION.map(row => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink dark:text-white">{row.label}</span>
                <span className="text-xs text-muted dark:text-subtle">{row.count}</span>
              </div>
              <div className="my-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E5E3] dark:bg-[#2A2A28]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${row.fill * 100}%`, background: row.color }}
                />
              </div>
              <p className="text-[11px] text-muted dark:text-subtle">{row.note}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA text block */}
      <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-4">
        <p className="text-sm leading-relaxed text-accent dark:text-accent-light">
          Scannez un livre pour savoir si son éditeur est{' '}
          <strong className="font-semibold dark:text-white">indépendant</strong>, appartient à{' '}
          <strong className="font-semibold dark:text-white">LVMH</strong>, à{' '}
          <strong className="font-semibold dark:text-white">CMA CGM</strong>, ou à une{' '}
          <strong className="font-semibold dark:text-white">famille</strong>{' '}
          — et quel distributeur achemine l'argent.
        </p>
      </div>

      {/* Bottom buttons */}
      <div className="flex flex-col gap-2 pb-2">
        <button
          type="button"
          onClick={onScan}
          className="flex w-full flex-col items-center justify-center rounded-2xl bg-ink py-4 text-center transition-opacity hover:opacity-90 dark:bg-white"
        >
          <span className="text-base font-semibold text-white dark:text-ink">Scanner un livre</span>
          <span className="text-xs text-[#9B9B97] dark:text-muted">Scannez l'ISBN ou la couverture</span>
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#2A2A28] py-4 text-sm font-medium text-muted transition-colors hover:text-ink dark:hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour
        </button>
      </div>
    </div>
  )
}
