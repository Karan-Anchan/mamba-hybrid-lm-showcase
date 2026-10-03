import { layerPattern, ratioEvidence } from '../data/evidence'

export function LayerInstrument() {
  return <div className="layer-instrument" role="region" aria-label="All three hybrid architectures">
    <div className="instrument-head">
      <h3>Sixteen layers in each model. Attention becomes less frequent.</h3>
      <p>Read all three trained architectures together, from layer 1 to layer 16.</p>
    </div>
    <p className="layer-legend"><span><b className="layer-key attention">A</b> Attention · filled marker</span><span><b className="layer-key mamba">M</b> Mamba-2 · outlined marker</span></p>
    <div className="architecture-comparison">{ratioEvidence.map((variant) => {
      const pattern = layerPattern(variant.ratio)
      const attentionPositions = pattern.flatMap((kind, index) => kind === 'attention' ? [index + 1] : [])
      return <article className="architecture-row" key={variant.ratio} aria-label={`${variant.ratio} hybrid architecture`}>
        <div className="architecture-label"><h4>{variant.ratio}</h4><p>{variant.attentionLayers} attention / {variant.mambaLayers} Mamba-2</p><small>{(variant.parameters / 1e6).toFixed(2)}M parameters</small></div>
        <div className="architecture-pattern">
          <ol className="layer-strip" aria-label={`${variant.ratio} sixteen-layer pattern`}>
            {pattern.map((kind, index) => <li className={`layer-node ${kind}`} key={index}
              aria-label={`Layer ${index + 1}: ${kind === 'attention' ? 'causal attention' : 'Mamba-2'}`}>
              <span>{index + 1}</span><abbr title={kind === 'attention' ? 'Causal attention' : 'Mamba-2 state-space layer'}>{kind === 'attention' ? 'A' : 'M'}</abbr>
            </li>)}
          </ol>
          <p className="attention-positions"><b>Attention at {attentionPositions.length === 1 ? 'layer' : 'layers'} {attentionPositions.join(', ')}.</b> All other layers use Mamba-2.</p>
        </div>
      </article>
    })}</div>
    <p className="instrument-explanation"><b>Attention</b> keeps growing records of earlier text. <b>Mamba-2</b> updates a compact memory. These diagrams show architecture, not live model activity.</p>
    <p className="baseline-note">Attention-only and Mamba-only configurations are controls for future training comparisons. Their trained quality and speed results are not yet available.</p>
  </div>
}
