import { useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { isValidIsbn, normalizeIsbn } from '../lib/isbn'

type Props = {
  onDetected: (isbn: string) => void
  processing: boolean
}

const HIDDEN_ID = 'kipubli-scanner-hidden'

export function Scanner({ onDetected, processing }: Props) {
  const [decoding, setDecoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const busy = decoding || processing

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setDecoding(true)
    setError(null)
    const scanner = new Html5Qrcode(HIDDEN_ID, { verbose: false })
    try {
      const decoded = await scanner.scanFile(file, false)
      const isbn = normalizeIsbn(decoded)
      if (isValidIsbn(isbn)) {
        onDetected(isbn)
      } else {
        setError("Code scanné mais ce n'est pas un ISBN valide. Réessayez.")
      }
    } catch {
      setError("Impossible de lire le code-barres. Cadrez bien le code ISBN et réessayez.")
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
    onDetected(isbn)
  }

  return (
    <div className="flex flex-col gap-4">
      <div id={HIDDEN_ID} className="hidden" />

      <p className="text-sm text-muted dark:text-subtle">Scannez un code-barres ISBN</p>

      {/* Viewfinder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100 dark:bg-dark-card">
        <span className="absolute left-5 top-5 h-7 w-7 border-l-[2.5px] border-t-[2.5px] border-accent" />
        <span className="absolute right-5 top-5 h-7 w-7 border-r-[2.5px] border-t-[2.5px] border-accent" />
        <span className="absolute bottom-5 left-5 h-7 w-7 border-b-[2.5px] border-l-[2.5px] border-accent" />
        <span className="absolute bottom-5 right-5 h-7 w-7 border-b-[2.5px] border-r-[2.5px] border-accent" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-xl bg-accent py-4 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? 'Analyse en cours…' : 'Scanner'}
      </button>

      {error && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {error}
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
