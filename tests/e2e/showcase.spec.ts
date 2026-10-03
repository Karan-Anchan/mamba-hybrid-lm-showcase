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
  await page.getByRole('button', { name: 'Show 1:15 layer placement' }).click()
  await expect(page.getByRole('group', { name: 'Attention : SSM ratio' }).getByRole('button', { name: /1:3/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/state-space layers are more or less the same/i)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: /Replay measured run/i })).toBeEnabled()
  await page.getByRole('button', { name: 'Show 1:7 layer placement' }).click()
  await expect(page.locator('.output-toolbar')).toContainText('1:3')
  await expect(page.locator('.completion-copy')).toContainText('state-space layers are more or less the same')
  await expect(page.getByText(/Measured at clean commit d6a4613/)).toBeVisible()
  const prompt = page.getByLabel(/Prompt API limit/i)
  await prompt.fill('This was not one of the measured prompts')
  await expect(page.getByRole('button', { name: /Replay measured run/i })).toBeDisabled()
})

test('compact page preserves readable geometry across twelve viewports', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const [width, height] of [[320, 740], [360, 800], [390, 844], [412, 915], [768, 1024], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1600, 900], [1920, 1080], [2560, 720]]) {
    await page.setViewportSize({ width, height })
    const geometry = await page.evaluate(() => {
      const main = document.querySelector('main')!.getBoundingClientRect()
      const heading = document.querySelector('h1')!.getBoundingClientRect()
      const range = document.createRange()
      range.selectNodeContents(document.querySelector('h1')!)
      const ink = range.getBoundingClientRect()
      return { overflow: document.documentElement.scrollWidth > innerWidth,
        left: main.left, right: innerWidth - main.right, fontSize: parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize),
        textFits: ink.left >= heading.left - 1 && ink.right <= heading.right + 1 && ink.height <= heading.height + 3 }
    })
    expect(geometry.overflow, `overflow at ${width}px`).toBe(false)
    expect(Math.abs(geometry.left - geometry.right), `centered frame at ${width}px`).toBeLessThan(2)
    expect(geometry.left).toBeGreaterThanOrEqual(15)
    expect(geometry.fontSize).toBeGreaterThanOrEqual(32)
    expect(geometry.textFits, `readable heading at ${width}px`).toBe(true)
    await expect(page.getByRole('heading', { name: 'The measured trade-off' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Page sections' }).getByRole('link', { name: 'Method' })).toBeVisible()
    await page.getByRole('button', { name: 'Show 1:15 layer placement' }).click()
    await expect(page.getByRole('list', { name: '1:15 sixteen-layer pattern' }).locator('.attention')).toHaveCount(1)
    if (width === 390 || width === 1440) {
      await page.locator('h1').scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath(`minimal-showcase-${width}.png`) })
    }
  }
})
