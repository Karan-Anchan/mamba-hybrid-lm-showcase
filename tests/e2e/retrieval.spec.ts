import { expect, test } from '@playwright/test'
import evidence from '../../src/data/retrievalReplay.json' with { type: 'json' }

for (const width of [1440, 390]) {
  test(`recorded retrieval is paired, readable and exact at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    const generationRequests: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => { if (request.url().includes('/generate')) generationRequests.push(request.url()) })
    await page.goto('/#retrieval')
    const replay = page.getByRole('region', { name: 'Can they recover one hidden word?' })
    await expect(replay.getByRole('article')).toHaveCount(3)
    for (const length of evidence.protocol.context_lengths) {
      await replay.getByLabel('Document length').selectOption(String(length))
      for (const [index, depth] of evidence.protocol.needle_depths.entries()) {
        const button = replay.getByRole('button', { name: ['Early · 10%', 'Middle · 50%', 'Late · 90%'][index] })
        await button.click()
        await expect(button).toHaveAttribute('aria-pressed', 'true')
        for (const variant of evidence.variants) {
          const trial = variant.trials.find((record) => record.context_length === length && record.requested_depth === depth)!
          const card = replay.getByRole('article', { name: `Retrieval ${variant.ratio}` })
          expect(await card.locator('pre').textContent()).toBe(trial.generated_text)
          await expect(card.getByText(trial.exact_match ? 'Code recovered' : 'Code missed')).toBeVisible()
          await expect(card.getByText(trial.target_token_nll.toFixed(3))).toBeVisible()
        }
      }
    }
    await replay.getByLabel('Document length').selectOption('512')
    await replay.getByRole('button', { name: 'Middle · 50%' }).click()
    const bounds = await replay.getByRole('article').evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().y))
    expect(new Set(bounds).size).toBe(width > 700 ? 1 : 3)
    await replay.getByText('How the score works, and what this trial can tell us').click()
    await expect(replay.getByText(/not the probability of the whole answer/)).toBeVisible()
    await replay.getByText('Evidence identity').click()
    await expect(replay.getByText(evidence.source.sha256)).toBeVisible()
    const source = await page.request.get('/evidence/week4-evaluation-results.json')
    expect(source.status()).toBe(200)
    expect((await source.json()).run_id).toBe('week4-eval-v1')
    await page.evaluate(() => document.fonts.ready)
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily)).toContain('Poppins')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
    expect(generationRequests).toEqual([])
    await replay.getByText('How the score works, and what this trial can tell us').click()
    await replay.getByText('Evidence identity').click()
    await replay.screenshot({ path: testInfo.outputPath(`retrieval-${width}-success.png`), style: '.skip-link { visibility: hidden; }' })
    await replay.getByLabel('Document length').selectOption('8192')
    await replay.getByRole('button', { name: 'Early · 10%' }).click()
    await replay.screenshot({ path: testInfo.outputPath(`retrieval-${width}-failure.png`), style: '.skip-link { visibility: hidden; }' })
  })
}
