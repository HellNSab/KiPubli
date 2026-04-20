import { useMemo, useState } from 'react'
import { pie, arc } from 'd3-shape'
import { BOOK_MONEY_DATA } from '../data/bookMoneyData'
import type { Slice } from '../data/bookMoneyData'

// ── Layout constants ──────────────────────────────────────────
const W = 280
const H = 280
const CX = W / 2
const CY = H / 2
const OUTER_R = 126
const INNER_R = 52
const GAP = 0.03 // radians between slices

// ── D3 pie layout ─────────────────────────────────────────────
const makePie = pie<Slice>()
  .value(d => d.pct)
  .sort(null)
  .padAngle(GAP)

const makeArc = arc<ReturnType<typeof makePie>[number]>()
  .innerRadius(INNER_R)
  .outerRadius(OUTER_R)


// ── Component ─────────────────────────────────────────────────
export function BookMoneyChart() {
  const [activeId, setActiveId] = useState<string | null>(null)

  const arcs = useMemo(() => makePie(BOOK_MONEY_DATA), [])

const activeSlice = BOOK_MONEY_DATA.find(s => s.id === activeId) ?? null

  return (
    <div className="flex flex-col gap-4">
      {/* Chart */}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[260px]">
          <g transform={`translate(${CX}, ${CY})`}>
            {arcs.map((d) => {
              const isActive = d.data.id === activeId
              const hasActive = activeId !== null
              const midAngle = (d.startAngle + d.endAngle) / 2 - Math.PI / 2

              const offset = isActive ? 6 : 0
              const tx = Math.cos(midAngle) * offset
              const ty = Math.sin(midAngle) * offset

              return (
                <g
                  key={d.data.id}
                  className="cursor-pointer"
                  style={{
                    transform: `translate(${tx}px, ${ty}px)`,
                    transition: 'transform 0.25s ease, opacity 0.25s ease',
                    opacity: hasActive && !isActive ? 0.75 : 1,
                  }}
                  onClick={() => setActiveId(d.data.id)}
                >
                  <path
                    d={makeArc(d) ?? ''}
                    fill={d.data.color}
                    fillOpacity={isActive ? 0.8 : 0.6}
                  />
                </g>
              )
            })}

            {/* Centre hole — at (0,0) in the translated group */}
            <circle
              cx={0} cy={0} r={INNER_R - 2}
              className="fill-[#FAFAFA] dark:fill-[#0F0F0E] pointer-events-none"
            />
            <text
              x={0} y={-7}
              textAnchor="middle"
              fill={activeSlice ? activeSlice.color : '#9B9B97'}
              fontSize="13"
              fontWeight="700"
              fontFamily="system-ui,-apple-system,sans-serif"
              className="pointer-events-none select-none"
            >
              {activeSlice ? `~${activeSlice.euros.toFixed(2).replace('.', ',')} €` : '20 €'}
            </text>
            <text
              x={0} y={9}
              textAnchor="middle"
              fontSize="9.5"
              fontFamily="system-ui,-apple-system,sans-serif"
              className="pointer-events-none select-none fill-[#6B6B68] dark:fill-[#9B9B97]"
            >
              {activeSlice ? activeSlice.label : 'par livre'}
            </text>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
        {BOOK_MONEY_DATA.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            className={`flex flex-col items-center transition-opacity duration-150 ${activeId === null || activeId === s.id ? 'opacity-100' : 'opacity-45'}`}
          >
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-xs font-bold text-ink dark:text-white">{Math.round(s.pct * 100)}%</span>
            </div>
            <span className="text-[10px] text-muted dark:text-subtle">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Active slice detail */}
      {activeSlice && (
        <div className="rounded-xl border border-[#E5E5E3] px-4 py-3 dark:border-[#2A2A28]">
          <p className="text-sm font-bold text-ink dark:text-white">
            {activeSlice.label} — ~{activeSlice.euros.toFixed(2).replace('.', ',')} €
          </p>
          <p className="mt-0.5 text-xs text-muted dark:text-subtle">{activeSlice.detail}</p>

        </div>
      )}
    </div>
  )
}
