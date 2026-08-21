import { useState } from 'react'
import { Cpu, Gauge, Lightning, Memory } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { ratioEvidence, runtimeComparison, stateCurves, type Ratio } from '../data/evidence'

type Metric = 'quality' | 'speed' | 'memory'

const metricConfig = {
  quality: { label: 'Perplexity', note: 'lower is better', value: (ratio: typeof ratioEvidence[number]) => ratio.perplexity, format: (value: number) => value.toFixed(3) },
  speed: { label: 'Generation', note: 'end-to-end tok/s', value: (ratio: typeof ratioEvidence[number]) => ratio.generationTokensPerSecond, format: (value: number) => value.toFixed(2) },
  memory: { label: '8K state', note: 'MiB · lower is better', value: (ratio: typeof ratioEvidence[number]) => ratio.state8kMiB, format: (value: number) => value.toFixed(2) },
} as const

const stateContexts = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192]

export function TradeoffChart() {
  const [metric, setMetric] = useState<Metric>('quality')
  const config = metricConfig[metric]
  const maximum = Math.max(...ratioEvidence.map(config.value))

  return (
    <article className="chart-card tradeoff-chart">
      <div className="chart-head">
        <div><span className="card-kicker"><Gauge size={16} /> Comparison surface</span><h3>{config.label}</h3><p>{config.note}</p></div>
        <div className="metric-tabs" aria-label="Chart metric">
          {(Object.keys(metricConfig) as Metric[]).map((item) => (
            <button type="button" key={item} className={item === metric ? 'active' : ''} onClick={() => setMetric(item)} aria-pressed={item === metric}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="ratio-bars">
        {ratioEvidence.map((variant) => {
          const value = config.value(variant)
          return (
            <div className="ratio-bar-row" key={variant.ratio}>
              <strong>{variant.ratio}</strong>
              <div className="ratio-bar-track">
                <motion.span
                  className={`ratio-bar-fill ratio-${variant.ratio.replace(':', '-')}`}
                  animate={{ width: `${100 * value / maximum}%` }}
                  transition={{ type: 'spring', stiffness: 170, damping: 24 }}
                />
              </div>
              <span>{config.format(value)}</span>
            </div>
          )
        })}
      </div>
      <p className="chart-caption">One training seed; matched data, token budget, optimizer, and generation prompts.</p>
    </article>
  )
}

function stateMiB(ratio: Ratio, context: number) {
  const curve = stateCurves[ratio]
  return (curve.fixedBytes + curve.kvBytesPerToken * context) / 2 ** 20
}

export function StateCrossoverChart() {
  const x = (context: number) => 60 + ((Math.log2(context) - 5) / 8) * 620
  const y = (mib: number) => 272 - (mib / 66) * 220
  const points = Object.fromEntries(
    ratioEvidence.map((variant) => [variant.ratio, stateContexts.map((context) => `${x(context)},${y(stateMiB(variant.ratio, context))}`).join(' ')]),
  ) as Record<Ratio, string>
  const crossoverX = x(259.857142857)

  return (
    <article className="chart-card crossover-card">
      <div className="chart-head compact">
        <div><span className="card-kicker"><Memory size={16} /> State equation</span><h3>The winner flips near 260 tokens</h3><p>Fixed recurrent state + linear attention KV.</p></div>
      </div>
      <svg className="crossover-chart" viewBox="0 0 740 330" role="img" aria-labelledby="cross-title cross-desc">
        <title id="cross-title">Logical state memory by cached context</title>
        <desc id="cross-desc">The 1:3 variant starts lowest, then crosses 1:15 around 260 tokens as attention KV memory grows.</desc>
        {[0, 16, 32, 48, 64].map((value) => <g key={value}><line x1="60" x2="680" y1={y(value)} y2={y(value)} /><text x="48" y={y(value) + 4} textAnchor="end">{value}</text></g>)}
        {stateContexts.map((context) => <g key={context}><line x1={x(context)} x2={x(context)} y1="52" y2="272" /><text x={x(context)} y="296" textAnchor="middle">{context < 1024 ? context : `${context / 1024}K`}</text></g>)}
        {ratioEvidence.map((variant) => <polyline key={variant.ratio} className={`curve ratio-${variant.ratio.replace(':', '-')}`} points={points[variant.ratio]} />)}
        <line className="crossover-line" x1={crossoverX} x2={crossoverX} y1="52" y2="272" />
        <text className="crossover-label" x={crossoverX + 8} y="72">≈260</text>
        <text className="axis-label" x="370" y="323" textAnchor="middle">cached tokens · log₂ scale</text>
        <text className="axis-label" transform="translate(15 168) rotate(-90)" textAnchor="middle">logical state · MiB</text>
      </svg>
      <div className="chart-legend">{ratioEvidence.map((variant) => <span key={variant.ratio}><i className={`ratio-${variant.ratio.replace(':', '-')}`} />{variant.ratio}</span>)}</div>
    </article>
  )
}

export function RuntimeChart() {
  const max = runtimeComparison.cuda.tokensPerSecond
  return (
    <article className="chart-card runtime-card">
      <div className="chart-head compact">
        <div><span className="card-kicker"><Cpu size={16} /> Local serving</span><h3>CPU is viable for the narrow demo</h3><p>Protocol-matched 1:3 · 48 generated tokens.</p></div>
      </div>
      {Object.entries(runtimeComparison).map(([key, runtime]) => (
        <div className="runtime-row" key={key}>
          <div><strong>{runtime.label}</strong><span>{runtime.ttftMs.toFixed(1)} ms TTFT</span></div>
          <div className="runtime-track"><span className={key} style={{ width: `${100 * runtime.tokensPerSecond / max}%` }} /></div>
          <b>{runtime.tokensPerSecond.toFixed(2)}<small> tok/s</small></b>
        </div>
      ))}
      <div className="runtime-callout"><Lightning size={18} weight="fill" /><span>Ryzen 7700 reaches <strong>77.3%</strong> of local RTX 5070 throughput. A two-core cloud CPU still needs separate measurement.</span></div>
    </article>
  )
}
