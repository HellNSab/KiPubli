import { useEffect, useState } from 'react'

type InstallState =
  | { kind: 'hidden' }
  | { kind: 'android'; prompt: BeforeInstallPromptEvent }
  | { kind: 'ios' }

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
}

export function InstallPrompt() {
  const [state, setState] = useState<InstallState>({ kind: 'hidden' })
  const [iosDismissed, setIosDismissed] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return

    if (isIos()) {
      setState({ kind: 'ios' })
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setState({ kind: 'android', prompt: e as BeforeInstallPromptEvent })
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setState({ kind: 'hidden' }))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (state.kind !== 'android') return
    await state.prompt.prompt()
    const { outcome } = await state.prompt.userChoice
    if (outcome === 'accepted') setState({ kind: 'hidden' })
  }

  if (state.kind === 'android') {
    return (
      <div className="mt-4 flex items-center justify-between rounded-xl border border-[#C7D2FE] bg-accent-tint dark:border-indigo-800 dark:bg-indigo-950/40 px-4 py-3">
        <p className="text-sm text-[#3730A3] dark:text-accent-light">Installer l'application sur votre téléphone</p>
        <button
          type="button"
          onClick={handleInstall}
          className="ml-4 shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Installer
        </button>
      </div>
    )
  }

  if (state.kind === 'ios' && !iosDismissed) {
    return (
      <div className="mt-4 flex items-start justify-between rounded-xl border border-[#C7D2FE] bg-accent-tint dark:border-indigo-800 dark:bg-indigo-950/40 px-4 py-3">
        <p className="text-sm text-[#3730A3] dark:text-accent-light">
          Pour installer : appuyez sur{' '}
          <span className="font-medium">Partager</span>{' '}
          <svg className="inline h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12H3v9h18v-9h-5M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>{' '}
          puis{' '}
          <span className="font-medium">« Sur l'écran d'accueil »</span>
        </p>
        <button
          type="button"
          onClick={() => setIosDismissed(true)}
          aria-label="Fermer"
          className="ml-3 shrink-0 text-accent/40 hover:text-accent"
        >
          ✕
        </button>
      </div>
    )
  }

  return null
}
