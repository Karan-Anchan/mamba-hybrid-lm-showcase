import { motion, useReducedMotion } from 'motion/react'
import { layerPattern, ratioEvidence, type Ratio } from '../data/evidence'

const branchDuration: Record<Ratio, number> = {
  '1:3': 3.4,
  '1:7': 4.8,
  '1:15': 6.2,
}

export function HeroRoutingDiagram({ ratio }: { ratio: Ratio }) {
  const reduceMotion = useReducedMotion()
  const pattern = layerPattern(ratio)
  const evidence = ratioEvidence.find((item) => item.ratio === ratio)!

  return (
    <motion.figure
      className="hero-routing"
      data-visual="hybrid-routing"
      aria-label={`${ratio} hybrid routing diagram: ${evidence.attentionLayers} attention ${evidence.attentionLayers === 1 ? 'layer' : 'layers'} and ${evidence.mambaLayers} Mamba-2 layers`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.25 }}
    >
      <figcaption>
        <span>HYBRID ROUTING / SCHEMATIC</span>
        <b>{ratio}</b>
      </figcaption>

      <svg className="routing-plot" viewBox="0 0 480 132" role="presentation" aria-hidden="true">
        <defs>
          <linearGradient id="recurrent-route" x1="0" x2="1">
            <stop offset="0" stopColor="var(--mint)" stopOpacity="0.2" />
            <stop offset="0.48" stopColor="var(--mint)" stopOpacity="0.95" />
            <stop offset="1" stopColor="var(--cyan)" stopOpacity="0.48" />
          </linearGradient>
          <linearGradient id="attention-route" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--cyan)" stopOpacity="0.3" />
            <stop offset="0.5" stopColor="var(--cyan)" />
            <stop offset="1" stopColor="var(--violet)" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <text className="routing-label" x="0" y="73">TOKENS</text>
        <text className="routing-label" x="424" y="73">LOGITS</text>
        <path className="routing-guide" d="M48 68H92C118 68 119 94 148 94H326C355 94 356 68 382 68H422" />
        <motion.path
          className="routing-line recurrent"
          d="M48 68H92C118 68 119 94 148 94H326C355 94 356 68 382 68H422"
          initial={reduceMotion ? false : { pathLength: 0.12 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <path className="routing-guide" d="M148 94C177 94 177 29 237 29S297 94 326 94" />
        <motion.path
          className="routing-line attention"
          d="M148 94C177 94 177 29 237 29S297 94 326 94"
          initial={reduceMotion ? false : { pathLength: 0.08 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.9, delay: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        />

        {[164, 205, 269, 310].map((x, index) => (
          <g className="state-node" key={x} transform={`translate(${x} 94)`}>
            <circle r="8" />
            <path d={index % 2 === 0 ? 'M-3 4C5 1-4-2 3-5' : 'M3 4C-5 1 4-2-3-5'} />
          </g>
        ))}
        <g className="attention-node" transform="translate(237 29)">
          <circle className="attention-halo" r="16" />
          <circle cx="0" cy="0" r="3.5" />
          <circle cx="-9" cy="7" r="2" />
          <circle cx="9" cy="7" r="2" />
          <path d="M-7.2 5.5-2.8 2M2.8 2 7.2 5.5" />
        </g>

        <circle className="terminal-node" cx="48" cy="68" r="4" />
        <circle className="terminal-node output" cx="422" cy="68" r="4" />
        {!reduceMotion && (
          <>
            <motion.circle
              className="routing-packet recurrent"
              r="3.6"
              animate={{
                cx: [48, 93, 148, 237, 326, 382, 422],
                cy: [68, 68, 94, 94, 94, 68, 68],
                opacity: [0, 1, 1, 1, 1, 1, 0],
              }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }}
            />
            <motion.circle
              key={ratio}
              className="routing-packet attention"
              r="4"
              animate={{
                cx: [148, 171, 197, 237, 277, 303, 326],
                cy: [94, 75, 43, 29, 43, 75, 94],
                opacity: [0, 0.85, 1, 1, 1, 0.85, 0],
              }}
              transition={{ duration: 2.3, repeat: Infinity, repeatDelay: branchDuration[ratio], ease: 'easeInOut' }}
            />
          </>
        )}
        <text className="routing-stage-label" x="237" y="8" textAnchor="middle">SPARSE GLOBAL LOOKUP</text>
        <text className="routing-stage-label" x="237" y="121" textAnchor="middle">RECURRENT STATE PATH</text>
      </svg>

      <div className="routing-pattern" aria-hidden="true">
        {pattern.map((kind, index) => (
          <motion.i
            key={`${ratio}-${index}`}
            className={kind}
            initial={reduceMotion ? false : { opacity: 0.25, scaleY: 0.35 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, delay: reduceMotion ? 0 : index * 0.018 }}
          />
        ))}
      </div>

      <div className="routing-readout">
        <span><i className="mamba" />{evidence.mambaLayers} recurrent</span>
        <span><i className="attention" />{evidence.attentionLayers} attention</span>
        <small>16 blocks</small>
      </div>
    </motion.figure>
  )
}
