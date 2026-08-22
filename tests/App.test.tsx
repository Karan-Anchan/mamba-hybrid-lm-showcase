import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import App from '../src/App'


test('presents the research question and an honest recorded fallback', async () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /Attention under constraint/i })).toBeInTheDocument()
  expect(screen.getByText(/At fixed compute, how does attention frequency alter/)).toBeInTheDocument()
  expect(screen.getByText('Committed evaluation evidence')).toBeInTheDocument()
  expect(screen.getByText('Illustrative phase field—not model activations.')).toBeInTheDocument()
  expect(document.querySelector('[data-visual="illustrative-phase-field"]')).toBeInTheDocument()
  expect(document.querySelector('.hero-scan-beam')).toHaveAttribute('aria-hidden', 'true')
  expect(document.querySelector('.hero-probe')).toHaveAttribute('aria-hidden', 'true')
  expect(document.querySelector('.hero-routing')).not.toBeInTheDocument()
  expect(document.querySelectorAll('img[src*="project-emblem.png?v=2"]')).toHaveLength(2)
  expect(document.querySelectorAll('[data-motion="reroute-layer"]')).toHaveLength(16)
  expect(screen.getByText('700M POSITIONS / MODEL')).toBeInTheDocument()
  expect(await screen.findByText('Recorded evidence mode')).toBeInTheDocument()
  expect(screen.getByText('No public compute host is configured.')).toBeInTheDocument()
})


test('ratio selection updates the shared architecture readout', async () => {
  const user = userEvent.setup()
  render(<App />)
  const ratioButtons = screen.getAllByRole('button', { name: '1:15' })
  await user.click(ratioButtons[0])
  expect(screen.getByLabelText('1:15 architecture instrument')).toBeInTheDocument()
  expect(screen.getAllByText('20.66 MiB').length).toBeGreaterThan(0)
})


test('recorded replay reveals exact measured output and metrics', async () => {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByText('Recorded evidence mode')
  await user.click(screen.getByRole('button', { name: /Replay measured run/i }))
  expect(await screen.findByText(/state-space layers are more or less the same/i, {}, { timeout: 10_000 })).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('51.14', { exact: false })).toBeInTheDocument(), { timeout: 10_000 })
  expect(screen.getByText(/Measured at clean commit d6a4613/)).toBeInTheDocument()
}, 15_000)


test('custom text cannot be presented as a recorded generation', async () => {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByText('Recorded evidence mode')
  const prompt = screen.getByLabelText(/Prompt API limit/i)
  await user.clear(prompt)
  await user.type(prompt, 'A prompt that was never measured')
  expect(screen.getByRole('button', { name: /Replay measured run/i })).toBeDisabled()
  expect(screen.getByText('Choose P1–P3 to replay evidence')).toBeInTheDocument()
})


test('theme control persists the selected appearance', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  expect(window.localStorage.getItem('mamba-showcase-theme')).toBe('light')
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#f2efe4')
})
