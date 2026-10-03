import { expect, test } from '@playwright/test'

test('desktop reader sees all architectures and recorded outputs before opening the optional console', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'How much attention does a small hybrid language model need?' })).toBeVisible()
  await expect(page.getByRole('table', { name: /One run per ratio/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How to read the results' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How I built the comparison' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What did not go cleanly' })).toBeVisible()
  const comparison = page.getByRole('region', { name: 'One prompt. Three recorded completions.' })
  await expect(comparison.getByRole('article')).toHaveCount(3)
  await expect(comparison.locator('.recorded-completion')).toHaveCount(3)
  await expect(page.getByRole('region', { name: 'All three hybrid architectures' }).getByRole('list')).toHaveCount(3)
  await expect(page.locator('.demo-panel')).not.toBeVisible()
  await page.getByText('Optional: inspect a replay or connect to live generation').click()
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
  await page.getByText('Optional: inspect a replay or connect to live generation').click()
  const consoleView = page.locator('.demo-panel')
  await expect(consoleView.getByText('Recorded evidence mode')).toBeVisible()
  await consoleView.getByRole('button', { name: /Replay measured run/i }).click()
  await page.getByRole('button', { name: 'Compare P2 across all models' }).click()
  await expect(consoleView.getByRole('group', { name: 'Attention : SSM ratio' }).getByRole('button', { name: /1:3/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(consoleView.getByText(/state-space layers are more or less the same/i)).toBeVisible({ timeout: 10_000 })
  await expect(consoleView.getByRole('button', { name: /Replay measured run/i })).toBeEnabled()
  await page.getByRole('button', { name: 'Compare P3 across all models' }).click()
  await expect(consoleView.locator('.output-toolbar')).toContainText('1:3')
  await expect(consoleView.locator('.completion-copy')).toContainText('state-space layers are more or less the same')
  await expect(consoleView.getByText(/Measured at clean commit d6a4613/)).toBeVisible()
  const prompt = consoleView.getByLabel(/Prompt API limit/i)
  await prompt.fill('This was not one of the measured prompts')
  await expect(consoleView.getByRole('button', { name: /Replay measured run/i })).toBeDisabled()
})

test('shared prompt switches all three exact recorded samples with no generation request', async ({ page }) => {
  const generationRequests: string[] = []
  page.on('request', (request) => { if (request.url().includes('/generate')) generationRequests.push(request.url()) })
  await page.goto('/')
  const comparison = page.getByRole('region', { name: 'One prompt. Three recorded completions.' })
  for (const promptId of ['P1', 'P2', 'P3']) {
    await comparison.getByRole('button', { name: `Compare ${promptId} across all models` }).click()
    for (const ratio of ['1:3', '1:7', '1:15']) {
      const card = comparison.getByRole('article', { name: ratio, exact: true })
      await expect(card.locator('.recorded-completion')).not.toBeEmpty()
      await expect(card.getByText('Generation rate')).toBeVisible()
      await expect(card.getByText('Time to first token')).toBeVisible()
    }
  }
  await expect(comparison.locator('.comparison-prompt')).toContainText('The experiment showed that')
  await expect(comparison.getByText('Recorded evidence')).toBeVisible()
  expect(generationRequests).toEqual([])
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
    for (const [ratio, count] of [['1:3', 4], ['1:7', 2], ['1:15', 1]] as const) {
      await expect(page.getByRole('list', { name: `${ratio} sixteen-layer pattern` }).locator('.attention')).toHaveCount(count)
    }
    const layout = await page.locator('.comparison-card').evaluateAll((cards) => cards.map((card) => {
      const bounds = card.getBoundingClientRect()
      return { x: bounds.x, y: bounds.y, right: bounds.right }
    }))
    if (width > 700) {
      expect(new Set(layout.map(({ y }) => y)).size).toBe(1)
      expect(layout[1].x).toBeGreaterThan(layout[0].right)
    } else {
      expect(new Set(layout.map(({ x }) => x)).size).toBe(1)
      expect(layout[1].y).toBeGreaterThan(layout[0].y)
    }
    const marker = await page.locator('.layer-node.attention').first().evaluate((element) => {
      const style = getComputedStyle(element)
      return { foreground: style.color, background: style.backgroundColor, border: parseFloat(style.borderTopWidth) }
    })
    expect(marker.foreground).toBe('rgb(255, 255, 255)')
    expect(marker.background).toBe('rgb(37, 39, 34)')
    expect(marker.border).toBeGreaterThanOrEqual(2)
    if (width === 390 || width === 1440) {
      expect(await page.locator('.skip-link').evaluate((element) => element === document.activeElement)).toBe(false)
      // Element captures can include offscreen fixed content when the capture exceeds the viewport.
      const style = '.skip-link { visibility: hidden; }'
      await page.locator('.layer-instrument').screenshot({ path: testInfo.outputPath(`architectures-${width}.png`), style })
      await page.locator('.recorded-comparison').screenshot({ path: testInfo.outputPath(`recorded-comparison-${width}.png`), style })
    }
  }
})
