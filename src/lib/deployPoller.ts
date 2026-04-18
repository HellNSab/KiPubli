const OWNER = 'HellNSab'
const REPO = 'KiPubli'
const API = 'https://api.github.com'

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

interface WorkflowRun {
  id: number
  status: string
  conclusion: string | null
  created_at: string
  html_url: string
}

async function fetchRuns(token: string): Promise<WorkflowRun[]> {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/actions/runs?branch=main&per_page=5`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    }
  )
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const data = await res.json()
  return (data.workflow_runs ?? []) as WorkflowRun[]
}

export interface DeployCallbacks {
  onQueued?: (runUrl: string) => void
  onSuccess?: () => void
  onFailure?: (runUrl: string) => void
}

export async function pollDeployment(
  token: string,
  since: Date,
  callbacks: DeployCallbacks,
  signal: AbortSignal
): Promise<void> {
  // Subtract a small buffer to account for clock skew
  const threshold = new Date(since.getTime() - 15_000)

  let runId: number | null = null
  let runUrl = `https://github.com/${OWNER}/${REPO}/actions`

  // Phase 1: wait for a new workflow run to appear (up to ~60s)
  for (let i = 0; i < 12; i++) {
    await sleep(5000)
    if (signal.aborted) return
    try {
      const runs = await fetchRuns(token)
      const found = runs.find(r => new Date(r.created_at) >= threshold)
      if (found) {
        runId = found.id
        runUrl = found.html_url
        callbacks.onQueued?.(runUrl)
        break
      }
    } catch {
      // ignore transient errors, keep polling
    }
  }

  if (!runId) {
    callbacks.onFailure?.(runUrl)
    return
  }

  // Phase 2: poll until the run completes (up to ~10 minutes)
  for (let i = 0; i < 60; i++) {
    await sleep(10_000)
    if (signal.aborted) return
    try {
      const runs = await fetchRuns(token)
      const run = runs.find(r => r.id === runId)
      if (!run) continue
      if (run.status === 'completed') {
        if (run.conclusion === 'success') {
          callbacks.onSuccess?.()
        } else {
          callbacks.onFailure?.(run.html_url)
        }
        return
      }
    } catch {
      // ignore transient errors
    }
  }

  // Timed out
  callbacks.onFailure?.(runUrl)
}
