import { useState } from 'react'
import { prompts, ratioEvidence, sampleFor, type PromptId } from '../data/evidence'

const promptIds = Object.keys(prompts) as PromptId[]
const seedByPrompt: Record<PromptId, number> = { P1: 1701, P2: 1702, P3: 1703 }
const source = 'https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/61d14375bd1169aa0bb68a7954d352ad81696aee/results/week5-generation-cuda-v1/generation_results.json'

export function RecordedComparison() {
  const [promptId, setPromptId] = useState<PromptId>('P1')

  return <div className="recorded-comparison" role="region" aria-labelledby="recorded-comparison-title">
    <div className="comparison-heading">
      <div><h3 id="recorded-comparison-title">One prompt. Three recorded completions.</h3><p>All outputs appear together. Select another measured prompt to compare the same three models.</p></div>
      <div className="comparison-prompts" role="group" aria-label="Shared recorded prompt">
        {promptIds.map((id) => <button type="button" key={id} aria-pressed={promptId === id}
          aria-label={`Compare ${id} across all models`} onClick={() => setPromptId(id)}>{id}</button>)}
      </div>
    </div>
    <div className="comparison-prompt"><span>Shared prompt · {promptId}</span><p>{prompts[promptId]}</p></div>
    <p className="comparison-protocol"><b>Recorded evidence</b> · RTX 5070 · bf16 · 48 generated tokens · temperature 0.8 · top-k 40 · seed {seedByPrompt[promptId]}</p>
    <div className="comparison-grid">{ratioEvidence.map((variant) => {
      const sample = sampleFor(variant.ratio, promptId)
      const titleId = `recorded-${variant.ratio.replace(':', '-')}-title`
      return <article className="comparison-card" key={variant.ratio} aria-labelledby={titleId}>
        <header><h4 id={titleId}>{variant.ratio}</h4><span>{variant.attentionLayers} attention / {variant.mambaLayers} Mamba-2</span></header>
        <dl className="comparison-metrics"><div><dt>Generation rate</dt><dd>{sample.tokensPerSecond.toFixed(2)} <small>tok/s</small></dd></div><div><dt>Time to first token</dt><dd>{(sample.timeToFirstTokenSeconds * 1000).toFixed(2)} <small>ms</small></dd></div></dl>
        <p className="recorded-completion">{sample.completion}</p>
        <p className="comparison-checkpoint">Checkpoint <code>{sample.checkpoint}</code></p>
      </article>
    })}</div>
    <p className="comparison-note">Generation rate includes reading the prompt and sampling. Values belong to this selected prompt, rather than the three-prompt medians above. These small models repeat, drift and invent claims; the samples do not establish a quality ranking.</p>
    <p className="compact-source"><a href={source} target="_blank" rel="noreferrer">Generation record week5-generation-cuda-v1 · artifact 61d1437 · measured source d6a4613 ↗</a></p>
  </div>
}
