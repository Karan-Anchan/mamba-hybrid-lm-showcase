import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { RetrievalReplay } from '../src/components/RetrievalReplay'
import evidence from '../src/data/retrievalReplay.json'
import raw from '../public/evidence/week4-evaluation-results.json'

test('all exported records and identities match the exact historical evidence', () => {
  expect(evidence.source.sha256).toBe('12b741d651b427743cd4cd15b0ea5dec1c071342c93ad862bf14d0bff668f4b9')
  expect(evidence.variants.map(({ ratio }) => ratio)).toEqual(['1:3', '1:7', '1:15'])
  for (const variant of evidence.variants) {
    const original = raw.variants.find((item) => item.ratio === variant.ratio)!
    expect(variant.trials).toEqual(original.needle_retrieval.trial_records)
    expect(variant.checkpoint).toEqual(original.checkpoint)
    expect(variant.matches).toBe(3)
    expect(variant.trials).toHaveLength(15)
    expect(variant.trials.filter(({ exact_match }) => exact_match)).toHaveLength(3)
    expect(variant.trials.filter(({ context_length, exact_match }) => context_length >= 2048 && exact_match)).toHaveLength(0)
    for (const point of variant.storage) {
      const originalPoint = original.inference.find((item) => item.context_length === point.context_length)!
      for (const field of ['context_length', 'attention_kv_bytes', 'mamba_conv_bytes', 'mamba_ssm_bytes', 'logical_state_bytes'] as const) expect(point[field]).toEqual(originalPoint[field])
      expect(point.logical_state_bytes).toBe(point.attention_kv_bytes + point.mamba_conv_bytes + point.mamba_ssm_bytes)
    }
  }
  expect(evidence.source.measured_commit).toBe(raw.git.commit)
  expect(evidence.source.tokenizer_sha256).toBe(raw.tokenizer.sha256)
})

test('every length and position shows three exact saved answers without inference', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  const user = userEvent.setup()
  try {
    render(<RetrievalReplay />)
    for (const length of evidence.protocol.context_lengths) {
      await user.selectOptions(screen.getByLabelText('Document length'), String(length))
      for (const [index, depth] of evidence.protocol.needle_depths.entries()) {
        await user.click(screen.getByRole('button', { name: ['Early · 10%', 'Middle · 50%', 'Late · 90%'][index] }))
        expect(screen.getAllByRole('article')).toHaveLength(3)
        for (const variant of evidence.variants) {
          const trial = variant.trials.find((record) => record.context_length === length && record.requested_depth === depth)!
          const card = screen.getByRole('article', { name: `Retrieval ${variant.ratio}` })
          expect(card.querySelector('pre')!.textContent).toBe(trial.generated_text)
          expect(within(card).getByText(trial.exact_match ? 'Code recovered' : 'Code missed')).toBeVisible()
          expect(within(card).getByText(trial.target_token_nll.toFixed(3))).toBeVisible()
        }
      }
    }
    expect(screen.getByText(/No inference is run by these controls/)).toBeVisible()
    expect(fetchSpy).not.toHaveBeenCalled()
  } finally { fetchSpy.mockRestore() }
})

test('definitions preserve match-rule, likelihood and distance limitations', async () => {
  render(<RetrievalReplay />)
  await userEvent.click(screen.getByText('How the score works, and what this trial can tell us'))
  expect(screen.getByText(/Extra text after a correct code/)).toBeVisible()
  expect(screen.getByText(/not the probability of the whole answer/)).toBeVisible()
  expect(screen.getByText(/code changes when you change length or position/)).toBeVisible()
  expect(screen.getByText(/Training used 512-token windows/)).toBeVisible()
  expect(screen.getByRole('link', { name: 'all 45 original trials ↗' })).toHaveAttribute('href', expect.stringContaining(`${evidence.source.publication_commit}/${evidence.source.path}`))
})
