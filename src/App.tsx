import { useState } from 'react'
import { GenerationLab } from './components/GenerationLab'
import { links, ratioEvidence, stateCurves, type Ratio } from './data/evidence'

const source = 'https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/8e836ba93eb790988c37147f474b679443276f53/'
const contexts = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192]
const lineColors: Record<Ratio, string> = { '1:3': 'var(--ratio-13)', '1:7': 'var(--ratio-17)', '1:15': 'var(--ratio-115)' }

function StateFigure() {
  const x = (context: number) => 50 + ((Math.log2(context) - 5) / 8) * 650
  const y = (mib: number) => 244 - (mib / 66) * 202
  const mib = (ratio: Ratio, context: number) => {
    const curve = stateCurves[ratio]
    return (curve.fixedBytes + curve.kvBytesPerToken * context) / 2 ** 20
  }
  const crossover = (stateCurves['1:15'].fixedBytes - stateCurves['1:3'].fixedBytes)
    / (stateCurves['1:3'].kvBytesPerToken - stateCurves['1:15'].kvBytesPerToken)

  return (
    <figure className="state-figure">
      <div className="figure-heading">
        <h3>Why the memory ordering reverses</h3>
        <p>Logical persistent state, not total allocated GPU memory.</p>
      </div>
      <svg viewBox="0 0 750 300" role="img" aria-labelledby="state-title state-desc">
        <title id="state-title">Logical inference-state memory by cached context</title>
        <desc id="state-desc">The 1:3 model has less logical state at short context. Its attention cache grows faster, crossing the 1:15 model near 260 cached tokens. At 8192 tokens, 1:15 has the least state.</desc>
        {[0, 20, 40, 60].map((tick) => <g key={tick} className="chart-gridline"><line x1="50" x2="700" y1={y(tick)} y2={y(tick)} /><text x="42" y={y(tick) + 4} textAnchor="end">{tick}</text></g>)}
        {contexts.map((context) => <text className="chart-tick" key={context} x={x(context)} y="267" textAnchor="middle">{context < 1024 ? context : `${context / 1024}K`}</text>)}
        {ratioEvidence.map(({ ratio }) => <polyline key={ratio} fill="none" stroke={lineColors[ratio]} strokeWidth="2.5" points={contexts.map((context) => `${x(context)},${y(mib(ratio, context))}`).join(' ')} />)}
        <line className="crossover-marker" x1={x(crossover)} x2={x(crossover)} y1="42" y2="244" />
        <text className="crossover-label" x={x(crossover) + 8} y="60">≈260 tokens</text>
        <text className="axis-label" x="375" y="294" textAnchor="middle">cached tokens · log scale</text>
        <text className="axis-label" transform="translate(12 148) rotate(-90)" textAnchor="middle">MiB</text>
      </svg>
      <figcaption>
        <span className="legend">{ratioEvidence.map(({ ratio }) => <span key={ratio}><i style={{ background: lineColors[ratio] }} />{ratio}</span>)}</span>
        The crossover is calculated from fixed Mamba state plus attention K/V bytes per cached token. It is not an accuracy result.
      </figcaption>
    </figure>
  )
}

const method = [
  {
    number: '01', title: 'Prepare one data substrate',
    body: 'Train a 16K byte-level BPE tokenizer, stream a pinned OpenWebText revision, append end-of-document tokens, then verify and promote uint16 train/validation memmaps. Every variant reads the same prepared IDs.',
    code: 'prepare_data.py', href: `${source}src/data/prepare_data.py`,
  },
  {
    number: '02', title: 'Vary the mixer schedule',
    body: 'Keep 16 residual blocks at width 448. Place attention in 4, 2, or 1 block; the others use a PyTorch Mamba-2 SSD mixer. The output width stays constant, so the same model wrapper serves all ratios.',
    code: 'config.py', href: `${source}src/model/config.py`,
  },
  {
    number: '03', title: 'Train with matched exposure',
    body: 'Use 42,725 AdamW updates per model at 16,384 sampled positions per update (700,006,400 total). Batches are 512 tokens, with bf16 autocast, gradient accumulation, and resumable checkpoint/RNG state.',
    code: 'train.py', href: `${source}src/train/train.py`,
  },
  {
    number: '04', title: 'Measure separate outcomes',
    body: 'Select best checkpoints by sampled validation loss. Evaluate recurrent prefill/decode, exact logical state, and needle retrieval through 8K; then run three matched 48-token sampled generations per ratio.',
    code: 'suite.py', href: `${source}src/eval/suite.py`,
  },
] as const

const challenges = [
  {
    title: 'The portable SSD training path is costly',
    body: 'The Mamba mixer materializes an L×L tensor in training, while attention uses PyTorch SDPA. Higher Mamba-share training memory and lower throughput describe this implementation, not fused Mamba kernels.',
  },
  {
    title: 'One run needed a controlled resume',
    body: 'An unrelated GPU workload reduced headroom during the 1:15 run. It resumed from a verified step-12,500 checkpoint with optimizer, counters, metrics boundary, and RNG restored. Its throughput still includes host contention.',
  },
  {
    title: 'Long-context execution did not mean long-context recall',
    body: 'All variants ran through 8K, but none retrieved the exact needle at 2K, 4K, or 8K. Training used 512-token windows; the evaluation reports a failure, not an 8K capability claim.',
  },
  {
    title: 'A static site cannot generate on its own',
    body: 'GitHub Pages shows nine registered RTX 5070 outputs as recorded replay. Custom prompts and live token streaming require a healthy FastAPI model service; the page labels the mode and locks replay to measured prompts.',
  },
] as const

function App() {
  const [ratio, setRatio] = useState<Ratio>('1:3')

  return (
    <>
      <a className="skip-link" href="#results">Skip to results</a>
      <header className="site-header">
        <a className="site-name" href="#top">Mamba hybrid LM <span>research summary</span></a>
        <nav className="site-nav" aria-label="Page sections">
          <a href="#results">Results</a><a href="#method">Method</a><a href="#challenges">Challenges</a><a href="#demo">Demo</a>
        </nav>
        <a className="header-source" href={links.project} target="_blank" rel="noreferrer">Source repository ↗</a>
      </header>

      <main className="site-main" id="main">
        <section className="hero" id="top" aria-labelledby="page-title">
          <p className="eyebrow">Single-seed architecture study · 2026</p>
          <h1 id="page-title">How much attention does a small hybrid language model need?</h1>
          <p className="hero-lede">I compared three 16-layer Mamba-2/causal-attention models under the same tokenizer, data, optimizer schedule, and 700 million sampled training-token positions per model. I measured next-token quality, speed, persistent inference state, and long-context retrieval.</p>
          <div className="summary-grid" aria-label="Headline observations">
            <div><strong>26.301</strong><span>lowest best validation PPL</span><small>1:3 attention:SSM</small></div>
            <div><strong>20.66 MiB</strong><span>smallest logical state at 8K</span><small>1:15 attention:SSM</small></div>
            <div><strong>0</strong><span>exact needle matches at 2K–8K</span><small>all three variants</small></div>
          </div>
          <p className="metric-note">Matched token exposure is not matched FLOPs. Parameter counts span 52.53M–54.11M, and there is one training seed per ratio.</p>
        </section>

        <section className="section" id="results" aria-labelledby="results-title">
          <div className="section-head"><p className="eyebrow">01 / Results</p><h2 id="results-title">The measured trade-off</h2></div>
          <p className="section-intro">In these runs, 1:3 had the lowest sampled validation perplexity. At 8K, 1:15 used 66.3% less persistent state than 1:3, with a 0.212 higher perplexity. The differences are descriptive, not a multi-seed estimate.</p>
          <p className="mobile-table-hint">Scroll the table sideways to see both speed protocols →</p>
          <div className="table-wrap" role="region" aria-label="Measured results table" tabIndex={0}>
            <table className="results-table">
              <caption>One run per ratio. Lower PPL and state are better; higher rates are better.</caption>
              <thead><tr><th scope="col">Attention:SSM</th><th scope="col">Parameters</th><th scope="col">Best val PPL ↓</th><th scope="col">8K state MiB ↓</th><th scope="col">8K decode tok/s ↑</th><th scope="col">48-token generation tok/s ↑</th></tr></thead>
              <tbody>{ratioEvidence.map((item) => <tr key={item.ratio}>
                <th scope="row">{item.ratio} <small>({item.attentionLayers} attention)</small></th>
                <td>{(item.parameters / 1e6).toFixed(2)}M</td><td>{item.perplexity.toFixed(3)}</td>
                <td>{item.state8kMiB.toFixed(2)}</td><td>{item.decode8kTokensPerSecond.toFixed(2)}</td>
                <td>{item.generationTokensPerSecond.toFixed(2)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className="metric-note">Validation is a deterministic sample of 204,800 token positions per evaluation gate. The 8K rate is the median of three synchronized 32-step greedy decodes; the 48-token rate is median end-to-end sampled generation across three prompts on an RTX 5070, including prefill and sampling. Do not compare the two as the same benchmark.</p>
          <div className="analysis-grid">
            <div className="finding-list">
              <h3>How to read the results</h3>
              <p><strong>Quality:</strong> the best PPL spread is 0.212 (about 0.8% of 1:3), with no run-to-run variance estimate.</p>
              <p><strong>Memory:</strong> attention K/V grows with context; each Mamba layer holds fixed recurrent state. The calculated crossover between 1:3 and 1:15 is near 260 cached tokens.</p>
              <p><strong>Speed:</strong> 1:7 has the highest 8K decode rate (49.05 tok/s), while 1:3 leads the short 48-token generation protocol (52.32 tok/s). There is no single speed winner across tasks.</p>
              <p><strong>Capability:</strong> running an 8K sequence is not evidence of retrieving information from it. All variants failed the exact 2K+ needle trials.</p>
            </div>
            <StateFigure />
          </div>
          <p className="compact-source">Recorded tables: <a href={`${source}results/week3-700m-v1/sweep_table.md`} target="_blank" rel="noreferrer">training ↗</a> · <a href={`${source}results/week4-eval-v1/evaluation_table.md`} target="_blank" rel="noreferrer">8K evaluation ↗</a> · <a href={`${source}results/week5-generation-cuda-v1/generation_table.md`} target="_blank" rel="noreferrer">sampled generation ↗</a></p>
        </section>

        <section className="section" id="method" aria-labelledby="method-title">
          <div className="section-head"><p className="eyebrow">02 / Method and implementation</p><h2 id="method-title">How I built the comparison</h2></div>
          <div className="method-grid">{method.map((step) => <article className="method-step" key={step.number}>
            <span>{step.number}</span><h3>{step.title}</h3><p>{step.body}</p><a href={step.href} target="_blank" rel="noreferrer">Inspect {step.code} ↗</a>
          </article>)}</div>
          <div className="tool-list"><strong>Tools used</strong><p>PyTorch (model, SDPA attention, training, recurrent inference); Hugging Face Datasets and Tokenizers (corpus/BPE); NumPy memmap (token storage); FastAPI and SSE (optional live serving); pytest (model, data, resume, inference, and API tests); React, TypeScript, Vite, and GitHub Pages (this showcase).</p></div>
        </section>

        <section className="section" id="challenges" aria-labelledby="challenges-title">
          <div className="section-head"><p className="eyebrow">03 / Challenges and limits</p><h2 id="challenges-title">What did not go cleanly</h2></div>
          <div className="challenge-list">{challenges.map((challenge) => <article key={challenge.title}><h3>{challenge.title}</h3><p>{challenge.body}</p></article>)}</div>
          <div className="evidence-note"><strong>Claim boundary.</strong> This experiment compares three near-sized variants under matched sampled-token exposure. It does not isolate FLOPs, establish statistical superiority, validate production-quality language generation, or benchmark a fused Mamba kernel. Large checkpoints and the prepared corpus are not in the public repository.</div>
        </section>

        <section className="section" id="demo" aria-labelledby="demo-title">
          <div className="section-head"><p className="eyebrow">04 / Inspect a run</p><h2 id="demo-title">Recorded output, clearly labeled</h2></div>
          <p className="section-intro">The public site defaults to recorded evidence. Inspect one of nine saved completions below; if a compatible model API is configured and healthy, it can stream live tokens. Recorded text is never presented as a fresh response.</p>
          <div className="demo-panel"><GenerationLab ratio={ratio} onRatioChange={setRatio} /></div>
        </section>

        <section className="section source-section" id="sources" aria-labelledby="sources-title">
          <div className="section-head"><p className="eyebrow">Sources</p><h2 id="sources-title">Inspect the evidence</h2></div>
          <div className="source-links"><a href={links.project} target="_blank" rel="noreferrer">Model and experiment code ↗</a><a href={links.analysis} target="_blank" rel="noreferrer">Result artifacts ↗</a><a href={links.reference} target="_blank" rel="noreferrer">Detailed technical reference ↗</a></div>
        </section>
      </main>
      <footer className="site-footer"><span>Mamba hybrid LM · research summary</span><a href="#top">Back to top ↑</a></footer>
    </>
  )
}

export default App
