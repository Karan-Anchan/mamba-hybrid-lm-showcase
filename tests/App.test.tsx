import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import App from '../src/App'

test('leads with the question, measured results, and limitations', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'How much attention does a small hybrid language model need?' })).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { name: 'The measured trade-off' })).toBeInTheDocument()
  expect(screen.getByText(/Matched token exposure is not matched FLOPs/)).toBeInTheDocument()
  expect(screen.getByText(/one training seed per ratio/)).toBeInTheDocument()
  expect(screen.getByText(/All variants failed the exact 2K\+ needle trials/)).toBeInTheDocument()
  expect(document.querySelector('.hero-atmosphere')).not.toBeInTheDocument()
  expect(document.querySelector('.reading-progress')).not.toBeInTheDocument()
})

test('keeps the distinct benchmark protocols and exact values in one table', () => {
  render(<App />)
  const table = screen.getByRole('table', { name: /One run per ratio/ })
  expect(within(table).getAllByRole('row')).toHaveLength(4)
  expect(within(table).getByRole('columnheader', { name: /8K decode tok\/s/ })).toBeInTheDocument()
  expect(within(table).getByRole('columnheader', { name: /48-token generation tok\/s/ })).toBeInTheDocument()
  const rows = within(table).getAllByRole('row')
  expect(within(rows[1]).getByText('26.301')).toBeInTheDocument()
  expect(within(rows[1]).getByText('61.33')).toBeInTheDocument()
  expect(within(rows[2]).getByText('49.05')).toBeInTheDocument()
  expect(within(rows[3]).getByText('20.66')).toBeInTheDocument()
  expect(screen.getByText(/Do not compare the two as the same benchmark/)).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Logical inference-state memory by cached context/ })).toBeInTheDocument()
})

test('explains implementation, tools, and source-backed challenges', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'How I built the comparison' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /Inspect .*\.py/ })).toHaveLength(4)
  expect(screen.getByText(/Hugging Face Datasets and Tokenizers/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'The portable SSD training path is costly' })).toBeInTheDocument()
  expect(screen.getByText(/unrelated GPU workload reduced headroom/)).toBeInTheDocument()
  expect(screen.getByText(/Large checkpoints and the prepared corpus are not in the public repository/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'training ↗' })).toHaveAttribute(
    'href',
    expect.stringContaining('8e836ba93eb790988c37147f474b679443276f53/results/week3-700m-v1/sweep_table.md'),
  )
})

test('preserves honest recorded replay inside an optional disclosure', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByText('Open generation instrument'))
  expect(await screen.findByText('Recorded evidence mode')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Replay measured run/i }))
  expect(await screen.findByText(/state-space layers are more or less the same/i, {}, { timeout: 10_000 })).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('51.14', { exact: false })).toBeInTheDocument(), { timeout: 10_000 })
  expect(screen.getByText(/Measured at clean commit d6a4613/)).toBeInTheDocument()
}, 15_000)

test('does not replay unmeasured custom text', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByText('Open generation instrument'))
  await screen.findByText('Recorded evidence mode')
  const prompt = screen.getByLabelText(/Prompt API limit/i)
  await user.clear(prompt)
  await user.type(prompt, 'A prompt that was never measured')
  expect(screen.getByRole('button', { name: /Replay measured run/i })).toBeDisabled()
  expect(screen.getByText('Choose P1–P3 to replay evidence')).toBeInTheDocument()
})
