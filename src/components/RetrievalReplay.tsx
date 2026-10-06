import { useState } from 'react'
import evidence from '../data/retrievalReplay.json'

const source = `https://github.com/Karan-Anchan/mamba-hybrid-lm/blob/${evidence.source.publication_commit}/`
const positionNames = ['Early · 10%', 'Middle · 50%', 'Late · 90%']

export function RetrievalReplay() {
  const [length, setLength] = useState(512)
  const [depth, setDepth] = useState(0.5)
  const selected = evidence.variants.map((variant) => ({
    ...variant,
    trial: variant.trials.find((trial) => trial.context_length === length && trial.requested_depth === depth)!,
  }))
  const trial = selected[0].trial

  return (
    <section className="section retrieval-replay" id="retrieval" aria-labelledby="retrieval-title">
      <div className="section-head"><p className="eyebrow">05 / Hidden-fact replay</p><h2 id="retrieval-title">Can they recover one hidden word?</h2></div>
      <p className="section-intro">An access code was planted among repeated research notes. Each model read the same document and then completed the answer. Choose a recorded trial to see all three results together.</p>
      <div className="retrieval-controls">
        <label htmlFor="retrieval-length">Document length <select id="retrieval-length" value={length} onChange={(event) => setLength(Number(event.target.value))}>
          {evidence.protocol.context_lengths.map((context) => <option key={context} value={context}>{context.toLocaleString('en-US')} tokens</option>)}
        </select></label>
        <fieldset><legend>Requested clue position</legend><div>{evidence.protocol.needle_depths.map((position, index) => <button key={position} aria-pressed={depth === position} onClick={() => setDepth(position)}>{positionNames[index]}</button>)}</div></fieldset>
      </div>
      <div className="retrieval-document" aria-label="Illustration of the recorded clue position">
        <div className="retrieval-document-head"><span>Start of document</span><span>Question at the end</span></div>
        <div className="retrieval-track" aria-hidden="true"><span style={{ left: `${trial.actual_depth * 100}%` }}>Clue</span></div>
        <p className="metric-note">Position illustration · actual clue start: {(trial.actual_depth * 100).toFixed(2)}% of tokens before the question. Requested position is a fraction of filler; fixed opening and question tokens shift the actual position.</p>
        <p className="retrieval-clue"><span>Planted sentence from the protocol</span>Important record: The access code is <strong>{trial.code}</strong>.</p>
        <p className="retrieval-question"><span>Answer prefix given to every model</span>Question: What is the access code? Answer: The access code is</p>
      </div>
      <div className="retrieval-grid" aria-live="polite" aria-atomic="true">
        {selected.map(({ ratio, checkpoint, trial: recorded }) => <article className="retrieval-card" key={ratio} aria-label={`Retrieval ${ratio}`}>
          <header><h3>{ratio}</h3><span className={`retrieval-outcome ${recorded.exact_match ? 'match' : 'miss'}`}>{recorded.exact_match ? 'Code recovered' : 'Code missed'}</span></header>
          <p className="retrieval-output-label">Exact saved continuation · 8 generated tokens</p>
          <pre className="retrieval-answer">{recorded.generated_text}</pre>
          <dl><div><dt>Answer scored by the protocol</dt><dd>{recorded.normalized_answer || '(empty)'}</dd></div><div><dt>Mean target-token NLL ↓</dt><dd>{recorded.target_token_nll.toFixed(3)}</dd></div></dl>
          <p className="comparison-checkpoint">Checkpoint {checkpoint.sha256.slice(0, 16)} · {checkpoint.step.toLocaleString('en-US')} updates</p>
        </article>)}
      </div>
      <details className="retrieval-reading"><summary>How the score works, and what this trial can tell us</summary>
        <p><strong>Token:</strong> a piece of text from the tokenizer; it can be part of a word. <strong>Context:</strong> the text the model reads before answering. <strong>Greedy generation:</strong> choose the highest-scoring next token, eight times.</p>
        <p><strong>Match rule:</strong> take the first letters-or-digits word in the continuation, lowercase it, and compare it with the planted code. Extra text after a correct code does not make the recorded match fail.</p>
        <p><strong>Target-token NLL:</strong> negative log likelihood, the average penalty for the known correct answer tokens. Lower means the model assigned more probability to those tokens when supplied with the correct preceding answer tokens. This teacher-forced measurement is separate from the model’s freely generated answer; it is not the probability of the whole answer.</p>
        <p>Each model recovered 3 of 15 codes; all nine trials per model at 2,048–8,192 tokens failed. The code changes when you change length or position. These trials therefore do not isolate distance as the cause, and one example per setting cannot establish a reliable success rate. Training used 512-token windows.</p>
      </details>
      <p className="compact-source"><strong>Recorded model output · 20 August 2026.</strong> No inference is run by these controls. The position strip is an illustration; the answers and scores are copied from <a href={`${source}${evidence.source.path}`} target="_blank" rel="noreferrer">all 45 original trials ↗</a>. <a href={`${source}src/eval/suite.py`} target="_blank" rel="noreferrer">Inspect the prompt builder and scoring ↗</a>.</p>
      <details className="retrieval-identity"><summary>Evidence identity</summary><p>Source SHA256: <code>{evidence.source.sha256}</code></p><p>Tokenizer SHA256: <code>{evidence.source.tokenizer_sha256}</code></p><p>Measured source: <code>{evidence.source.measured_commit}</code> · {evidence.source.runtime.gpu.name} · {evidence.source.run_id}</p><a href={`${import.meta.env.BASE_URL}evidence/week4-evaluation-results.json`}>Download the unchanged source record</a></details>
    </section>
  )
}
