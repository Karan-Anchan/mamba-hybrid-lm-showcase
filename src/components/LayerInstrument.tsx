import { layerPattern, ratioEvidence, type Ratio } from '../data/evidence'

export function LayerInstrument({ ratio, onRatioChange }: {
  ratio: Ratio
  onRatioChange: (ratio: Ratio) => void
}) {
  const evidence = ratioEvidence.find((item) => item.ratio === ratio)!
  return <div className="layer-instrument" aria-label="Interactive architecture map">
    <div className="instrument-head">
      <div><h3>Keep sixteen layers. Change how often attention appears.</h3><p>Select a ratio to inspect the exact layer placement used in that run.</p></div>
      <div className="architecture-ratios" role="group" aria-label="Architecture ratio">
        {ratioEvidence.map((variant) => <button key={variant.ratio} type="button"
          aria-label={`Show ${variant.ratio} layer placement`} aria-pressed={variant.ratio === ratio}
          onClick={() => onRatioChange(variant.ratio)}>{variant.ratio}</button>)}
      </div>
    </div>
    <ol className="layer-strip" aria-label={`${ratio} sixteen-layer pattern`}>
      {layerPattern(ratio).map((kind, index) => <li className={`layer-node ${kind}`} key={index}
        title={`Layer ${index + 1}: ${kind === 'attention' ? 'causal attention' : 'Mamba-2'}`}>
        <span>{index + 1}</span><abbr title={kind === 'attention' ? 'Causal attention' : 'Mamba-2 state-space layer'}>{kind === 'attention' ? 'A' : 'M'}</abbr>
      </li>)}
    </ol>
    <div className="instrument-readout" aria-live="polite"><strong>{evidence.attentionLayers} attention / {evidence.mambaLayers} Mamba-2</strong><span>{(evidence.parameters / 1e6).toFixed(2)}M parameters</span></div>
    <p className="instrument-explanation"><b>A — attention</b> keeps growing records of earlier text. <b>M — Mamba-2</b> updates a compact memory. The map shows the architecture, not live model activity. The measured result table reports the trade-off.</p>
  </div>
}
