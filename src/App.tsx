import { useEffect, useState } from 'react'
import {
  ArrowDown, ArrowRight, ArrowSquareOut, Brain, ChartLineUp, Check,
  Circuitry, Code, Database, GithubLogo, Info, Moon, ShieldCheck, Sparkle,
  Sun, TerminalWindow, Warning,
} from '@phosphor-icons/react'
import { motion } from 'motion/react'
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
          <span className="flow-number">{stage.step}</span>
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('mamba-showcase-theme', theme)
  }, [theme])

  return (
    <>
      <a className="skip-link" href="#main">Skip to the experiment</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Mamba Hybrid LM home">
          <img src={`${import.meta.env.BASE_URL}assets/project-emblem.png`} alt="" />
          <span><strong>Mamba Hybrid</strong><small>experiment / 02</small></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#experiment">Experiment</a>
          <a href="#lab">Generation lab</a>
          <a href="#evidence">Evidence</a>
          <a href="#system">System</a>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a className="source-button" href={links.project} target="_blank" rel="noreferrer"><GithubLogo size={18} /> <span>Source</span></a>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <motion.div className="hero-orb orb-one" animate={{ x: [0, 18, 0], y: [0, -14, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="hero-orb orb-two" animate={{ x: [0, -12, 0], y: [0, 16, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="hero-copy">
            <div className="hero-status"><span><i /> Experiment showcase</span><span>52–54M parameters</span><span>RTX 5070 study</span></div>
            <h1>How much <span>attention</span> does a small language model actually need?</h1>
            <p className="hero-lede">Three Mamba-2/attention ratios. One matched 700M-token budget. A measured look at quality, generation speed, and long-context state memory.</p>
            <div className="hero-actions">
              <a className="primary-cta" href="#lab">Try the generation lab <ArrowDown size={17} /></a>
              <a className="secondary-cta" href={links.analysis} target="_blank" rel="noreferrer">Inspect raw analysis <ArrowSquareOut size={16} /></a>
            </div>
            <div className="hero-proof">
              <span><ShieldCheck size={17} weight="fill" /> Checksummed checkpoints</span>
              <span><ChartLineUp size={17} weight="fill" /> Protocol-matched metrics</span>
              <span><Check size={17} weight="bold" /> 8K execution verified</span>
            </div>
          </div>
          <div className="hero-instrument"><LayerInstrument ratio={ratio} onRatioChange={setRatio} /></div>
        </section>

        <section className="research-strip" aria-label="Headline experiment metrics">
          <div><small>best perplexity</small><strong>26.301</strong><span>1:3</span></div>
          <div><small>sampled generation</small><strong>52.32</strong><span>tok/s · 1:3</span></div>
          <div><small>smallest 8K state</small><strong>20.66</strong><span>MiB · 1:15</span></div>
          <div><small>fixed token budget</small><strong>700M</strong><span>each variant</span></div>
        </section>

        <section className="section experiment-section" id="experiment">
          <Reveal className="section-heading split-heading">
            <div><span className="section-kicker"><Sparkle size={17} weight="fill" /> The experiment</span><h2>Change one structural choice. Measure what moves.</h2></div>
            <p>The stack depth, dataset, optimizer, batch geometry, and token exposure stay fixed. Only the placement of causal-attention and Mamba-2 mixers changes.</p>
          </Reveal>
          <Reveal className="variant-cards">
            {ratioEvidence.map((variant) => (
              <button type="button" className={`variant-card ${ratio === variant.ratio ? 'active' : ''}`} key={variant.ratio} onClick={() => setRatio(variant.ratio)}>
                <span className="variant-top"><b>{variant.ratio}</b><small>{variant.attentionLayers} attention · {variant.mambaLayers} Mamba</small></span>
                <dl>
                  <div><dt>PPL</dt><dd>{variant.perplexity.toFixed(3)}</dd></div>
                  <div><dt>gen</dt><dd>{variant.generationTokensPerSecond.toFixed(2)}<small> tok/s</small></dd></div>
                  <div><dt>8K state</dt><dd>{variant.state8kMiB.toFixed(2)}<small> MiB</small></dd></div>
                </dl>
                <span className="variant-select">Explore ratio <ArrowRight size={15} /></span>
              </button>
            ))}
          </Reveal>
        </section>

        <section className="section lab-section" id="lab">
          <Reveal><GenerationLab key={ratio} ratio={ratio} onRatioChange={setRatio} /></Reveal>
        </section>

        <section className="section evidence-section" id="evidence">
          <Reveal className="section-heading split-heading">
            <div><span className="section-kicker"><ChartLineUp size={17} weight="fill" /> Measured evidence</span><h2>The trade-off is real—and context dependent.</h2></div>
            <p>These charts are rendered from the committed training and evaluation evidence. Hover-free labels keep every exact comparison readable on touch screens.</p>
          </Reveal>
          <Reveal className="chart-layout"><TradeoffChart /><StateCrossoverChart /><RuntimeChart /></Reveal>
          <Reveal className="finding-grid">
            {findings.map((finding, index) => <article key={finding.label} className={`finding-card finding-${index + 1}`}><strong>{finding.value}</strong><span>{finding.label}</span><p>{finding.body}</p></article>)}
          </Reveal>
        </section>

        <section className="section system-section" id="system">
          <Reveal className="section-heading split-heading">
            <div><span className="section-kicker"><Circuitry size={17} weight="fill" /> End-to-end system</span><h2>From prompt text to a measured browser response.</h2></div>
            <p>The same recurrent generation function powers benchmarks and HTTP requests. The service adds verification, serialization, streaming, and friendly failure handling.</p>
          </Reveal>
          <Reveal><ArchitectureFlow /></Reveal>
          <Reveal className="boundary-grid">
            <article className="boundary-card proves">
              <span><Check size={18} weight="bold" /> What the study supports</span>
              <ul>
                <li>1:3 is the quality and short-generation winner in this run.</li>
                <li>1:15 cuts 8K logical state by 66.3% versus 1:3.</li>
                <li>The state-memory ordering crosses near 260 cached tokens.</li>
                <li>All variants execute recurrent inference through 8K.</li>
              </ul>
            </article>
            <article className="boundary-card limits">
              <span><Warning size={18} weight="fill" /> What it does not support</span>
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
            <div><span className="section-kicker"><Info size={17} weight="fill" /> Go deeper</span><h2>The showcase is the front door. The evidence stays inspectable.</h2><p>Open the implementation, the checksummed result bundle, or the information-heavy technical reference.</p></div>
            <div className="closing-links">
              <a href={links.project} target="_blank" rel="noreferrer"><GithubLogo size={19} /> Project repository <ArrowSquareOut /></a>
              <a href={links.analysis} target="_blank" rel="noreferrer"><ChartLineUp size={19} /> Evaluation analysis <ArrowSquareOut /></a>
              <a href={links.reference} target="_blank" rel="noreferrer"><Brain size={19} /> Technical reference <ArrowSquareOut /></a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer>
        <div className="footer-brand"><img src={`${import.meta.env.BASE_URL}assets/project-emblem.png`} alt="" /><span><strong>Mamba Hybrid LM</strong><small>Project 2 · SOTA Roadmap 2026</small></span></div>
        <p>Designed around measured behavior, including the parts that did not work.</p>
        <span className="footer-version">showcase / v0.1</span>
      </footer>
    </>
  )
}

export default App
