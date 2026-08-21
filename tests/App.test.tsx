import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import App from '../src/App'


test('presents the research question and an honest recorded fallback', async () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /How much attention/i })).toBeInTheDocument()
  expect(screen.getByText('research artifact 02')).toBeInTheDocument()
  expect(screen.getByText('700M')).toBeInTheDocument()
  expect(await screen.findByText('Recorded evidence mode')).toBeInTheDocument()
  expect(screen.getByText('No public compute host is configured.')).toBeInTheDocument()
})


test('ratio selection updates the shared architecture readout', async () => {
  const user = userEvent.setup()
  render(<App />)
  const ratioButtons = screen.getAllByRole('button', { name: '1:15' })
  await user.click(ratioButtons[0])
  expect(screen.getByLabelText('1:15 architecture instrument')).toBeInTheDocument()
  expect(screen.getByText('20.66 MiB')).toBeInTheDocument()
})


test('recorded replay reveals exact measured output and metrics', async () => {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByText('Recorded evidence mode')
  await user.click(screen.getByRole('button', { name: /Replay measured run/i }))
  expect(await screen.findByText(/state-space layers are more or less the same/i, {}, { timeout: 10_000 })).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('51.14', { exact: false })).toBeInTheDocument(), { timeout: 10_000 })
  expect(screen.getByText(/Measured at clean commit d6a4613/)).toBeInTheDocument()
})


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
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#ebe8de')
})
