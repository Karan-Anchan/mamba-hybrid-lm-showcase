import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowClockwise, Broadcast, CheckCircle, CloudSlash, Cpu, Database,
  LockSimple, PaperPlaneTilt, Speedometer, WarningCircle,
} from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { prompts, ratioEvidence, sampleFor, type PromptId, type Ratio } from '../data/evidence'
import {
  checkHealth, hasConfiguredApi, streamGeneration, type ApiHealth, type CompleteEvent,
} from '../lib/api'

type DisplayMetrics = {
  generatedTokens: number
  tokensPerSecond: number
  ttftMs: number
  peakVramMiB: number | null
  checkpoint: string
  device: string
}

const promptIds = Object.keys(prompts) as PromptId[]

function findPromptId(prompt: string): PromptId | null {
  return promptIds.find((id) => prompts[id] === prompt) ?? null
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function GenerationLab({ ratio, onRatioChange }: {
  ratio: Ratio
  onRatioChange: (ratio: Ratio) => void
}) {
  const [health, setHealth] = useState<ApiHealth | null>(null)
  const [checked, setChecked] = useState(false)
  const [prompt, setPrompt] = useState(prompts.P1)
  const [temperature, setTemperature] = useState(0.8)
  const [topK, setTopK] = useState(40)
  const [maxTokens, setMaxTokens] = useState(48)
  const [completion, setCompletion] = useState('')
  const [metrics, setMetrics] = useState<DisplayMetrics | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const runRef = useRef(0)
  const live = health?.status === 'ready'
  const promptId = findPromptId(prompt)
  const recordedAvailable = !live && promptId !== null
  const ratioAvailable = !live || health.available_ratios.includes(ratio)
  const sourceLabel = live ? `${health.mode.toUpperCase()} service` : 'Recorded RTX 5070 run'

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 3500)
    checkHealth(controller.signal).then((result) => {
      setHealth(result)
      setChecked(true)
      if (result && !result.available_ratios.includes(ratio)) {
        onRatioChange(result.loaded_ratio ?? result.available_ratios[0])
      }
    }).finally(() => window.clearTimeout(timeout))
    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [onRatioChange, ratio])

  function resetOutput() {
    runRef.current += 1
    setCompletion('')
    setMetrics(null)
    setError('')
    setBusy(false)
  }

  function chooseRatio(nextRatio: Ratio) {
    resetOutput()
    onRatioChange(nextRatio)
  }

  function choosePrompt(nextPrompt: string) {
    resetOutput()
    setPrompt(nextPrompt)
  }

  const status = useMemo(() => {
    if (!checked) return { className: 'checking', icon: <ArrowClockwise size={15} />, title: 'Checking model service', body: 'The showcase is testing the configured API.' }
    if (live) return { className: 'live', icon: <Broadcast size={15} weight="fill" />, title: `Live ${health.mode.toUpperCase()} model`, body: health.device }
    return { className: 'recorded', icon: <CloudSlash size={15} />, title: 'Recorded evidence mode', body: hasConfiguredApi ? 'The model host is sleeping or unavailable.' : 'No public compute host is configured.' }
  }, [checked, health, live])

  async function replayRecorded(runId: number) {
    if (!promptId) throw new Error('Choose one of the three measured prompts to replay recorded evidence.')
    const sample = sampleFor(ratio, promptId)
    const chunks = sample.completion.match(/\s+|[^\s]+/g) ?? [sample.completion]
    let built = ''
    for (const chunk of chunks) {
      if (runRef.current !== runId) return
      built += chunk
      setCompletion(built)
      await wait(18)
    }
    if (runRef.current !== runId) return
    setMetrics({
      generatedTokens: sample.generatedTokens,
      tokensPerSecond: sample.tokensPerSecond,
      ttftMs: sample.timeToFirstTokenSeconds * 1000,
      peakVramMiB: sample.peakVramMiB,
      checkpoint: sample.checkpoint,
      device: 'RTX 5070 · recorded bf16',
    })
  }

  async function runGeneration() {
    const runId = runRef.current + 1
    runRef.current = runId
    setBusy(true)
    setCompletion('')
    setMetrics(null)
    setError('')
    try {
      if (!live) {
        await replayRecorded(runId)
      } else {
        let complete: CompleteEvent | null = null
        await streamGeneration({
          prompt, ratio, temperature, top_k: topK, max_new_tokens: maxTokens, seed: 1337,
        }, {
          onToken: (event) => setCompletion(event.completion),
          onComplete: (event) => { complete = event },
        })
        if (!complete) throw new Error('The stream ended before the completion summary arrived.')
        const result = complete as CompleteEvent
        setCompletion(result.completion)
        setMetrics({
          generatedTokens: result.metrics.generated_tokens,
          tokensPerSecond: result.metrics.tokens_per_second,
          ttftMs: result.metrics.time_to_first_token_seconds * 1000,
          peakVramMiB: result.metrics.peak_vram_mib,
          checkpoint: result.checkpoint_sha256.slice(0, 16),
          device: result.metrics.device,
        })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Generation failed.')
    } finally {
      if (runRef.current === runId) setBusy(false)
    }
  }

  return (
    <div className="generation-shell">
      <div className="generation-heading">
        <div>
          <span className="section-kicker"><PaperPlaneTilt size={17} weight="fill" /> Inference console</span>
          <h2>Run the checkpoint, or inspect a measured replay.</h2>
          <p>The interface never passes recorded text off as a live model response.</p>
        </div>
        <div className={`service-status ${status.className}`}>
          <span>{status.icon}{status.title}</span>
          <small>{status.body}</small>
        </div>
      </div>

      <div className="generation-grid">
        <div className="generation-controls">
          <fieldset className="ratio-fieldset">
            <legend>Attention : SSM ratio</legend>
            <div className="ratio-choice-grid">
              {ratioEvidence.map((variant) => {
                const available = !live || health.available_ratios.includes(variant.ratio)
                return (
                  <button type="button" key={variant.ratio} className={ratio === variant.ratio ? 'active' : ''} onClick={() => chooseRatio(variant.ratio)} disabled={!available || busy} aria-pressed={ratio === variant.ratio}>
                    <strong>{variant.ratio}</strong><span>{variant.attentionLayers}A · {variant.mambaLayers}M</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="prompt-label" htmlFor="generation-prompt">Prompt <span>API limit · 1,024 tokenizer tokens</span></label>
          <textarea id="generation-prompt" value={prompt} onChange={(event) => choosePrompt(event.target.value)} disabled={busy} maxLength={20000} />
          {!live && (
            <div className="prompt-presets" aria-label="Measured prompts">
              {promptIds.map((id) => <button type="button" key={id} className={promptId === id ? 'active' : ''} onClick={() => choosePrompt(prompts[id])}>{id}</button>)}
              <span>{promptId ? 'Registered measured prompt' : 'Choose P1–P3 to replay evidence'}</span>
            </div>
          )}

          <div className="slider-grid">
            <label>Temperature <output>{temperature.toFixed(1)}</output><input type="range" min="0.1" max="2" step="0.1" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} disabled={!live || busy} /></label>
            <label>Top-k <output>{topK}</output><input type="range" min="1" max="100" value={topK} onChange={(event) => setTopK(Number(event.target.value))} disabled={!live || busy} /></label>
            <label>New tokens <output>{maxTokens}</output><input type="range" min="1" max="512" value={maxTokens} onChange={(event) => setMaxTokens(Number(event.target.value))} disabled={!live || busy} /></label>
          </div>
          {!live && <p className="locked-protocol"><LockSimple size={15} /> Recorded runs use temperature 0.8, top-k 40, and 48 new tokens.</p>}

          <button className="generate-button" type="button" onClick={runGeneration} disabled={busy || !ratioAvailable || (!live && !recordedAvailable) || !prompt.trim()}>
            {busy ? <><ArrowClockwise className="spin" size={18} /> {live ? 'Generating…' : 'Replaying measured tokens…'}</> : <><PaperPlaneTilt size={18} weight="fill" /> {live ? 'Generate live' : 'Replay measured run'}</>}
          </button>
        </div>

        <div className="generation-output">
          <div className="output-toolbar">
            <span><i className={live ? 'live' : 'recorded'} /> {sourceLabel}</span>
            <small>{ratio} · {ratioEvidence.find((item) => item.ratio === ratio)!.parameters.toLocaleString()} params</small>
          </div>
          <div className="output-copy" aria-live="polite">
            <span className="prompt-copy">{prompt}</span>
            {completion ? <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="completion-copy">{completion}</motion.span> : <span className="output-placeholder">{busy ? 'Waiting for the first token…' : 'Output will appear here.'}</span>}
            {busy && <span className="cursor" aria-hidden="true" />}
          </div>
          {error && <div className="generation-error" role="alert"><WarningCircle size={19} /> {error}</div>}
          <div className="metric-rack">
            <div><Speedometer size={18} /><span>speed</span><strong>{metrics ? metrics.tokensPerSecond.toFixed(2) : '—'} <small>tok/s</small></strong></div>
            <div><Broadcast size={18} /><span>first token</span><strong>{metrics ? metrics.ttftMs.toFixed(1) : '—'} <small>ms</small></strong></div>
            <div><Database size={18} /><span>peak VRAM</span><strong>{metrics?.peakVramMiB != null ? metrics.peakVramMiB.toFixed(1) : 'n/a'} <small>{metrics?.peakVramMiB != null ? 'MiB' : ''}</small></strong></div>
            <div><Cpu size={18} /><span>tokens</span><strong>{metrics?.generatedTokens ?? '—'}</strong></div>
          </div>
          <div className="output-provenance">
            {metrics ? <><CheckCircle size={16} weight="fill" /><span>{live ? 'Live response' : 'Measured at clean commit d6a4613'} · checkpoint {metrics.checkpoint} · {metrics.device}</span></> : <><Database size={16} /><span>Metrics populate only after a complete run.</span></>}
          </div>
        </div>
      </div>
    </div>
  )
}
