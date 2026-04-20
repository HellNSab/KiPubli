import { useMemo, useState } from 'react'
import { pie, arc } from 'd3-shape'
import { packSiblings } from 'd3-hierarchy'
import { BOOK_MONEY_DATA, type Slice } from '../data/bookMoneyData'

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

// ── Circle packing per slice ──────────────────────────────────
type PackedNode = { x: number; y: number; r: number; label?: string; actorIndex: number }

function packSlice(slice: Slice, arcDatum: ReturnType<typeof makePie>[number]): PackedNode[] {
  const span = arcDatum.endAngle - arcDatum.startAngle
  // Narrow slices get smaller circles so the cluster fits within the wedge
  const narrowScale = slice.pct < 0.08 ? 0.55 : 1

  // Arc area ≈ span × (R² - r²) / 2
  const arcArea = (span * (OUTER_R ** 2 - INNER_R ** 2)) / 2
  const baseScale = Math.sqrt(arcArea * 0.006)

  const nodes = slice.actors.map((a, i) => ({
    r: Math.sqrt(a.weight) * baseScale * narrowScale,
    label: a.label,
    actorIndex: i,
    x: 0,
    y: 0,
  }))

  packSiblings(nodes)

  return nodes as PackedNode[]
}

// ── Component ─────────────────────────────────────────────────
export function BookMoneyChart() {
  const [activeId, setActiveId] = useState('tva')

  const arcs = useMemo(() => makePie(BOOK_MONEY_DATA), [])

  const packedBySlice = useMemo(() =>
    arcs.map(d => packSlice(d.data, d)),
  [arcs])

  const activeSlice = BOOK_MONEY_DATA.find(s => s.id === activeId)!

  return (
    <div className="flex flex-col gap-4">
      {/* Chart */}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[260px]">
          <defs>
            {arcs.map(d => (
              <clipPath key={d.data.id} id={`clip-${d.data.id}`}>
                <path d={makeArc(d) ?? ''} />
              </clipPath>
            ))}
          </defs>

          {/* Single translate brings arc origin (0,0) to SVG centre —
              clipPaths, sector paths and circle groups all share this space */}
          <g transform={`translate(${CX}, ${CY})`}>
            {arcs.map((d, si) => {
              const isActive = d.data.id === activeId
              const midAngle = (d.startAngle + d.endAngle) / 2 - Math.PI / 2
              const centroidR = (INNER_R + OUTER_R) / 2
              // Centroid is relative to the group origin, no +CX/CY needed
              const cx = Math.cos(midAngle) * centroidR
              const cy = Math.sin(midAngle) * centroidR

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
                    opacity: isActive ? 1 : 0.45,
                  }}
                  onClick={() => setActiveId(d.data.id)}
                >
                  <path
                    d={makeArc(d) ?? ''}
                    fill={d.data.color}
                    fillOpacity={0.15}
                  />

                  <g
                    clipPath={`url(#clip-${d.data.id})`}
                    transform={`translate(${cx}, ${cy})`}
                  >
                    {packedBySlice[si].map((node, ci) => (
                      <circle
                        key={`${d.data.id}-${ci}`}
                        cx={node.x}
                        cy={node.y}
                        r={node.r}
                        fill={d.data.color}
                        fillOpacity={0.85}
                        className="circle-fade-in"
                        style={{
                          animationDelay: `${si * 60 + ci * 20}ms`,
                          animationDuration: '400ms',
                        }}
                      />
                    ))}
                  </g>
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
              fill={activeSlice.color}
              fontSize="13"
              fontWeight="700"
              fontFamily="system-ui,-apple-system,sans-serif"
              className="pointer-events-none select-none"
            >
              ~{activeSlice.euros.toFixed(2).replace('.', ',')} €
            </text>
            <text
              x={0} y={9}
              textAnchor="middle"
              fontSize="9.5"
              fontFamily="system-ui,-apple-system,sans-serif"
              className="pointer-events-none select-none fill-[#6B6B68] dark:fill-[#9B9B97]"
            >
              {activeSlice.label}
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
            className={`flex flex-col items-center transition-opacity duration-150 ${activeId === s.id ? 'opacity-100' : 'opacity-45'}`}
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
      <div className="rounded-xl border border-[#E5E5E3] px-4 py-3 dark:border-[#2A2A28]">
        <p className="text-sm font-bold text-ink dark:text-white">
          {activeSlice.label} — ~{activeSlice.euros.toFixed(2).replace('.', ',')} €
        </p>
        <p className="mt-0.5 text-xs text-muted dark:text-subtle">{activeSlice.detail}</p>

        {/* Named actors (skip uniform-weight lists like auteur) */}
        {activeSlice.actors.some(a => a.label) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeSlice.actors.filter(a => a.label).map(a => (
              <span
                key={a.id}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: activeSlice.color + '22', color: activeSlice.color }}
              >
                {a.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
