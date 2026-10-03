import { test, expect } from '@playwright/test';

test('Amazon overview, product and SKU filters, details and empty state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Deine Listings im Überblick.' })).toBeVisible();
  await expect(page.getByText('Demo-Modus')).toBeVisible();
  await expect(page.getByTestId('units')).toHaveText('4.230');
  await expect(page.getByTestId('listing-row')).toHaveCount(18);
  await page.getByLabel('Modell', { exact: true }).selectOption('clouvou-bright-seat');
  await expect(page.getByTestId('listing-row')).toHaveCount(3);
  await expect(page.getByTestId('units')).toHaveText('630');
  await page.getByLabel('Listing suchen').fill('DEMO-SKU-001-FBM');
  await expect(page.getByTestId('listing-row')).toHaveCount(1);
  await expect(page.getByTestId('units')).toHaveText('180');
  await page.getByLabel('Zeitraum').selectOption('7');
  await expect(page.getByTestId('units')).toHaveText('42');
  await page.getByRole('button', { name: 'Clouvou Bright Seat · Schwarz', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('DEMO-SKU-001-FBM');
  await expect(page.getByRole('dialog')).toContainText('Sponsored Products');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByLabel('Listing suchen').fill('does-not-exist');
  await expect(page.getByText('Keine Demo-Listings in dieser Auswahl')).toBeVisible();
  await expect(page.getByTestId('units')).toHaveText('—');
  await page.getByRole('button', { name: 'Zurücksetzen', exact: true }).click();
  await expect(page.getByTestId('units')).toHaveText('4.230');
  expect(errors).toEqual([]);
});

test('ad overhead stays separate from filtered listing spend; refunds and product mapping are accessible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Werbung', exact: true }).click();
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/615,00\s*€/);
  const account = await page.getByTestId('account-spend').innerText();
  const assigned = await page.getByTestId('assigned-spend').innerText();
  await page.getByLabel('Modell', { exact: true }).selectOption('clouvou-bright-seat');
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/615,00\s*€/);
  await expect(page.getByTestId('account-spend')).toHaveText(account);
  await expect(page.getByTestId('assigned-spend')).not.toHaveText(assigned);
  await page.getByLabel('Zeitraum').selectOption('7');
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/143,50\s*€/);
  await page.getByRole('button', { name: 'Erstattungen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Erstattungen nach Listing' })).toBeVisible();
  await expect(page.getByTestId('refund-amount')).not.toHaveText('—');
  await page.getByRole('button', { name: 'Produktstamm', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Produktstamm', exact: true })).toContainText('Bright Seat');
  await expect(page.getByRole('region', { name: 'Produktstamm', exact: true })).toContainText('Echte SKU / ASIN noch offen');
});

test('all mobile sections fit the viewport and missing ratings are explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('Nicht verfügbar', { exact: true }).first()).toBeVisible();
  for (const name of ['Verkauf & Traffic', 'Erstattungen', 'Werbung', 'Produktstamm', 'Profit & Kosten', 'Datenquellen & APIs']) {
    await page.getByRole('button', { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('catalog shows all brands and pending details without fake variants', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Markenübersicht' })).toContainText('Wintoncove');
  await page.getByRole('button', { name: 'Produktstamm', exact: true }).click();
  await expect(page.getByTestId('catalog-row')).toHaveCount(15);
  await page.getByLabel('Marke', { exact: true }).selectOption('lutivo');
  await expect(page.getByTestId('catalog-row')).toHaveCount(6);
  await expect(page.getByTestId('units')).toHaveText('—');
  await page.getByLabel('Kategorie', { exact: true }).selectOption('desks');
  await expect(page.getByTestId('catalog-row')).toHaveCount(2);
  await expect(page.getByRole('region', {name:'Produktstamm',exact:true})).toContainText('Foxtrot');
  await page.getByRole('button', {name:'Verkauf & Traffic',exact:true}).click();
  await expect(page.getByText('Keine Demo-Listings in dieser Auswahl')).toBeVisible();
  await page.getByRole('button', {name:'Produktstamm ansehen'}).click();
  await expect(page.getByRole('heading', {name:'Euer Produktstamm'})).toBeVisible();
  await page.getByLabel('Kategorie', { exact: true }).selectOption('all');
  await page.getByLabel('Marke', { exact: true }).selectOption('wintoncove');
  await expect(page.getByText('5 Modelle · Namen und Varianten folgen.', {exact:true})).toBeVisible();
  await expect(page.getByTestId('catalog-row')).toHaveCount(0);
  await page.getByRole('button', {name:'Zurücksetzen',exact:true}).click();
  await page.getByLabel('Modell', {exact:true}).selectOption('clouvou-bright-seat');
  await page.getByLabel('Marke', {exact:true}).selectOption('lutivo');
  await expect(page.getByLabel('Modell', {exact:true})).toHaveValue('all');
});

test('direct channels keep currencies and traffic definitions separate', async ({page}) => {
 await page.goto('/');
 await expect(page.getByLabel('Marktplatz / Land').locator('option')).toHaveCount(14);
 await page.getByLabel('Marktplatz / Land').selectOption('amazon-us');
 await expect(page.getByTestId('revenue')).toContainText('€');
 await expect(page.getByTestId('revenue').locator('[title]')).toHaveAttribute('title',/\$/);
 await page.getByLabel('Anzeigewährung').selectOption('original');
 await expect(page.getByTestId('revenue')).toContainText('$');
 await page.getByLabel('Marktplatz / Land').selectOption('amazon-pl');
 await expect(page.getByTestId('revenue')).toContainText('PLN');
 await page.getByLabel('Marktplatz / Land').selectOption('ebay-de');
 await expect(page.getByTestId('sessions')).not.toHaveText('—');
 await expect(page.getByText('Transaktionen / Views', {exact:true}).first()).toBeVisible();
 await page.getByLabel('Marktplatz / Land').selectOption('otto-de');
 await expect(page.getByTestId('sessions')).toHaveText('—');
 await expect(page.getByTestId('conversion')).toHaveText('—');
 await page.getByRole('button',{name:'Werbung',exact:true}).click();
 await expect(page.getByTestId('account-spend')).toHaveText('—');
 await page.getByRole('button',{name:'Datenquellen & APIs',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Direktanbindung · OTTO'})).toBeVisible();
 await expect(page.getByText('Nicht verbunden · Vertragstests erfolgreich')).toBeVisible();
 await page.getByLabel('Marktplatz / Land').selectOption('kaufland-de');
 await expect(page.getByRole('heading',{name:'Direktanbindung · Kaufland Deutschland'})).toBeVisible();
});


test('profit costs persist locally, keep history and block missing purchase costs',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Profit & Kosten',exact:true}).click();
 await expect(page.getByTestId('profit-value')).not.toHaveText('—');
 const before=await page.getByTestId('profit-value').innerText();
 await page.getByLabel('Kosten Einkauf',{exact:true}).fill('90');
 await page.getByRole('button',{name:'Kostenversion speichern',exact:true}).click();
 await expect(page.getByTestId('profit-value')).not.toHaveText(before);
 await expect(page.getByRole('status')).toContainText('Kostenversion gespeichert');
 const changed=await page.getByTestId('profit-value').innerText();await page.reload();
 await page.getByRole('button',{name:'Profit & Kosten',exact:true}).click();await expect(page.getByTestId('profit-value')).toHaveText(changed);
 await page.getByLabel('Kosten gültig ab').fill('2026-09-20');await page.getByLabel('Kosten Einkauf',{exact:true}).fill('');
 await page.getByRole('button',{name:'Kostenversion speichern',exact:true}).click();await expect(page.getByTestId('profit-value')).toHaveText('—');
 await page.getByRole('button',{name:'Demo-Kosten zurücksetzen',exact:true}).click();await expect(page.getByTestId('profit-value')).toHaveText(before);
});
test('all marketplaces and Amazon countries aggregate only in EUR with accessible originals',async({page})=>{
 await page.goto('/');await page.getByLabel('Marktplatz / Land').selectOption('amazon-all');
 await expect(page.getByTestId('listing-row')).toHaveCount(162);await expect(page.getByTestId('revenue')).toContainText('€');
 await expect(page.getByLabel('Anzeigewährung')).toBeDisabled();
 await page.getByText('Originalbeträge & Wechselkurse',{exact:true}).click();await expect(page.locator('.originals')).toContainText('PLN');
 await page.getByLabel('Marktplatz / Land').selectOption('all');await expect(page.getByTestId('listing-row')).toHaveCount(216);
 await page.getByRole('button',{name:'Profit & Kosten',exact:true}).click();await expect(page.getByTestId('profit-value')).toHaveText('—');
 await expect(page.getByTestId('profit-before-ads')).not.toHaveText('—');
});
