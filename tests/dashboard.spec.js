import {go,channels,reports} from './ui-helpers.js';
import { test, expect } from '@playwright/test';
const chooseChannels=async(page,...ids)=>{await page.getByRole('button',{name:'Auswahl leeren',exact:true}).click();for(const id of ids)await page.locator(`[data-channel="${id}"]`).check();};

test('Amazon overview, product and SKU filters, details and empty state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');await channels(page);await go(page,'Verkauf & Traffic');
  await expect(page.getByRole('heading', { name: 'Verkauf & Traffic',exact:true })).toBeVisible();
  await expect(page.getByText('Demo-Modus')).toBeVisible();
  await expect(page.getByTestId('units')).toHaveText('4.230');
  await expect(page.getByTestId('listing-row')).toHaveCount(18);
  await page.getByLabel('Modell', { exact: true }).selectOption('clouvou-bright-seat');
  await expect(page.getByTestId('listing-row')).toHaveCount(3);
  await expect(page.getByTestId('units')).toHaveText('630');
  await page.getByLabel('Listing suchen').fill('DEMO-SKU-001-FBM');
  await expect(page.getByTestId('listing-row')).toHaveCount(1);
  await expect(page.getByTestId('units')).toHaveText('180');
  await page.getByLabel('Zeitraum', {exact:true}).selectOption('7');
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
  await page.goto('/');await channels(page);await go(page,'Verkauf & Traffic');
  await go(page,'Werbung');
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/615,00\s*€/);
  const account = await page.getByTestId('account-spend').innerText();
  const assigned = await page.getByTestId('assigned-spend').innerText();
  await page.getByLabel('Modell', { exact: true }).selectOption('clouvou-bright-seat');
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/615,00\s*€/);
  await expect(page.getByTestId('account-spend')).toHaveText(account);
  await expect(page.getByTestId('assigned-spend')).not.toHaveText(assigned);
  await page.getByLabel('Zeitraum', {exact:true}).selectOption('7');
  await expect(page.getByTestId('unassigned-spend')).toHaveText(/143,50\s*€/);
  await go(page,'Erstattungen');
  await expect(page.getByRole('heading', { name: 'Erstattungen nach Listing' })).toBeVisible();
  await expect(page.getByTestId('refund-amount')).not.toHaveText('—');
  await go(page,'Produktstamm');
  await expect(page.getByRole('region', { name: 'Produktstamm', exact: true })).toContainText('Bright Seat');
  await expect(page.getByRole('region', { name: 'Produktstamm', exact: true })).toContainText('Echte SKU / ASIN noch offen');
});

test('all mobile sections fit the viewport and missing ratings are explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');await channels(page);await go(page,'Verkauf & Traffic');
  await expect(page.getByText('Nicht verfügbar', { exact: true }).first()).toBeVisible();
  for (const name of ['Gesamtüberblick', 'Marktplätze', 'Kostenpflege', 'Produktanalyse', 'Datenqualität', 'Verkauf & Traffic', 'Erstattungen', 'Werbung', 'Produktstamm', 'Profit & Marge', 'Datenquellen & APIs']) {
    await go(page,name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('catalog shows all brands and pending details without fake variants', async ({ page }) => {
  await page.goto('/');await channels(page);await go(page,'Verkauf & Traffic');
  await go(page,'Produktstamm');
  await expect(page.getByRole('region', { name: 'Markenübersicht' })).toContainText('Wintoncove');
  await expect(page.getByTestId('catalog-row')).toHaveCount(15);
  await page.getByLabel('Marke', { exact: true }).selectOption('lutivo');
  await expect(page.getByTestId('catalog-row')).toHaveCount(6);
  await expect(page.getByTestId('units')).toHaveText('—');
  await page.getByLabel('Kategorie', { exact: true }).selectOption('desks');
  await expect(page.getByTestId('catalog-row')).toHaveCount(2);
  await expect(page.getByRole('region', {name:'Produktstamm',exact:true})).toContainText('Foxtrot');
  await go(page,'Verkauf & Traffic');
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
 await page.goto('/');await channels(page);await go(page,'Verkauf & Traffic');
 await expect(page.getByRole('group',{name:'Marktplatz-Mehrfachauswahl'}).getByRole('checkbox')).toHaveCount(12);
 await chooseChannels(page,'amazon-us');
 await expect(page.getByTestId('revenue')).toContainText('€');
 await expect(page.getByTestId('revenue').locator('[title]')).toHaveAttribute('title',/\$/);
 await page.getByLabel('Anzeigewährung').selectOption('original');
 await expect(page.getByTestId('revenue')).toContainText('$');
 await chooseChannels(page,'amazon-pl');
 await expect(page.getByTestId('revenue')).toContainText('PLN');
 await chooseChannels(page,'ebay-de');
 await expect(page.getByTestId('sessions')).not.toHaveText('—');
 await expect(page.getByText('Transaktionen / Views', {exact:true}).first()).toBeVisible();
 await chooseChannels(page,'otto-de');
 await expect(page.getByTestId('sessions')).toHaveText('—');
 await expect(page.getByTestId('conversion')).toHaveText('—');
 await go(page,'Werbung');
 await expect(page.getByTestId('account-spend')).toHaveText('—');
 await go(page,'Datenquellen & APIs');
 await expect(page.getByRole('heading',{name:'Direktanbindung · OTTO'})).toBeVisible();
 await expect(page.getByText('Nicht verbunden · Vertragstests erfolgreich')).toBeVisible();
 await chooseChannels(page,'kaufland-de');
 await expect(page.getByRole('heading',{name:'Direktanbindung · Kaufland Deutschland'})).toBeVisible();
});


test('profit costs persist locally, keep history and block missing purchase costs',async({page})=>{
 await page.goto('/');await channels(page);await go(page,'Verkauf & Traffic');await go(page,'Profit & Marge');
 await expect(page.getByTestId('profit-value')).not.toHaveText('—');
 const before=await page.getByTestId('profit-value').innerText();await go(page,'Kostenpflege');
 await page.getByLabel('Kosten Einkauf',{exact:true}).fill('90');
 await page.getByRole('button',{name:'Kostenversion speichern',exact:true}).click();
 await expect(page.locator('#cost-message')).toContainText('Kostenversion gespeichert');await go(page,'Profit & Marge');
 await expect(page.getByTestId('profit-value')).not.toHaveText(before);
 const changed=await page.getByTestId('profit-value').innerText();await page.reload();
 await go(page,'Profit & Marge');await expect(page.getByTestId('profit-value')).toHaveText(changed);
 await go(page,'Kostenpflege');await page.getByLabel('Kosten gültig ab').fill('2026-09-20');await page.getByLabel('Kosten Einkauf',{exact:true}).fill('');
 await page.getByRole('button',{name:'Kostenversion speichern',exact:true}).click();await go(page,'Profit & Marge');await expect(page.getByTestId('profit-value')).toHaveText('—');
 await go(page,'Kostenpflege');await page.getByRole('button',{name:'Demo-Kosten zurücksetzen',exact:true}).click();await go(page,'Profit & Marge');await expect(page.getByTestId('profit-value')).toHaveText(before);
});
test('all marketplaces and Amazon countries aggregate only in EUR with accessible originals',async({page})=>{
 await page.goto('/');await channels(page);await go(page,'Verkauf & Traffic');await page.getByRole('button',{name:'Nur Amazon',exact:true}).click();
 await expect(page.getByTestId('listing-row')).toHaveCount(162);await expect(page.getByTestId('revenue')).toContainText('€');
 await expect(page.getByLabel('Anzeigewährung')).toBeDisabled();
 await page.getByText('Originalbeträge & Wechselkurse',{exact:true}).click();await expect(page.locator('.originals')).toContainText('PLN');
 await page.getByRole('button',{name:'Alle auswählen',exact:true}).click();await expect(page.getByTestId('listing-row')).toHaveCount(216);
 await go(page,'Profit & Marge');await expect(page.getByTestId('profit-value')).toHaveText('—');
 await expect(page.getByTestId('profit-before-ads')).not.toHaveText('—');
});


test('free tile combinations force EUR only for mixed currencies and handle an empty selection',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await channels(page);
 await go(page,'Marktplätze');await chooseChannels(page,'amazon-us');await page.getByLabel('Anzeigewährung').selectOption('original');
 await expect(page.getByTestId('blended-spend')).toContainText('$');
 await page.getByRole('checkbox',{name:'Amazon Deutschland',exact:true}).check();
 await expect(page.getByLabel('Anzeigewährung')).toBeDisabled();await expect(page.getByTestId('blended-spend')).toContainText('€');
 await expect(page.getByTestId('channel-comparison')).toHaveCount(2);
 await page.getByRole('checkbox',{name:'Amazon Frankreich',exact:true}).check();await expect(page.getByTestId('channel-comparison')).toHaveCount(3);
 await expect(page.getByTestId('blended-roas')).not.toHaveText('—');await expect(page.getByTestId('blended-acos')).not.toHaveText('—');
 await page.getByRole('checkbox',{name:'eBay Deutschland',exact:true}).check();await expect(page.getByTestId('blended-spend')).toHaveText('—');await expect(page.getByTestId('blended-tacos')).toHaveText('—');
 await expect(page.locator('#content [role=status]')).toContainText('3 / 4');
 await page.getByRole('button',{name:'Auswahl leeren',exact:true}).click();await expect(page.getByRole('heading',{name:'Wähle mindestens einen Marktplatz'})).toBeVisible();
 const de=page.getByRole('checkbox',{name:'Amazon Deutschland',exact:true});await de.focus();await page.keyboard.press('Space');await expect(de).toBeChecked();await expect(page.getByTestId('blended-roas')).not.toHaveText('—');expect(errors).toEqual([]);
});
test('channel drilldown restores the precise previous selection and account KPIs explain product scope',async({page})=>{
 await page.goto('/');await channels(page);await chooseChannels(page,'amazon-de','amazon-us','kaufland-de');
 await go(page,'Verkauf & Traffic');await page.getByLabel('Modell',{exact:true}).selectOption('clouvou-bright-seat');await go(page,'Marktplätze');
 await expect(page.locator('.overview-intro')).toContainText('nicht für diese Kontokennzahlen');
 await page.getByRole('button',{name:'Amazon USA einzeln analysieren',exact:true}).click();
 await expect(page.getByTestId('listing-row')).toHaveCount(3);await expect(page.getByRole('checkbox',{name:'Amazon USA',exact:true})).toBeChecked();await expect(page.getByRole('checkbox',{name:'Amazon Deutschland',exact:true})).not.toBeChecked();
 await page.getByRole('button',{name:'Zur Kanalauswahl zurück',exact:true}).click();await expect(page.getByTestId('channel-comparison')).toHaveCount(3);
 await expect(page.getByRole('checkbox',{name:'Kaufland Deutschland',exact:true})).toBeChecked();
});
