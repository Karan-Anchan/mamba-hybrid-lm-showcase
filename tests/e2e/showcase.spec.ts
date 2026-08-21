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
  await expect(page.locator('.hero-atmosphere > img')).toHaveCSS('filter', /blur\(5px\)/)
  await expect(page.locator('.hero-scan-beam')).toHaveCSS('animation-name', 'observatory-sweep')
  await expectDisplayTextInsideItsBox(page)
  await expectUniformHeroInsets(page)
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


test('ultrawide hero keeps its narrative and result inside one centered frame', async ({ page }) => {
  await page.setViewportSize({ width: 2048, height: 900 })
  await page.goto('/')
  await expectUniformHeroInsets(page)
  const geometry = await page.evaluate(() => {
    const hero = document.querySelector('.observatory-hero')!.getBoundingClientRect()
    const title = document.querySelector('.hero-title-block h1')!.getBoundingClientRect()
    const question = document.querySelector('.research-question')!.getBoundingClientRect()
    const result = document.querySelector('.hero-conclusion')!.getBoundingClientRect()
    return {
      inset: Math.round(title.left - hero.left),
      horizontalGap: Math.round(result.left - question.right),
      verticalCenterGap: Math.round(Math.abs((result.top + result.height / 2) - (question.top + question.height / 2))),
      overflows: document.documentElement.scrollWidth > window.innerWidth,
    }
  })
  expect(geometry.inset).toBeGreaterThanOrEqual(240)
  expect(geometry.horizontalGap).toBeGreaterThanOrEqual(24)
  expect(geometry.horizontalGap).toBeLessThanOrEqual(400)
  expect(geometry.verticalCenterGap).toBeLessThanOrEqual(220)
  expect(geometry.overflows).toBe(false)
})


test('mobile layout switches theme without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expectDisplayTextInsideItsBox(page)
  await expectUniformHeroInsets(page)
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
