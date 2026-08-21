import type { Ratio } from '../data/evidence'

export type ApiHealth = {
  status: string
  mode: 'cpu' | 'cuda'
  device: string
  loaded_ratio: Ratio | null
  available_ratios: Ratio[]
}

export type GenerationPayload = {
  prompt: string
  ratio: Ratio
  temperature: number
  top_k: number
  max_new_tokens: number
  seed: number
}

export type TokenEvent = {
  index: number
  token_id: number
  text: string
  completion: string
  elapsed_seconds: number
}

export type CompleteEvent = {
  completion: string
  checkpoint_sha256: string
  ratio: Ratio
  metrics: {
    generated_tokens: number
    tokens_per_second: number
    time_to_first_token_seconds: number
    peak_vram_mib: number | null
    device: string
  }
}

const configuredUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''

export const hasConfiguredApi = configuredUrl.length > 0

export async function checkHealth(signal?: AbortSignal): Promise<ApiHealth | null> {
  if (!configuredUrl) return null
  try {
    const response = await fetch(`${configuredUrl}/health`, { signal })
    if (!response.ok) return null
    return await response.json() as ApiHealth
  } catch {
    return null
  }
}

type StreamHandlers = {
  onToken: (event: TokenEvent) => void
  onComplete: (event: CompleteEvent) => void
}

function parseEvent(block: string): { event: string; data: unknown } | null {
  const lines = block.split('\n')
  const event = lines.find((line) => line.startsWith('event: '))?.slice(7)
  const data = lines.find((line) => line.startsWith('data: '))?.slice(6)
  if (!event || !data) return null
  return { event, data: JSON.parse(data) }
}

export async function streamGeneration(
  payload: GenerationPayload,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  if (!configuredUrl) throw new Error('No generation API is configured.')
  const response = await fetch(`${configuredUrl}/v1/generate/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!response.ok || !response.body) {
    const detail = await response.text()
    throw new Error(detail || `Generation failed with HTTP ${response.status}.`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n')
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      const parsed = parseEvent(block)
      if (!parsed) continue
      if (parsed.event === 'token') handlers.onToken(parsed.data as TokenEvent)
      if (parsed.event === 'complete') handlers.onComplete(parsed.data as CompleteEvent)
      if (parsed.event === 'error') {
        const error = parsed.data as { detail?: string }
        throw new Error(error.detail ?? 'The generation service returned an error.')
      }
    }
    if (done) break
  }
}
