import { useMemo, useState } from 'react'
import { pie, arc } from 'd3-shape'
import { CHART_DATA } from '../data/chartData'
import type { Slice } from '../data/chartData'

const W = 280
const H = 280
const CX = W / 2
const CY = H / 2
const OUTER_R = 126
const INNER_R = 52

const makePie = pie<Slice>()
  .value(d => d.pct)
  .sort(null)
  .padAngle(0.025)

const makeArc = arc<ReturnType<typeof makePie>[number]>()
  .innerRadius(INNER_R)
  .outerRadius(OUTER_R)

export function HomeChart() {
  const [activeId, setActiveId] = useState<string | null>(null)

  const arcs = useMemo(() => makePie(CHART_DATA.slices), [])
  const activeSlice = CHART_DATA.slices.find(s => s.id === activeId) ?? null
  const hasActive = activeId !== null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[280px]">
          <defs>
            <filter id="bubble-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

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
              const rotDeg = ((midAngle - Math.PI / 2) * 180) / Math.PI

              return (
                <g
                  key={d.data.id}
                  className="cursor-pointer"
                  style={{
                    transition: 'opacity 0.25s ease',
                    opacity: hasActive && !isActive ? 0.35 : 1,
                  }}
                  onClick={() => setActiveId(isActive ? null : d.data.id)}
                >
                  <path
                    d={makeArc(d) ?? ''}
                    fill={d.data.color}
                    fillOpacity={isActive ? 0.22 : 0.12}
                    style={{ transition: 'fill-opacity 0.25s ease' }}
                  />

                  <g clipPath={`url(#clip-${d.data.id})`}>
                    <g transform={`translate(${cx}, ${cy}) rotate(${rotDeg})`}>
                      {d.data.bubbles.map((b, ci) => (
                        <circle
                          key={b.id}
                          cx={b.x}
                          cy={b.y}
                          r={b.r}
                          fill={d.data.color}
                          fillOpacity={0.88}
                          filter="url(#bubble-glow)"
                          className="circle-fade-in"
                          style={{
                            animationDelay: `${si * 80 + ci * 25}ms`,
                            animationDuration: '500ms',
                          }}
                        />
                      ))}
                    </g>
                  </g>
                </g>
              )
            })}

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
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {CHART_DATA.slices.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(id => (id === s.id ? null : s.id))}
            className={`flex flex-col items-center transition-opacity duration-150 ${
              activeId === null || activeId === s.id ? 'opacity-100' : 'opacity-40'
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

      {/* Info text */}
      <div className="min-h-[52px]">
        {activeSlice ? (
          <div>
            <p className="text-sm font-bold text-ink dark:text-white">
              {activeSlice.label} — ~{activeSlice.euros.toFixed(2).replace('.', ',')} €
            </p>
            <p className="mt-0.5 text-xs text-muted dark:text-subtle">
              {activeSlice.tagline}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted dark:text-subtle">
            Touchez une part pour en savoir plus
          </p>
        )}
      </div>
    </div>
  )
}
