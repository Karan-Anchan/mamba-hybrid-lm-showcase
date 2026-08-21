import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowDown, ArrowRight, ArrowSquareOut, Brain, ChartLineUp, Check,
  Circuitry, Code, Database, GithubLogo, Moon, ShieldCheck, Sun,
  TerminalWindow, Warning,
} from '@phosphor-icons/react'
import { motion, useScroll, useSpring } from 'motion/react'
import { RuntimeChart, StateCrossoverChart, TradeoffChart } from './components/EvidenceCharts'
import { GenerationLab } from './components/GenerationLab'
import { LayerInstrument } from './components/LayerInstrument'
import { PhasePortrait } from './components/PhasePortrait'
import { Reveal } from './components/Reveal'
import { findings, links, ratioEvidence, type Ratio } from './data/evidence'

type Theme = 'dark' | 'light'

const ratioClaims = ['quality optimum', 'intermediate condition', '8K state optimum']

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem('mamba-showcase-theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function ObservationHeading({ index, icon, kicker, title, body }: {
  index: string
  icon: ReactNode
  kicker: string
  title: string
  body: string
}) {
  return (
    <Reveal className="observation-heading">
      <span className="observation-index">OBS / {index}</span>
      <div>
        <span className="observation-kicker">{icon}{kicker}</span>
        <h2>{title}</h2>
      </div>
      <p>{body}</p>
    </Reveal>
  )
}

function ArchitectureFlow() {
  const stages = [
    { icon: <Database />, step: '01', title: 'Tokenize', body: '16K BPE maps text to bounded token IDs.' },
    { icon: <Circuitry />, step: '02', title: 'Embed', body: '448-wide vectors enter sixteen residual blocks.' },
    { icon: <Brain />, step: '03', title: 'Mix', body: 'Only Mamba-2 versus attention placement changes.' },
    { icon: <TerminalWindow />, step: '04', title: 'Decode', body: 'Prefill once; update typed recurrent state per token.' },
    { icon: <Code />, step: '05', title: 'Stream', body: 'FastAPI serializes SSE tokens and measured runtime data.' },
  ]
  return (
    <div className="flow-sequence">
      {stages.map((stage, index) => (
        <div className="flow-step" key={stage.step}>
          <span>{stage.step}</span>
          <i>{stage.icon}</i>
          <strong>{stage.title}</strong>
          <p>{stage.body}</p>
          {index < stages.length - 1 && <ArrowRight aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}

function App() {
  const [ratio, setRatio] = useState<Ratio>('1:3')
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 25, restDelta: 0.001 })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('mamba-showcase-theme', theme)
    let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!themeColor) {
      themeColor = document.createElement('meta')
      themeColor.name = 'theme-color'
      document.head.append(themeColor)
    }
    themeColor.content = theme === 'dark' ? '#05050a' : '#f2efe4'
  }, [theme])

  return (
    <>
      <a className="skip-link" href="#main">Skip to the experiment</a>
      <motion.div className="reading-progress" style={{ scaleY: progress }} aria-hidden="true" />

      <header className="observatory-rail">
        <a className="observatory-mark" href="#top" aria-label="Mamba Hybrid LM home">
          <img src={`${import.meta.env.BASE_URL}assets/project-emblem.png`} alt="" />
          <span>HYB<br />02</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#ratios" aria-label="Ratios"><b>01</b><span>Ratios</span></a>
          <a href="#lab" aria-label="Lab"><b>02</b><span>Lab</span></a>
          <a href="#evidence" aria-label="Evidence"><b>03</b><span>Evidence</span></a>
          <a href="#system" aria-label="System"><b>04</b><span>System</span></a>
        </nav>
        <div className="rail-actions">
          <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a href={links.project} target="_blank" rel="noreferrer" aria-label="Open project source"><GithubLogo size={19} /></a>
        </div>
      </header>

      <main id="main" className="observatory-main">
        <section className="observatory-hero" id="top">
          <div className="hero-atmosphere" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}assets/state-phase-field-v1.webp`} alt="" />
            <PhasePortrait ratio={ratio} />
            <div className="hero-scan" />
          </div>

          <div className="hero-protocol">
            <span>FIXED-COMPUTE ABLATION</span>
            <span>N = 3 MODELS</span>
            <span>N = 1 SEED</span>
            <span>700M POSITIONS / MODEL</span>
          </div>

          <div className="hero-title-block">
            <span className="hero-folio">PROJECT 02 / HYBRID SEQUENCE MODELS</span>
            <h1 aria-label="Attention under constraint">
              <span>Attention</span>
              <em>under</em>
              <span>constraint.</span>
            </h1>
            <p className="research-question">At fixed compute, how does attention frequency alter validation perplexity, recurrent decode rate, and 8K state memory?</p>
          </div>

          <div className="hero-conclusion">
            <span>PRIMARY RESULT</span>
            <strong>More attention won quality.<br />Less attention won state memory.</strong>
            <dl>
              <div><dt>best PPL</dt><dd>26.301 <small>/ 1:3</small></dd></div>
              <div><dt>best decode</dt><dd>52.32 <small>tok/s / 1:3</small></dd></div>
              <div><dt>smallest 8K state</dt><dd>20.66 <small>MiB / 1:15</small></dd></div>
            </dl>
          </div>

          <div className="hero-controls" aria-label="Select architecture ratio">
            {ratioEvidence.map((variant) => (
              <button type="button" key={variant.ratio} className={ratio === variant.ratio ? 'active' : ''} onClick={() => setRatio(variant.ratio)} aria-pressed={ratio === variant.ratio}>
                <span>{variant.ratio}</span><small>{variant.attentionLayers}A / {variant.mambaLayers}M</small>
              </button>
            ))}
          </div>

          <div className="hero-actions">
            <a href="#lab">Run measured replay <ArrowDown /></a>
            <a href={links.analysis} target="_blank" rel="noreferrer">Open analysis <ArrowSquareOut /></a>
          </div>

          <div className="visual-disclosure">
            <i /> Illustrative phase field—not model activations.
          </div>
        </section>

        <section className="telemetry-band" aria-label="Experiment protocol">
          <div><span>MODEL</span><strong>52–54M</strong><small>parameters</small></div>
          <div><span>STACK</span><strong>16</strong><small>hybrid blocks</small></div>
          <div><span>WIDTH</span><strong>448</strong><small>d_model</small></div>
          <div><span>DEVICE</span><strong>5070</strong><small>12 GB RTX</small></div>
          <div><span>NUMERIC</span><strong>BF16</strong><small>mixed precision</small></div>
        </section>

        <section className="ratio-section" id="ratios">
          <ObservationHeading
            index="01"
            icon={<Circuitry size={16} />}
            kicker="Controlled architecture ablation"
            title="Attention frequency is the only structural variable."
            body="Depth, width, tokenizer, data order, optimizer, batch geometry, and sampled positions are fixed. Mixer placement changes."
          />

          <Reveal className="ratio-atlas">
            {ratioEvidence.map((variant, index) => (
              <button
                type="button"
                aria-label={`Explore ${variant.ratio} attention to SSM ratio`}
                className={`ratio-specimen specimen-${index + 1} ${ratio === variant.ratio ? 'active' : ''}`}
                key={variant.ratio}
                onClick={() => setRatio(variant.ratio)}
              >
                <span className="specimen-number">0{index + 1}</span>
                <span className="specimen-ratio">{variant.ratio}</span>
                <span className="specimen-claim">{ratioClaims[index]}</span>
                <span className="specimen-mix">{variant.attentionLayers} attention / {variant.mambaLayers} Mamba-2</span>
                <dl>
                  <div><dt>PPL ↓</dt><dd>{variant.perplexity.toFixed(3)}</dd></div>
                  <div><dt>DECODE ↑</dt><dd>{variant.generationTokensPerSecond.toFixed(2)} <small>tok/s</small></dd></div>
                  <div><dt>8K STATE ↓</dt><dd>{variant.state8kMiB.toFixed(2)} <small>MiB</small></dd></div>
                </dl>
                <ArrowRight />
              </button>
            ))}
          </Reveal>

          <Reveal className="topology-observatory">
            <div className="topology-label">
              <span>LIVE TOPOLOGY / {ratio}</span>
              <p>Exact sixteen-layer placement. Select a ratio to reroute the stack.</p>
            </div>
            <LayerInstrument ratio={ratio} onRatioChange={setRatio} />
          </Reveal>
        </section>

        <section className="lab-section" id="lab">
          <div className="lab-marquee" aria-hidden="true">INFERENCE / INFERENCE / INFERENCE /</div>
          <Reveal><GenerationLab key={ratio} ratio={ratio} onRatioChange={setRatio} /></Reveal>
        </section>

        <section className="evidence-section" id="evidence">
          <ObservationHeading
            index="03"
            icon={<ChartLineUp size={16} />}
            kicker="committed evaluation evidence"
            title="The optimum depends on context length."
            body="1:3 leads quality and short decode. 1:15 minimizes long-context logical state. The memory ordering crosses near 260 cached tokens."
          />
          <Reveal className="chart-layout"><TradeoffChart /><StateCrossoverChart /><RuntimeChart /></Reveal>
          <Reveal className="finding-sequence">
            {findings.map((finding, index) => (
              <article key={finding.label}>
                <span>F{index + 1}</span>
                <strong>{finding.value}</strong>
                <h3>{finding.label}</h3>
                <p>{finding.body}</p>
              </article>
            ))}
          </Reveal>
        </section>

        <section className="system-section" id="system">
          <ObservationHeading
            index="04"
            icon={<TerminalWindow size={16} />}
            kicker="Execution path"
            title="One generator. Two execution surfaces."
            body="Benchmarks and HTTP requests call the same recurrent generator. The service adds verification, serialization, streaming, and bounded failure handling."
          />
          <Reveal><ArchitectureFlow /></Reveal>
          <Reveal className="evidence-boundary">
            <article>
              <span><Check /> Supported</span>
              <ul>
                <li>1:3 is the best quality and short-generation condition in this run.</li>
                <li>1:15 reduces 8K logical state by 66.3% versus 1:3.</li>
                <li>All variants execute recurrent inference through 8K.</li>
              </ul>
            </article>
            <article>
              <span><Warning /> Not supported</span>
              <ul>
                <li>Retrieval success at 2K–8K; every checkpoint failed the exact needle test.</li>
                <li>Universal ratio rankings; the sweep uses one seed.</li>
                <li>Fused-kernel claims; the SSM path is pure PyTorch SSD.</li>
              </ul>
            </article>
          </Reveal>
        </section>

        <section className="closing-section">
          <div className="closing-emblem" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}assets/project-emblem.png`} alt="" /></div>
          <Reveal className="closing-copy">
            <span>REPRODUCIBILITY / 05</span>
            <h2>Read the evidence.<br /><em>Reproduce the run.</em></h2>
            <p>Source, checksummed results, failure boundaries, and the complete technical reconstruction remain public and inspectable.</p>
          </Reveal>
          <Reveal className="closing-links">
            <a href={links.project} target="_blank" rel="noreferrer"><span>01</span>Source repository <ArrowSquareOut /></a>
            <a href={links.analysis} target="_blank" rel="noreferrer"><span>02</span>Evaluation analysis <ArrowSquareOut /></a>
            <a href={links.reference} target="_blank" rel="noreferrer"><span>03</span>Technical reference <ArrowSquareOut /></a>
          </Reveal>
        </section>
      </main>

      <footer className="observatory-footer">
        <div><ShieldCheck weight="fill" /><span>Checksummed checkpoints / protocol-matched evidence</span></div>
        <p>Project 02 · Small Mamba–Transformer Hybrid LM</p>
        <span>OBSERVATORY / V0.3</span>
      </footer>
    </>
  )
}

export default App
