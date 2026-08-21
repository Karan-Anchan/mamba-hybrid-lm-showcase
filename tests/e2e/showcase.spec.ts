import { expect, test } from '@playwright/test'


test('desktop visitor can replay measured generation and inspect a ratio', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /How much attention/i })).toBeVisible()
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
  await expect(page.getByText('The winner flips near 260 tokens')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
