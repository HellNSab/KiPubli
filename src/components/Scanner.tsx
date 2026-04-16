import { useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { isValidIsbn, normalizeIsbn } from '../lib/isbn'

type Props = {
  onDetected: (isbn: string) => void
  onCancel: () => void
}

// Hidden element required to instantiate Html5Qrcode for file scanning.
const HIDDEN_ID = 'kipubli-scanner-hidden'

export function Scanner({ onDetected, onCancel }: Props) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setError(null)

    const scanner = new Html5Qrcode(HIDDEN_ID, { verbose: false })
    try {
      const decoded = await scanner.scanFile(file, /* showImage */ false)
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
      setProcessing(false)
      // Reset input so the same photo can be retried
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
    <div className="flex flex-col gap-6">
      {/* Hidden element required by Html5Qrcode */}
      <div id={HIDDEN_ID} className="hidden" />

      <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-stone-300 px-6 py-10">
        <p className="text-center text-sm text-stone-600">
          Prenez une photo du code-barres ISBN avec l'appareil photo de votre téléphone.
        </p>
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
          disabled={processing}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {processing ? 'Analyse en cours…' : '📷 Ouvrir l\'appareil photo'}
        </button>

        {error && (
          <p className="rounded-md bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={submitManual} className="flex flex-col gap-2">
        <label htmlFor="manual-isbn" className="text-sm font-medium text-ink">
          Ou saisissez l'ISBN manuellement
        </label>
        <div className="flex gap-2">
          <input
            id="manual-isbn"
            type="text"
            inputMode="numeric"
            placeholder="978…"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Valider
          </button>
        </div>
        {manualError && <p className="text-sm text-red-600">{manualError}</p>}
      </form>

      <button
        type="button"
        onClick={onCancel}
        className="self-start text-sm text-stone-600 underline-offset-2 hover:underline"
      >
        ← Annuler
      </button>
    </div>
  )
}
