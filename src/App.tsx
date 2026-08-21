import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowDown, ArrowRight, ArrowSquareOut, Brain, ChartLineUp, Check,
  Circuitry, Code, Database, GithubLogo, Info, Moon, ShieldCheck, Sparkle,
  Sun, TerminalWindow, Warning,
} from '@phosphor-icons/react'
import { motion, useScroll, useSpring } from 'motion/react'
import { RuntimeChart, StateCrossoverChart, TradeoffChart } from './components/EvidenceCharts'
import { GenerationLab } from './components/GenerationLab'
import { LayerInstrument } from './components/LayerInstrument'
import { Reveal } from './components/Reveal'
import { findings, links, ratioEvidence, type Ratio } from './data/evidence'

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem('mamba-showcase-theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function SectionHeading({ index, icon, kicker, title, body }: {
  index: string
  icon: ReactNode
  kicker: string
  title: string
  body: string
}) {
  return (
    <Reveal className="section-heading">
      <span className="section-index">{index}</span>
      <div className="section-title">
        <span className="section-kicker">{icon}{kicker}</span>
        <h2>{title}</h2>
      </div>
      <p>{body}</p>
    </Reveal>
  )
}

function ArchitectureFlow() {
  const stages = [
    { icon: <Database />, step: '01', title: '16K BPE tokenizer', body: 'Prompt text becomes bounded token IDs.' },
    { icon: <Circuitry />, step: '02', title: '448-wide embedding', body: 'A shared representation enters 16 hybrid blocks.' },
    { icon: <Brain />, step: '03', title: 'Mamba + attention', body: 'The ratio changes mixer placement, not the training protocol.' },
    { icon: <TerminalWindow />, step: '04', title: 'Recurrent decode', body: 'Prefill once, then update typed state one token at a time.' },
    { icon: <Code />, step: '05', title: 'FastAPI → interface', body: 'Serialized SSE events carry tokens and measured runtime data.' },
  ]
  return (
    <div className="flow-grid">
      {stages.map((stage, index) => (
        <div className="flow-stage" key={stage.step}>
          <span className="flow-number">STEP / {stage.step}</span>
          <i>{stage.icon}</i>
          <strong>{stage.title}</strong>
          <p>{stage.body}</p>
          {index < stages.length - 1 && <ArrowRight className="flow-arrow" aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}

function App() {
  const [ratio, setRatio] = useState<Ratio>('1:3')
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 150, damping: 28, restDelta: 0.001 })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('mamba-showcase-theme', theme)
    let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!themeColor) {
      themeColor = document.createElement('meta')
      themeColor.name = 'theme-color'
      document.head.append(themeColor)
    }
    themeColor.content = theme === 'dark' ? '#090a0b' : '#ebe8de'
  }, [theme])

  return (
    <>
      <a className="skip-link" href="#main">Skip to the experiment</a>
      <motion.div className="reading-progress" style={{ scaleX: progress }} aria-hidden="true" />

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="Mamba Hybrid LM home">
            <img src={`${import.meta.env.BASE_URL}assets/project-emblem.png`} alt="" />
            <span><strong>MAMBA / HYBRID</strong><small>research artifact 02</small></span>
          </a>
          <nav aria-label="Primary navigation">
            <a href="#experiment"><span>01</span>Ratios</a>
            <a href="#lab"><span>02</span>Lab</a>
            <a href="#evidence"><span>03</span>Evidence</a>
            <a href="#system"><span>04</span>System</a>
          </nav>
          <div className="header-actions">
            <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a className="source-button" href={links.project} target="_blank" rel="noreferrer"><GithubLogo size={18} /> <span>View source</span></a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <aside className="hero-rail" aria-hidden="true">
            <span>PROJECT / 02</span>
            <b>SSM<br />×<br />ATTN</b>
            <span>RTX / 5070</span>
          </aside>

          <div className="hero-copy">
            <div className="hero-status">
              <span><i /> Certified evidence</span>
              <span>16 layers</span>
              <span>700M tokens × 3</span>
            </div>
            <p className="hero-overline">Selective state meets sparse global lookup.</p>
            <h1 aria-label="How much attention does a small language model actually need?"><span>How much </span><span className="attention-word">attention </span><span>does a small LM need?</span></h1>
            <p className="hero-lede">A controlled study of three Mamba-2 / attention ratios—measured across quality, generation speed, and 8K state memory.</p>
            <div className="hero-actions">
              <a className="primary-cta" href="#lab">Enter the inference lab <ArrowDown size={17} /></a>
              <a className="secondary-cta" href={links.analysis} target="_blank" rel="noreferrer">Read the analysis <ArrowSquareOut size={16} /></a>
            </div>
            <div className="hero-proof">
              <span><ShieldCheck size={17} weight="fill" /> Checksummed</span>
              <span><ChartLineUp size={17} weight="fill" /> Protocol matched</span>
              <span><Check size={17} weight="bold" /> 8K executed</span>
            </div>
          </div>

          <div className="hero-instrument">
            <span className="instrument-coordinate">FIG. 01 / LIVE LAYER TOPOLOGY</span>
            <LayerInstrument ratio={ratio} onRatioChange={setRatio} />
          </div>

          <div className="hero-folio" aria-hidden="true"><span>HYB—02</span><span>BER / 2026</span></div>
        </section>

        <section className="research-strip" aria-label="Headline experiment metrics">
          <span className="strip-label">MEASURED<br />SIGNALS</span>
          <div><small>best perplexity</small><strong>26.301</strong><span>ratio / 1:3</span></div>
          <div><small>sampled generation</small><strong>52.32</strong><span>tok/s / 1:3</span></div>
          <div><small>smallest 8K state</small><strong>20.66</strong><span>MiB / 1:15</span></div>
          <div><small>fixed token budget</small><strong>700M</strong><span>each variant</span></div>
        </section>

        <section className="section experiment-section" id="experiment">
          <SectionHeading
            index="01"
            icon={<Sparkle size={16} weight="fill" />}
            kicker="The controlled variable"
            title="One stack. Three attention budgets."
            body="Depth, data, optimizer, batch geometry, and token exposure stay fixed. Only causal-attention placement changes."
          />
          <Reveal className="variant-cards">
            {ratioEvidence.map((variant, index) => (
              <button type="button" aria-label={`Explore ${variant.ratio} attention to SSM ratio`} className={`variant-card ratio-theme-${index + 1} ${ratio === variant.ratio ? 'active' : ''}`} key={variant.ratio} onClick={() => setRatio(variant.ratio)}>
                <span className="variant-index">MODEL / 0{index + 1}</span>
                <span className="variant-top">
                  <b>{variant.ratio}</b>
                  <small>attention : SSM</small>
                </span>
                <span className="variant-stack">{variant.attentionLayers}A <i /> {variant.mambaLayers}M</span>
                <dl>
                  <div><dt>PPL ↓</dt><dd>{variant.perplexity.toFixed(3)}</dd></div>
                  <div><dt>GEN ↑</dt><dd>{variant.generationTokensPerSecond.toFixed(2)}<small> tok/s</small></dd></div>
                  <div><dt>8K STATE ↓</dt><dd>{variant.state8kMiB.toFixed(2)}<small> MiB</small></dd></div>
                </dl>
                <span className="variant-select">Route this topology <ArrowRight size={15} /></span>
              </button>
            ))}
          </Reveal>
        </section>

        <section className="section lab-section" id="lab">
          <div className="section-watermark" aria-hidden="true">RUN</div>
          <Reveal><GenerationLab key={ratio} ratio={ratio} onRatioChange={setRatio} /></Reveal>
        </section>

        <section className="section evidence-section" id="evidence">
          <SectionHeading
            index="03"
            icon={<ChartLineUp size={16} weight="fill" />}
            kicker="Measured evidence"
            title="The trade-off changes with context."
            body="Every chart is rendered from committed training and evaluation evidence. Exact labels stay visible without hover."
          />
          <Reveal className="chart-layout"><TradeoffChart /><StateCrossoverChart /><RuntimeChart /></Reveal>
          <Reveal className="finding-grid">
            {findings.map((finding, index) => (
              <article key={finding.label} className={`finding-card finding-${index + 1}`}>
                <span className="finding-index">0{index + 1}</span>
                <strong>{finding.value}</strong>
                <span>{finding.label}</span>
                <p>{finding.body}</p>
              </article>
            ))}
          </Reveal>
        </section>

        <section className="section system-section" id="system">
          <SectionHeading
            index="04"
            icon={<Circuitry size={16} weight="fill" />}
            kicker="End-to-end system"
            title="Prompt in. Recurrent state forward. Evidence out."
            body="Benchmarks and HTTP requests share the same generator. The service adds verification, serialization, streaming, and safe failure handling."
          />
          <Reveal><ArchitectureFlow /></Reveal>
          <Reveal className="boundary-grid">
            <article className="boundary-card proves">
              <span><Check size={18} weight="bold" /> Supported by this study</span>
              <ul>
                <li>1:3 wins quality and short generation in this run.</li>
                <li>1:15 cuts 8K logical state by 66.3% versus 1:3.</li>
                <li>The state-memory ordering crosses near 260 cached tokens.</li>
                <li>All variants execute recurrent inference through 8K.</li>
              </ul>
            </article>
            <article className="boundary-card limits">
              <span><Warning size={18} weight="fill" /> Outside the evidence</span>
              <ul>
                <li>Long-context retrieval quality: all variants failed at 2K and beyond.</li>
                <li>Universal ratio rankings: this is one training seed.</li>
                <li>Production factuality: sampled text can drift or repeat.</li>
                <li>Fused-kernel Mamba claims: the implementation is pure PyTorch SSD.</li>
              </ul>
            </article>
          </Reveal>
        </section>

        <section className="closing-section">
          <Reveal className="closing-card">
            <span className="closing-folio">05 / TRACE</span>
            <div>
              <span className="section-kicker"><Info size={16} weight="fill" /> Follow the evidence</span>
              <h2>Inspect the model behind the surface.</h2>
              <p>The interface is the front door. Implementation, checksummed results, failures, and the full technical explanation stay inspectable.</p>
            </div>
            <div className="closing-links">
              <a href={links.project} target="_blank" rel="noreferrer"><span>01</span><GithubLogo size={19} /> Project repository <ArrowSquareOut /></a>
              <a href={links.analysis} target="_blank" rel="noreferrer"><span>02</span><ChartLineUp size={19} /> Evaluation analysis <ArrowSquareOut /></a>
              <a href={links.reference} target="_blank" rel="noreferrer"><span>03</span><Brain size={19} /> Technical reference <ArrowSquareOut /></a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer>
        <div className="footer-brand"><img src={`${import.meta.env.BASE_URL}assets/project-emblem.png`} alt="" /><span><strong>MAMBA / HYBRID LM</strong><small>Project 02 · SOTA Roadmap 2026</small></span></div>
        <p>Measured honestly—including the parts that did not work.</p>
        <span className="footer-version">SHOWCASE / V0.2</span>
      </footer>
    </>
  )
}

export default App
