import { expect, test, type Page } from '@playwright/test'


const displayTextSelector = [
  '.hero-title-block h1 > span',
  '.hero-title-block h1 em',
  '.observation-heading h2',
  '.specimen-ratio',
  '.generation-heading h2',
  '.closing-copy h2',
].join(',')


async function expectDisplayTextInsideItsBox(page: Page) {
  const overflow = await page.locator(displayTextSelector).evaluateAll((elements) => elements
    .map((element) => ({
      text: element.textContent?.trim(),
      x: element.scrollWidth - element.clientWidth,
      y: element.scrollHeight - element.clientHeight,
    }))
    .filter((item) => item.x > 1 || item.y > 1))
  expect(overflow).toEqual([])
}


async function expectUniformHeroInsets(page: Page) {
  const insets = await page.evaluate(() => {
    const hero = document.querySelector('.observatory-hero')!.getBoundingClientRect()
    const leftSelectors = ['.hero-protocol span:first-child', '.hero-title-block h1', '.hero-actions']
    const rightSelectors = ['.hero-controls', '.hero-conclusion', '.visual-disclosure']
    return [
      ...leftSelectors.map((selector) => Math.round(document.querySelector(selector)!.getBoundingClientRect().left - hero.left)),
      ...rightSelectors.map((selector) => Math.round(hero.right - document.querySelector(selector)!.getBoundingClientRect().right)),
    ]
  })
  expect(Math.max(...insets) - Math.min(...insets)).toBeLessThanOrEqual(1)
}


test('desktop visitor can replay measured generation and inspect a ratio', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Attention under constraint/i })).toBeVisible()
  await expect(page.getByText('Illustrative phase field—not model activations.')).toBeVisible()
  expect(await page.locator('img[src*="state-phase-field-v1.webp"]').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  expect(await page.locator('.observatory-mark img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 1080)).toBe(true)
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /project-emblem\.png\?v=2$/)
  await expect(page.locator('.hero-atmosphere > img')).toHaveCSS('filter', /blur\(8px\)/)
  await expect(page.locator('.hero-scan-beam')).toHaveCSS('animation-name', 'observatory-sweep')
  await expect(page.locator('.hero-routing')).toHaveCount(0)
  await expectDisplayTextInsideItsBox(page)
  await expectUniformHeroInsets(page)
  await expect(page.locator('.observatory-mark img')).toHaveCSS('width', '48px')
  const heroColumnGap = await page.evaluate(() => Math.round(
    document.querySelector('.hero-conclusion')!.getBoundingClientRect().left
    - document.querySelector('.research-question')!.getBoundingClientRect().right,
  ))
  expect(heroColumnGap).toBeGreaterThanOrEqual(24)
  await expect(page.getByText('Recorded evidence mode')).toBeVisible()
  await page.getByRole('button', { name: /Replay measured run/i }).click()
  await expect(page.getByText(/state-space layers are more or less the same/i)).toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/Measured at clean commit d6a4613/)).toBeVisible()
  await page.getByRole('button', { name: '1:15' }).first().click()
  await expect(page.getByLabel('1:15 architecture instrument')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})


test('mobile layout switches theme without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expectDisplayTextInsideItsBox(page)
  await expectUniformHeroInsets(page)
  await expect(page.locator('.observatory-mark img')).toHaveCSS('width', '38px')
  await expect(page.locator('.hero-routing')).toHaveCount(0)
  const mobileFlowGaps = await page.locator('.hero-title-block,.hero-conclusion,.hero-controls,.hero-actions,.visual-disclosure').evaluateAll((elements) => elements
    .slice(1)
    .map((element, index) => Math.round(element.getBoundingClientRect().top - elements[index].getBoundingClientRect().bottom)))
  expect(mobileFlowGaps.every((gap) => gap >= 18)).toBe(true)
  const sectionGutters = await page.locator('.ratio-section,.lab-section,.evidence-section,.system-section').evaluateAll((elements) => elements
    .map((element) => Number.parseFloat(getComputedStyle(element).paddingLeft)))
  expect(sectionGutters.every((gutter) => gutter >= 18)).toBe(true)
  await page.getByRole('link', { name: 'Evidence' }).click()
  await expect(page.getByText('The winner flips near 260 tokens')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})


test('reduced motion collapses perpetual observatory signals', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const animations = await page.evaluate(() => ({
    atmosphere: getComputedStyle(document.querySelector('.hero-atmosphere > img')!).animationName,
    scan: getComputedStyle(document.querySelector('.hero-scan-beam')!).animationName,
    topology: getComputedStyle(document.querySelector('.layer-strip')!, '::after').animationName,
    emblem: getComputedStyle(document.querySelector('.observatory-mark')!, '::before').animationName,
  }))
  expect(animations).toEqual({ atmosphere: 'none', scan: 'none', topology: 'none', emblem: 'none' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})


test('hero content frame remains centered across common viewport classes', async ({ page }) => {
  const viewports = [
    { name: 'small phone', width: 360, height: 800 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'large phone', width: 430, height: 932 },
    { name: 'portrait tablet', width: 768, height: 1024 },
    { name: 'landscape tablet', width: 1024, height: 768 },
    { name: 'small laptop', width: 1280, height: 720 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'large desktop', width: 1536, height: 864 },
    { name: 'full HD', width: 1920, height: 1080 },
    { name: 'short ultrawide', width: 2048, height: 803 },
    { name: 'QHD', width: 2560, height: 1440 },
  ]

  await page.goto('/')

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => {
        const element = document.querySelector(selector)!
        const bounds = element.getBoundingClientRect()
        return {
          left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom,
          width: bounds.width, height: bounds.height, display: getComputedStyle(element).display,
        }
      }
      const hero = rect('.observatory-hero')
      const question = rect('.research-question')
      const controls = rect('.hero-controls')
      const result = rect('.hero-conclusion')
      const actions = rect('.hero-actions')
      const disclosure = rect('.visual-disclosure')
      const title = rect('.hero-title-block h1')
      const leftInset = title.left - hero.left
      const rightInset = hero.right - result.right
      return {
        hero, title, question, controls, result, actions, disclosure,
        diagramExists: document.querySelector('.hero-routing') !== null,
        frameWidth: result.right - title.left,
        leftInset,
        rightInset,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }
    })

    expect(geometry.overflow, `${viewport.name} should not overflow horizontally`).toBe(false)
    expect(geometry.diagramExists, `${viewport.name} should not render the removed schematic`).toBe(false)
    expect(Math.abs(geometry.leftInset - geometry.rightInset), `${viewport.name} should have equal side padding`).toBeLessThanOrEqual(1)
    expect(geometry.frameWidth, `${viewport.name} content frame should remain bounded`).toBeLessThanOrEqual(1601)

    if (viewport.width > 1180) {
      expect(geometry.actions.bottom, `${viewport.name} actions inside viewport`).toBeLessThanOrEqual(geometry.viewport.height)
      expect(geometry.disclosure.bottom, `${viewport.name} disclosure inside viewport`).toBeLessThanOrEqual(geometry.viewport.height)
      expect(geometry.hero.bottom, `${viewport.name} hero fits viewport`).toBeLessThanOrEqual(geometry.viewport.height + 1)
      expect(geometry.actions.top - geometry.question.bottom, `${viewport.name} question/actions clearance`).toBeGreaterThanOrEqual(12)
      expect(Math.abs(geometry.controls.right - geometry.result.right), `${viewport.name} selector/result alignment`).toBeLessThanOrEqual(1)
      expect(geometry.result.left - geometry.question.right, `${viewport.name} column clearance`).toBeGreaterThanOrEqual(24)
      expect(geometry.result.left - geometry.question.right, `${viewport.name} columns should not drift apart`).toBeLessThanOrEqual(520)
    }
  }
})
