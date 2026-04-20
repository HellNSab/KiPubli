import { useMemo, useState } from 'react'
import { pie, arc } from 'd3-shape'
import { packSiblings } from 'd3-hierarchy'
import { CHART_DATA } from '../data/chartData'
import type { Slice } from '../data/chartData'

// ── Layout constants ──────────────────────────────────────────
const W = 280
const H = 280
const CX = W / 2
const CY = H / 2
const OUTER_R = 126
const INNER_R = 52
const GAP = 0.03
const ACTIVE_OFFSET = 8
const NARROW_SLICE_SCALE = 0.7
const PACK_FILL = 0.72

// ── D3 pie layout ─────────────────────────────────────────────
const makePie = pie<Slice>()
  .value(d => d.pct)
  .sort(null)
  .padAngle(GAP)

const makeArc = arc<ReturnType<typeof makePie>[number]>()
  .innerRadius(INNER_R)
  .outerRadius(OUTER_R)

// ── Circle packing per slice ──────────────────────────────────
type PackedNode = { x: number; y: number; r: number }

function packSlice(slice: Slice, arcDatum: ReturnType<typeof makePie>[number]): PackedNode[] {
  const span = arcDatum.endAngle - arcDatum.startAngle
  const arcArea = (span * (OUTER_R ** 2 - INNER_R ** 2)) / 2

  // Raw (pre-scale) area sum assumes r = sqrt(weight) → area = π * weight
  const rawAreaSum = Math.PI * slice.actors.reduce((sum, a) => sum + a.weight, 0)
  const narrow = slice.pct < 0.08 ? NARROW_SLICE_SCALE : 1
  const SCALE = Math.sqrt((arcArea * PACK_FILL) / rawAreaSum) * narrow

  const nodes = slice.actors.map(a => ({
    r: Math.sqrt(a.weight) * SCALE,
    x: 0,
    y: 0,
  }))

  packSiblings(nodes)
  return nodes
}

// ── Component ─────────────────────────────────────────────────
export function HomeChart() {
  const [activeId, setActiveId] = useState<string | null>(null)

  const arcs = useMemo(() => makePie(CHART_DATA.slices), [])
  const packedBySlice = useMemo(() => arcs.map(d => packSlice(d.data, d)), [arcs])

  const activeSlice = CHART_DATA.slices.find(s => s.id === activeId) ?? null
  const hasActive = activeId !== null

  return (
    <div className="flex flex-col gap-4">
      {/* Chart */}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[280px]">
          <defs>
            {arcs.map(d => (
              <clipPath key={d.data.id} id={`clip-${d.data.id}`}>
                <path d={makeArc(d) ?? ''} />
              </clipPath>
            ))}
          </defs>

          <g transform={`translate(${CX}, ${CY})`}>
            {arcs.map((d, si) => {
              const isActive = d.data.id === activeId
              const midAngle = (d.startAngle + d.endAngle) / 2 - Math.PI / 2
              const centroidR = (INNER_R + OUTER_R) / 2
              const cx = Math.cos(midAngle) * centroidR
              const cy = Math.sin(midAngle) * centroidR

              const offset = isActive ? ACTIVE_OFFSET : 0
              const tx = Math.cos(midAngle) * offset
              const ty = Math.sin(midAngle) * offset

              return (
                <g
                  key={d.data.id}
                  className="cursor-pointer"
                  style={{
                    transform: `translate(${tx}px, ${ty}px)`,
                    transition: 'transform 0.25s ease, opacity 0.25s ease',
                    opacity: hasActive && !isActive ? 0.3 : 1,
                  }}
                  onClick={() => setActiveId(isActive ? null : d.data.id)}
                >
                  <path
                    d={makeArc(d) ?? ''}
                    fill={d.data.color}
                    fillOpacity={0.18}
                  />

                  <g clipPath={`url(#clip-${d.data.id})`} transform={`translate(${cx}, ${cy})`}>
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
                          animationDelay: `${si * 80 + ci * 25}ms`,
                          animationDuration: '500ms',
                        }}
                      />
                    ))}
                  </g>
                </g>
              )
            })}

            {/* Centre hole */}
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
        {CHART_DATA.slices.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(id => (id === s.id ? null : s.id))}
            className={`flex flex-col items-center transition-opacity duration-150 ${
              activeId === null || activeId === s.id ? 'opacity-100' : 'opacity-45'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-xs font-bold text-ink dark:text-white">{Math.round(s.pct * 100)}%</span>
            </div>
            <span className="text-[10px] text-muted dark:text-subtle">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Active slice description */}
      {activeSlice ? (
        <div className="rounded-xl border border-[#E5E5E3] px-4 py-3 dark:border-[#2A2A28]">
          <p className="text-sm font-bold text-ink dark:text-white">
            {activeSlice.label} — ~{activeSlice.euros.toFixed(2).replace('.', ',')} €
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted dark:text-subtle">
            {activeSlice.description}
          </p>
        </div>
      ) : (
        <p className="text-center text-xs text-muted dark:text-subtle">
          Touchez une part pour en savoir plus
        </p>
      )}
    </div>
  )
}
