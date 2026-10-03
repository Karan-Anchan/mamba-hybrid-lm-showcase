import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import App from '../src/App'
import { RecordedComparison } from '../src/components/RecordedComparison'

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

test('keeps recorded replay visible and clearly labeled', async () => {
  const user = userEvent.setup()
  const { container } = render(<App />)
  await user.click(screen.getByText('Optional: inspect a replay or connect to live generation'))
  const consoleView = within(container.querySelector<HTMLElement>('.demo-panel')!)
  expect(await consoleView.findByText('Recorded evidence mode')).toBeVisible()
  expect(consoleView.getByRole('button', { name: /Replay measured run/i })).toBeVisible()
  await user.click(consoleView.getByRole('button', { name: /Replay measured run/i }))
  await user.click(screen.getByRole('button', { name: 'Compare P2 across all models' }))
  const generationRatios = consoleView.getByRole('group', { name: 'Attention : SSM ratio' })
  expect(within(generationRatios).getByRole('button', { name: /1:3/ })).toHaveAttribute('aria-pressed', 'true')
  expect(await consoleView.findByText(/state-space layers are more or less the same/i, {}, { timeout: 10_000 })).toBeInTheDocument()
  await waitFor(() => expect(consoleView.getByText('51.14', { exact: false })).toBeInTheDocument(), { timeout: 10_000 })
  await user.click(screen.getByRole('button', { name: 'Compare P3 across all models' }))
  expect(consoleView.getByText(/state-space layers are more or less the same/i)).toBeInTheDocument()
  expect(consoleView.getByText('51.14', { exact: false })).toBeInTheDocument()
  expect(consoleView.getByText(/^1:3 .* params$/)).toBeInTheDocument()
  expect(consoleView.getByText(/Measured at clean commit d6a4613/)).toBeInTheDocument()
}, 15_000)

test('does not replay unmeasured custom text', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByText('Optional: inspect a replay or connect to live generation'))
  await screen.findByText('Recorded evidence mode')
  const prompt = screen.getByLabelText(/Prompt API limit/i)
  await user.clear(prompt)
  await user.type(prompt, 'A prompt that was never measured')
  expect(screen.getByRole('button', { name: /Replay measured run/i })).toBeDisabled()
  expect(screen.getByText('Choose P1–P3 to replay evidence')).toBeInTheDocument()
})

test('shows all exact layer placements with attention counts and written positions', () => {
  render(<App />)
  const architectures = screen.getByRole('region', { name: 'All three hybrid architectures' })
  for (const [ratio, positions] of [['1:3', [4, 8, 12, 16]], ['1:7', [8, 16]], ['1:15', [16]]] as const) {
    const pattern = within(architectures).getByRole('list', { name: `${ratio} sixteen-layer pattern` })
    expect(within(pattern).getAllByRole('listitem')).toHaveLength(16)
    expect([...pattern.querySelectorAll('.attention')].map((layer) => layer.getAttribute('aria-label')))
      .toEqual(positions.map((position) => `Layer ${position}: causal attention`))
    expect(within(pattern).getAllByText('M')).toHaveLength(16 - positions.length)
  }
  expect(within(architectures).getByText('Attention at layers 4, 8, 12, 16.')).toBeVisible()
  expect(within(architectures).getByText('Attention at layers 8, 16.')).toBeVisible()
  expect(within(architectures).getByText('Attention at layer 16.')).toBeVisible()
  expect(screen.getByText(/not live model activity/)).toBeInTheDocument()
  expect(within(architectures).getByText(/controls for future training comparisons/)).toBeInTheDocument()
})

test('compares all saved outputs immediately under one prompt without any API calls', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  const user = userEvent.setup()
  try {
    render(<RecordedComparison />)
    const comparison = screen.getByRole('region', { name: 'One prompt. Three recorded completions.' })
    expect(within(comparison).getAllByRole('article')).toHaveLength(3)
    expect(within(comparison).getByText(/state-space layers are more or less the same/)).toBeVisible()
    expect(within(comparison).getByText(/the fact that the state is not simply a state/)).toBeVisible()
    expect(within(comparison).getByText(/compare the two on the basis of their common characteristics/)).toBeVisible()
    expect(within(comparison).getByText('51.14', { exact: false })).toBeVisible()
    expect(within(comparison).getByText('34.26', { exact: false })).toBeVisible()
    await user.click(within(comparison).getByRole('button', { name: 'Compare P2 across all models' }))
    expect(within(comparison).getByText(promptsP2)).toBeVisible()
    expect(within(comparison).getByText(/Socialized memory and data generation/)).toBeVisible()
    expect(within(comparison).getByText(/memory-intensive memory-intensive/)).toBeVisible()
    expect(within(comparison).getByText(/of the way the operating system works/)).toBeVisible()
    expect(within(comparison).getByText('52.43', { exact: false })).toBeVisible()
    expect(within(comparison).getByText('19.88', { exact: false })).toBeVisible()
    expect(within(comparison).queryByText(/state-space layers are more or less the same/)).not.toBeInTheDocument()
    expect(within(comparison).getByText('Recorded evidence')).toBeVisible()
    expect(fetchSpy).not.toHaveBeenCalled()
  } finally {
    fetchSpy.mockRestore()
  }
})

const promptsP2 = 'In a small language model, memory usage matters because'
