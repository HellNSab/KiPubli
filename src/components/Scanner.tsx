import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { isValidIsbn, normalizeIsbn } from '../lib/isbn'

type Props = {
  onDetected: (isbn: string) => void
  onCancel: () => void
}

const REGION_ID = 'kipubli-scanner-region'

export function Scanner({ onDetected, onCancel }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const stoppedRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode(REGION_ID, {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      verbose: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    })
    scannerRef.current = scanner

    const stop = async () => {
      if (stoppedRef.current) return
      stoppedRef.current = true
      try {
        if (scanner.isScanning) await scanner.stop()
        await scanner.clear()
      } catch {
        // best-effort cleanup
      }
    }

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 15,
          // Wide box: barcodes are horizontal, fill most of the viewport width.
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.round(viewfinderWidth * 0.9),
            height: Math.round(viewfinderHeight * 0.45),
          }),
          aspectRatio: 16 / 9,
        },
        (decoded) => {
          if (stoppedRef.current) return
          const isbn = normalizeIsbn(decoded)
          if (!isValidIsbn(isbn)) return
          stop().then(() => onDetected(isbn))
        },
        () => {
          // ignore per-frame "not found" errors
        },
      )
      .then(() => {
        setScanning(true)
        // Check torch support via track capabilities
        const caps = scanner.getRunningTrackCameraCapabilities?.()
        if (caps?.torchFeature().isSupported()) {
          setTorchAvailable(true)
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? (err.message ?? '') : String(err)
        setError(
          message.toLowerCase().includes('permission')
            ? "L'accès à la caméra a été refusé. Vous pouvez saisir l'ISBN manuellement."
            : "Impossible d'ouvrir la caméra. Vous pouvez saisir l'ISBN manuellement.",
        )
      })

    return () => {
      void stop()
    }
  }, [onDetected])

  async function toggleTorch() {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      const capabilities = scanner.getRunningTrackCameraCapabilities?.()
      const torch = capabilities?.torchFeature()
      if (!torch?.isSupported()) return
      const next = !torchOn
      await torch.apply(next)
      setTorchOn(next)
    } catch {
      // torch not available on this device
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
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '16 / 9' }}>
        <div id={REGION_ID} className="h-full w-full" />

        {scanning && torchAvailable && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? 'Éteindre la lampe torche' : 'Allumer la lampe torche'}
            className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm"
          >
            {torchOn ? '🔦' : '💡'}
          </button>
        )}
      </div>

      {scanning && !error && (
        <p className="text-center text-xs text-stone-500">
          Centrez le code-barres dans le cadre et maintenez stable
        </p>
      )}

      {error && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
      )}

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
