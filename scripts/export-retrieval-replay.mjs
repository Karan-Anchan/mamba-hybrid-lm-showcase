import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// This projection copies recorded outputs. It never loads weights or generates text.
const sourcePath = fileURLToPath(new URL('../../mamba-hybrid-lm/results/week4-eval-v1/evaluation_results.json', import.meta.url))
const checkOnly = process.argv.includes('--check')
const publishedCopy = new URL('../public/evidence/week4-evaluation-results.json', import.meta.url)
const bytes = readFileSync(checkOnly ? publishedCopy : sourcePath)
const sha256 = createHash('sha256').update(bytes).digest('hex')
const expected = '12b741d651b427743cd4cd15b0ea5dec1c071342c93ad862bf14d0bff668f4b9'
if (sha256 !== expected) throw new Error('Historical retrieval source identity changed')
const raw = JSON.parse(bytes)
const ratios = ['1:3', '1:7', '1:15']
const lengths = [512, 1024, 2048, 4096, 8192]
const depths = [0.1, 0.5, 0.9]
if (raw.status !== 'completed' || raw.smoke || raw.run_id !== 'week4-eval-v1') throw new Error('Wrong historical protocol')
if (JSON.stringify(raw.protocol.context_lengths) !== JSON.stringify(lengths)
  || JSON.stringify(raw.protocol.needle_depths) !== JSON.stringify(depths)
  || raw.protocol.needle_decode_tokens !== 8) throw new Error('Unexpected retrieval grid')
const variants = ratios.map((ratio) => {
  const variant = raw.variants.find((value) => value.ratio === ratio)
  const records = variant?.needle_retrieval?.trial_records
  if (!records || records.length !== 15) throw new Error(`Incomplete ${ratio} retrieval evidence`)
  for (const context of lengths) {
    for (const depth of depths) {
      const matching = records.filter((trial) => trial.context_length === context && trial.requested_depth === depth)
      if (matching.length !== 1) throw new Error(`Missing or duplicate ${ratio}/${context}/${depth}`)
      const trial = matching[0]
      const normalized = trial.generated_text.toLowerCase().match(/[a-z0-9]+/)?.[0] ?? ''
      if (normalized !== trial.normalized_answer || trial.exact_match !== (normalized === trial.code)
        || trial.generated_token_ids.length !== 8 || !Number.isFinite(trial.target_token_nll)
        || trial.target_token_nll < 0 || !Number.isFinite(trial.actual_depth)
        || trial.actual_depth < 0 || trial.actual_depth > 1) throw new Error('Invalid recorded trial')
    }
  }
  const matches = records.filter((trial) => trial.exact_match).length
  if (matches !== variant.needle_retrieval.matches || variant.needle_retrieval.trials !== records.length) throw new Error('Wrong denominator')
  return {
    ratio,
    checkpoint: variant.checkpoint,
    matches,
    trials: records,
    storage: variant.inference.map((point) => ({
      context_length: point.context_length,
      attention_kv_bytes: point.attention_kv_bytes,
      mamba_conv_bytes: point.mamba_conv_bytes,
      mamba_ssm_bytes: point.mamba_ssm_bytes,
      logical_state_bytes: point.logical_state_bytes,
    })),
  }
})
for (let i = 0; i < 15; i += 1) {
  for (const variant of variants.slice(1)) {
    const paired = variants[0].trials[i]
    const trial = variant.trials[i]
    for (const field of ['context_length', 'requested_depth', 'actual_depth', 'code']) {
      if (trial[field] !== paired[field]) throw new Error('Inputs are not paired across models')
    }
  }
}
for (const variant of variants) {
  if (variant.storage.length !== 5) throw new Error('Incomplete storage evidence')
  for (const point of variant.storage) {
    if (point.logical_state_bytes !== point.attention_kv_bytes + point.mamba_conv_bytes + point.mamba_ssm_bytes) throw new Error('Storage accounting mismatch')
  }
}
const view = {
  schema: 1,
  kind: 'historical-recorded-retrieval-replay',
  source: {
    path: 'results/week4-eval-v1/evaluation_results.json',
    publication_commit: '8e836ba93eb790988c37147f474b679443276f53',
    sha256,
    measured_commit: raw.git.commit,
    prompt_builder_sha256: raw.source_sha256['src/eval/suite.py'],
    tokenizer_sha256: raw.tokenizer.sha256,
    completed_at: raw.completed_at,
    run_id: raw.run_id,
    runtime: raw.runtime,
  },
  protocol: raw.protocol,
  variants,
}
const destination = fileURLToPath(new URL('../src/data/retrievalReplay.json', import.meta.url))
const projectionBytes = Buffer.from(`${JSON.stringify(view, null, 2)}\n`)
if (checkOnly) {
  if (!readFileSync(destination).equals(projectionBytes)) throw new Error('Website projection differs from the exact source projection')
} else {
  writeFileSync(destination, projectionBytes)
  const evidenceDir = fileURLToPath(new URL('../public/evidence/', import.meta.url))
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(publishedCopy, bytes)
}
process.stdout.write(`Copied ${variants.reduce((count, variant) => count + variant.trials.length, 0)} historical trials; source SHA256 ${sha256}\n`)
