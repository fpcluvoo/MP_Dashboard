import { test, expect } from '@playwright/test';

test('demo metrics, combined filters and reset', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Marketplace Übersicht' })).toBeVisible();
  await expect(page.getByText('Demo-Modus')).toBeVisible();
  await expect(page.getByTestId('orders')).toHaveText('90');
  await page.getByLabel('Marktplatz', { exact: true }).selectOption('Etsy');
  await expect(page.getByTestId('orders')).toHaveText('30');
  await page.getByLabel('Zeitraum').selectOption('7');
  await expect(page.getByTestId('orders')).toHaveText('7');
  // Seven Etsy orders: (4 + 3 + 2 + 1 + 4 + 3 + 2) units at EUR 24.
  await expect(page.getByTestId('revenue')).toHaveText(/456,00\s*€/);
  await expect(page.locator('tbody tr')).toHaveCount(7);
  for (const row of await page.locator('tbody tr').all()) {
    await expect(row.locator('td').nth(2)).toHaveText('Etsy');
  }
  await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
  await expect(page.getByTestId('orders')).toHaveText('90');
  expect(errors).toEqual([]);
});

test('mobile layout remains within viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Marketplace Übersicht' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
