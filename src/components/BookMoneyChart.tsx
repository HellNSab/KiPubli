import { useState, useMemo } from 'react'

const CX = 140
const CY = 140
const OUTER_R = 126
const INNER_R = 50
const GAP_DEG = 2.5

type Seg = {
  key: string
  label: string
  pct: number
  amountStr: string
  color: string
  note: string
}

const SEGMENTS: Seg[] = [
  {
    key: 'librairie', label: 'Librairie', pct: 30, amountStr: '~6,00 €', color: '#0ea472',
    note: 'Principale source de revenu de la librairie indépendante — loyer, personnel, conseil.',
  },
  {
    key: 'editeur', label: 'Éditeur', pct: 28, amountStr: '~5,60 €', color: '#4f46e5',
    note: 'Fabrication, corrections, mise en page, marketing et marge de l\'éditeur.',
  },
  {
    key: 'distrib', label: 'Distrib.', pct: 13, amountStr: '~2,60 €', color: '#d97706',
    note: 'Diffusion et distribution physique — de l\'imprimeur jusqu\'à la librairie.',
  },
  {
    key: 'auteur', label: 'Auteur', pct: 10, amountStr: '~2,00 €', color: '#db2777',
    note: 'Droits d\'auteur (royalties) — généralement 8–12 % du prix HT.',
  },
  {
    key: 'tva', label: 'TVA', pct: 6, amountStr: '~1,10 €', color: '#64748b',
    note: 'Taux réduit 5,5 % · exception culturelle française',
  },
  {
    key: 'groupe', label: 'Groupe', pct: 8, amountStr: '~1,60 €', color: '#818cf8',
    note: 'Part remontant vers les actionnaires du groupe éditorial (Hachette/LVMH, Editis/CMA CGM…).',
  },
]

const TOTAL = SEGMENTS.reduce((s, seg) => s + seg.pct, 0)

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutPath(outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const oS = polar(CX, CY, outerR, startDeg)
  const oE = polar(CX, CY, outerR, endDeg)
  const iS = polar(CX, CY, innerR, startDeg)
  const iE = polar(CX, CY, innerR, endDeg)
  const large = (endDeg - startDeg) > 180 ? 1 : 0
  return [
    `M ${oS.x.toFixed(2)} ${oS.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oE.x.toFixed(2)} ${oE.y.toFixed(2)}`,
    `L ${iE.x.toFixed(2)} ${iE.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${iS.x.toFixed(2)} ${iS.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function packBubbles(
  startDeg: number, endDeg: number, pct: number,
): Array<{ x: number; y: number; r: number }> {
  // Deterministic LCG seeded by segment geometry
  let state = ((pct * 997 + startDeg * 71 + endDeg * 37) | 0) >>> 0
  if (state === 0) state = 1
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }

  const placed: Array<{ x: number; y: number; r: number }> = []
  const target = Math.round(pct * 0.72)
  const sizes = [11.5, 9, 7, 5.5, 4.5, 3.5, 2.8]

  for (const br of sizes) {
    const minRad = INNER_R + br + 2
    const maxRad = OUTER_R - br - 2
    if (minRad > maxRad) continue

    for (let attempt = 0; attempt < 400 && placed.length < target; attempt++) {
      const radPos = minRad + rand() * (maxRad - minRad)
      const angBuf = Math.min((br / radPos) * (180 / Math.PI) * 0.7, (endDeg - startDeg) * 0.35)
      const minAng = startDeg + angBuf
      const maxAng = endDeg - angBuf
      if (minAng >= maxAng) continue

      const angPos = minAng + rand() * (maxAng - minAng)
      const rads = (angPos - 90) * (Math.PI / 180)
      const px = CX + radPos * Math.cos(rads)
      const py = CY + radPos * Math.sin(rads)

      const ok = placed.every(c => {
        const d = Math.sqrt((c.x - px) ** 2 + (c.y - py) ** 2)
        return d > c.r + br + 1.5
      })

      if (ok) placed.push({ x: px, y: py, r: br })
    }

    if (placed.length >= target) break
  }

  return placed
}

export function BookMoneyChart() {
  const [active, setActive] = useState('tva')

  const segs = useMemo(() => {
    let cursor = -90
    return SEGMENTS.map(seg => {
      const span = (seg.pct / TOTAL) * 360
      const start = cursor + GAP_DEG / 2
      const end = cursor + span - GAP_DEG / 2
      cursor += span
      return { ...seg, start, end }
    })
  }, [])

  const bubbles = useMemo(() => {
    const map: Record<string, Array<{ x: number; y: number; r: number }>> = {}
    for (const s of segs) map[s.key] = packBubbles(s.start, s.end, s.pct)
    return map
  }, [segs])

  const activeSeg = segs.find(s => s.key === active)!

  return (
    <div className="flex flex-col gap-4">
      {/* Chart */}
      <div className="flex justify-center">
        <svg
          viewBox="0 0 280 280"
          className="w-full max-w-[260px]"
          aria-label="Répartition du prix d'un livre à 20 €"
        >
          <defs>
            {segs.map(s => (
              <clipPath key={s.key} id={`clip-bmc-${s.key}`}>
                <path d={donutPath(OUTER_R + 2, INNER_R, s.start, s.end)} />
              </clipPath>
            ))}
          </defs>

          {/* Sector backgrounds */}
          {segs.map(s => (
            <path
              key={s.key}
              d={donutPath(OUTER_R, INNER_R, s.start, s.end)}
              fill={s.color}
              fillOpacity={active === s.key ? 0.22 : 0.10}
              className="cursor-pointer transition-[fill-opacity] duration-200"
              onClick={() => setActive(s.key)}
            />
          ))}

          {/* Bubbles clipped to each sector */}
          {segs.map(s =>
            bubbles[s.key].map((b, i) => (
              <circle
                key={`${s.key}-${i}`}
                cx={b.x}
                cy={b.y}
                r={b.r}
                fill={s.color}
                fillOpacity={active === s.key ? 0.9 : 0.42}
                clipPath={`url(#clip-bmc-${s.key})`}
                className="cursor-pointer transition-[fill-opacity] duration-200"
                onClick={() => setActive(s.key)}
              />
            ))
          )}

          {/* Center hole */}
          <circle
            cx={CX} cy={CY} r={INNER_R - 1}
            className="fill-[#FAFAFA] dark:fill-[#0F0F0E]"
          />

          {/* Center text: amount */}
          <text
            x={CX} y={CY - 6}
            textAnchor="middle"
            fill={activeSeg.color}
            fontSize="13"
            fontWeight="700"
            fontFamily="system-ui,-apple-system,sans-serif"
            className="pointer-events-none select-none"
          >
            {activeSeg.amountStr}
          </text>
          {/* Center text: label */}
          <text
            x={CX} y={CY + 9}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="system-ui,-apple-system,sans-serif"
            className="pointer-events-none select-none fill-[#6B6B68] dark:fill-[#9B9B97]"
          >
            {activeSeg.label}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
        {segs.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={`flex flex-col items-center transition-opacity duration-150 ${active === s.key ? 'opacity-100' : 'opacity-45'}`}
          >
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-xs font-bold text-ink dark:text-white">{s.pct}%</span>
            </div>
            <span className="text-[10px] text-muted dark:text-subtle">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Active segment info */}
      <div className="rounded-xl border border-[#E5E5E3] px-4 py-3 dark:border-[#2A2A28]">
        <p className="text-sm font-bold text-ink dark:text-white">
          {activeSeg.label} — {activeSeg.amountStr}
        </p>
        <p className="mt-0.5 text-xs text-muted dark:text-subtle">{activeSeg.note}</p>
      </div>
    </div>
  )
}
