import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { isValidIsbn, normalizeIsbn } from '../lib/isbn'

type Props = {
  onDetected: (isbn: string) => void
  processing: boolean
}

type Mode = 'idle' | 'live' | 'fallback'

const LIVE_ID = 'kipubli-scanner-live'
const FILE_ID = 'kipubli-scanner-file'
const FALLBACK_DELAY_MS = 5_000

export function Scanner({ onDetected, processing }: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const [decoding, setDecoding] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stable ref so the html5-qrcode success callback never captures a stale closure
  const onDetectedRef = useRef(onDetected)
  useEffect(() => { onDetectedRef.current = onDetected })

  // Start the live camera when mode flips to 'live'
  useEffect(() => {
    if (mode !== 'live') return
    if (scannerRef.current) return // guard against React double-invoke in dev

    const scanner = new Html5Qrcode(LIVE_ID, { verbose: false })
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10 },
        (decoded) => {
          const isbn = normalizeIsbn(decoded)
          if (isValidIsbn(isbn)) {
            stopScanning()
            onDetectedRef.current(isbn)
          }
        },
        () => { /* per-frame misses are normal */ },
      )
      .then(() => {
        timerRef.current = setTimeout(() => setMode('fallback'), FALLBACK_DELAY_MS)
      })
      .catch(() => {
        // Camera permission denied or unavailable → go straight to file input
        scannerRef.current = null
        setMode('idle')
        fileInputRef.current?.click()
      })
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  function stopScanning() {
    if (timerRef.current) clearTimeout(timerRef.current)
    const scanner = scannerRef.current
    scannerRef.current = null
    setMode('idle')
    // Stop and clear async — errors don't matter at this point
    scanner?.stop().catch(() => {})
  }

  function switchToFileInput() {
    // Must trigger the click synchronously while inside the user-gesture handler
    fileInputRef.current?.click()
    stopScanning()
  }

  async function handleFileCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setDecoding(true)
    setFileError(null)
    const scanner = new Html5Qrcode(FILE_ID, { verbose: false })
    try {
      const decoded = await scanner.scanFile(file, false)
      const isbn = normalizeIsbn(decoded)
      if (isValidIsbn(isbn)) {
        onDetectedRef.current(isbn)
      } else {
        setFileError("Code scanné mais ce n'est pas un ISBN valide. Réessayez.")
      }
    } catch {
      setFileError("Impossible de lire le code-barres. Cadrez bien le code ISBN et réessayez.")
    } finally {
      try { await scanner.clear() } catch { /* ignore */ }
      setDecoding(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault()
    const isbn = normalizeIsbn(manual)
    if (!isValidIsbn(isbn)) {
      setManualError('ISBN invalide. Saisissez 10 ou 13 chiffres.')
      return
    }
    setManualError(null)
    onDetectedRef.current(isbn)
  }

  const busy = decoding || processing

  return (
    <div className="flex flex-col gap-4">
      {/* html5-qrcode file-decode target — always in DOM, never visible */}
      <div id={FILE_ID} className="hidden" />

      <p className="text-sm text-muted dark:text-subtle">Scannez un code-barres ISBN</p>

      {/* Viewfinder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100 dark:bg-dark-card">
        {/* Live camera feed — html5-qrcode renders into this div */}
        {mode !== 'idle' && <div id={LIVE_ID} className="absolute inset-0" />}

        {/* Corner brackets (always on top) */}
        <span className="pointer-events-none absolute left-5 top-5 z-10 h-7 w-7 border-l-[2.5px] border-t-[2.5px] border-accent" />
        <span className="pointer-events-none absolute right-5 top-5 z-10 h-7 w-7 border-r-[2.5px] border-t-[2.5px] border-accent" />
        <span className="pointer-events-none absolute bottom-5 left-5 z-10 h-7 w-7 border-b-[2.5px] border-l-[2.5px] border-accent" />
        <span className="pointer-events-none absolute bottom-5 right-5 z-10 h-7 w-7 border-b-[2.5px] border-r-[2.5px] border-accent" />

        {/* Processing spinner */}
        {busy && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        {/* 30 s fallback nudge */}
        {mode === 'fallback' && !busy && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10">
            <p className="text-center text-xs text-white/70">Difficultés à scanner ?</p>
            <button
              type="button"
              onClick={switchToFileInput}
              className="mt-2 w-full rounded-lg bg-white/15 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              Utiliser l'appareil photo →
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileCapture}
      />

      {mode === 'idle' ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setMode('live')}
          className="w-full rounded-xl bg-accent py-4 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? 'Analyse en cours…' : 'Scanner'}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopScanning}
          className="w-full rounded-xl border border-[#E5E5E3] py-4 text-base font-medium text-muted transition-colors hover:bg-stone-50 dark:border-[#2A2A28] dark:text-subtle dark:hover:bg-dark-card"
        >
          Annuler
        </button>
      )}

      {fileError && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {fileError}
        </p>
      )}

      <form onSubmit={submitManual} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="ISBN manuel — 978…"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="flex-1 rounded-xl border border-[#E5E5E3] bg-white px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-[#2A2A28] dark:bg-dark-card dark:text-white dark:placeholder:text-subtle"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl border border-accent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent-tint disabled:opacity-50 dark:hover:bg-indigo-950/40"
          >
            OK
          </button>
        </div>
        {manualError && <p className="text-sm text-red-600 dark:text-red-400">{manualError}</p>}
      </form>
    </div>
  )
}
