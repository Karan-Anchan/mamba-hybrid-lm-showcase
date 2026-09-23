import { expect, test } from '@playwright/test'

test('desktop reader reaches evidence and an already visible demo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'How much attention does a small hybrid language model need?' })).toBeVisible()
  await expect(page.getByRole('table', { name: /One run per ratio/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How to read the results' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How I built the comparison' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What did not go cleanly' })).toBeVisible()
  await expect(page.locator('.demo-panel')).toBeVisible()
  await expect(page.getByRole('button', { name: /Replay measured run/i })).toBeVisible()
  await expect(page.locator('.demo-details')).toHaveCount(0)
  await expect(page.locator('.hero-atmosphere,.hero-scan,.hero-probe,.reading-progress')).toHaveCount(0)
  expect(await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily)).toContain('IBM Plex Serif')
  expect(await page.locator('h1').evaluate((element) => getComputedStyle(element).fontFamily)).toContain('IBM Plex Serif')
  expect(await page.locator('.eyebrow').first().evaluate((element) => getComputedStyle(element).fontFamily)).toContain('IBM Plex Mono')
  expect(await page.evaluate(async () => {
    await document.fonts.ready
    return Array.from(document.fonts).some((face) => face.family === 'IBM Plex Serif' && face.status === 'loaded')
  })).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('replay remains explicitly recorded and refuses an unmeasured prompt', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Recorded evidence mode')).toBeVisible()
  await page.getByRole('button', { name: /Replay measured run/i }).click()
  await expect(page.getByText(/state-space layers are more or less the same/i)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/Measured at clean commit d6a4613/)).toBeVisible()
  const prompt = page.getByLabel(/Prompt API limit/i)
  await prompt.fill('This was not one of the measured prompts')
  await expect(page.getByRole('button', { name: /Replay measured run/i })).toBeDisabled()
})

test('compact page fits phones, tablets, and desktops without horizontal overflow', async ({ page }) => {
  await page.goto('/')
  for (const width of [360, 390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 850 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `overflow at ${width}px`).toBe(true)
    await expect(page.getByRole('heading', { name: 'The measured trade-off' })).toBeVisible()
  }
})
