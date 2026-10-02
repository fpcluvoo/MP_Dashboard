import { test, expect } from '@playwright/test';

test('Amazon overview, product and SKU filters, details and empty state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Deine Listings im Überblick.' })).toBeVisible();
  await expect(page.getByText('Demo-Modus')).toBeVisible();
  await expect(page.getByTestId('units')).toHaveText('1.590');
  await expect(page.getByTestId('listing-row')).toHaveCount(4);
  await page.getByLabel('Internes Produkt', { exact: true }).selectOption('p-audio');
  await expect(page.getByTestId('listing-row')).toHaveCount(2);
  await expect(page.getByTestId('units')).toHaveText('720');
  await page.getByLabel('Listing suchen').fill('AUDIO-BLK-FBM');
  await expect(page.getByTestId('listing-row')).toHaveCount(1);
  await expect(page.getByTestId('units')).toHaveText('420');
  await page.getByLabel('Zeitraum').selectOption('7');
  await expect(page.getByTestId('units')).toHaveText('98');
  await page.getByRole('button', { name: 'Studio Kopfhörer · Schwarz', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('AUDIO-BLK-FBM');
  await expect(page.getByRole('dialog')).toContainText('Sponsored Products');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByLabel('Listing suchen').fill('does-not-exist');
  await expect(page.getByText('Keine Listings gefunden')).toBeVisible();
  await expect(page.getByTestId('units')).toHaveText('—');
  await page.getByRole('button', { name: 'Zurücksetzen', exact: true }).click();
  await expect(page.getByTestId('units')).toHaveText('1.590');
  expect(errors).toEqual([]);
});

test('ad overhead stays separate from filtered listing spend; refunds and product mapping are accessible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Werbung', exact: true }).click();
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/615,00\s*€/);
  const account = await page.getByTestId('account-spend').innerText();
  const assigned = await page.getByTestId('assigned-spend').innerText();
  await page.getByLabel('Internes Produkt', { exact: true }).selectOption('p-audio');
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/615,00\s*€/);
  await expect(page.getByTestId('account-spend')).toHaveText(account);
  await expect(page.getByTestId('assigned-spend')).not.toHaveText(assigned);
  await page.getByLabel('Zeitraum').selectOption('7');
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/143,50\s*€/);
  await page.getByRole('button', { name: 'Erstattungen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Erstattungen nach ASIN' })).toBeVisible();
  await expect(page.getByTestId('refund-amount')).not.toHaveText('—');
  await page.getByRole('button', { name: 'Produktstamm', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Produktstamm', exact: true })).toContainText('AUDIO-BLK-FBA');
  await expect(page.getByRole('region', { name: 'Produktstamm', exact: true })).toContainText('AUDIO-BLK-FBM');
});

test('all mobile sections fit the viewport and missing ratings are explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('Nicht verfügbar', { exact: true })).toBeVisible();
  for (const name of ['Verkauf & Traffic', 'Erstattungen', 'Werbung', 'Produktstamm']) {
    await page.getByRole('button', { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
