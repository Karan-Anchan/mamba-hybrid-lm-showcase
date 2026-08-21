import { ArrowRight, CirclesThreePlus, Pulse } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { layerPattern, ratioEvidence, type Ratio } from '../data/evidence'

export function LayerInstrument({ ratio, onRatioChange }: {
  ratio: Ratio
  onRatioChange: (ratio: Ratio) => void
}) {
  const pattern = layerPattern(ratio)
  const evidence = ratioEvidence.find((item) => item.ratio === ratio)!
  const reduceMotion = useReducedMotion()

  return (
    <div className="layer-instrument" aria-label={`${ratio} architecture instrument`}>
      <div className="instrument-head">
        <div>
          <span className="instrument-kicker"><Pulse size={14} weight="fill" /> Live architecture map</span>
          <strong>One stack. Three attention budgets.</strong>
        </div>
        <div className="segmented" aria-label="Architecture ratio">
          {ratioEvidence.map((variant) => (
            <button
              className={variant.ratio === ratio ? 'active' : ''}
              type="button"
              key={variant.ratio}
              onClick={() => onRatioChange(variant.ratio)}
              aria-pressed={variant.ratio === ratio}
            >
              {variant.ratio}
            </button>
          ))}
        </div>
      </div>

      <div className="layer-stage">
        <span className="edge-label">tokens</span>
        <ArrowRight className="stage-arrow" size={18} />
        <div className="layer-strip">
          {pattern.map((kind, index) => (
            <motion.div
              layout
              key={`${ratio}-${index}-${kind}`}
              className={`layer-node ${kind}`}
              data-motion="reroute-layer"
              initial={reduceMotion ? false : { opacity: 0.35, y: 12, scaleY: 0.82 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              transition={reduceMotion ? { duration: 0 } : {
                type: 'spring', stiffness: 260, damping: 24, delay: index * 0.018,
              }}
              title={`Layer ${index + 1}: ${kind === 'attention' ? 'causal attention' : 'Mamba-2'}`}
              aria-label={`Layer ${index + 1}, ${kind === 'attention' ? 'causal attention' : 'Mamba-2'}`}
            >
              {kind === 'attention' ? (
                <svg viewBox="0 0 22 40" aria-hidden="true">
                  <circle cx="5" cy="7" r="2" /><circle cx="17" cy="7" r="2" />
                  <circle cx="5" cy="33" r="2" /><circle cx="17" cy="33" r="2" />
                  <path d="M5 9 17 31M17 9 5 31" />
                </svg>
              ) : (
                <svg viewBox="0 0 22 40" aria-hidden="true">
                  <path d="M6 37c12-7 0-13 10-20C24 10 11 7 16 3" />
                </svg>
              )}
              <span>{index + 1}</span>
            </motion.div>
          ))}
        </div>
        <ArrowRight className="stage-arrow" size={18} />
        <span className="edge-label">logits</span>
      </div>

      <div className="instrument-legend">
        <span><i className="swatch mamba" /> Mamba-2 · recurrent state</span>
        <span><i className="swatch attention" /> Attention · global lookup</span>
      </div>

      <motion.div
        className="instrument-readout"
        key={ratio}
        initial={reduceMotion ? false : { opacity: 0.35 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.32 }}
      >
        <div className="readout-mark"><CirclesThreePlus size={21} /> {ratio}</div>
        <dl>
          <div><dt>attention</dt><dd>{evidence.attentionLayers}</dd></div>
          <div><dt>Mamba-2</dt><dd>{evidence.mambaLayers}</dd></div>
          <div><dt>parameters</dt><dd>{(evidence.parameters / 1e6).toFixed(2)}M</dd></div>
          <div><dt>8K state</dt><dd>{evidence.state8kMiB.toFixed(2)} MiB</dd></div>
        </dl>
      </motion.div>
    </div>
  )
}
