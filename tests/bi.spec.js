import {go,channels,reports} from './ui-helpers.js';
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('time comparison, accessible chart, product drilldown and invalid ranges',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await channels(page);
 await expect(page.getByTestId('comparison-revenue')).not.toHaveText('Nicht vergleichbar');
 await page.getByLabel('Trend-Kennzahl').selectOption('units');
 await page.locator('[data-trend-index="0"]').focus();await expect(page.locator('#trend-readout')).toContainText('2026-09-01');
 await expect(page.locator('#trend-readout')).toContainText('2026-08-02');
 await page.getByText('Tageswerte als Tabelle',{exact:true}).click();await expect(page.locator('.trend-values tbody tr')).toHaveCount(30);
 await go(page,'Produktanalyse');await expect(page.getByTestId('product-analysis-row')).toHaveCount(6);
 await page.getByLabel('Produkte sortieren').selectOption('growth');
 await page.getByRole('button',{name:'Bright Seat ↗',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('DEMO-SKU-001-FBM');
 await page.getByRole('button',{name:'Dieses Modell in Listings öffnen'}).click();await expect(page.getByTestId('listing-row')).toHaveCount(3);
 await page.getByLabel('Zeitraum',{exact:true}).selectOption('custom');await page.getByLabel('Zeitraum von',{exact:true}).fill('2026-08-01');await page.getByLabel('Zeitraum bis',{exact:true}).fill('2026-08-07');
 await go(page,'Gesamtüberblick');await expect(page.getByTestId('comparison-revenue')).toHaveText('Nicht vergleichbar');
 await page.getByLabel('Zeitraum von',{exact:true}).fill('2026-09-01');await expect(page.locator('#content')).toContainText('Zeitraum muss');await reports(page);await expect(page.getByRole('button',{name:'Produktreport CSV'})).toBeDisabled();expect(errors).toEqual([]);
});

test('saved report restores selected channels, filters, dates and comparison after reload',async({page})=>{
 await page.goto('/');await channels(page);await page.getByRole('checkbox',{name:'Amazon USA',exact:true}).check();
 await go(page,'Produktanalyse');await page.getByLabel('Modell',{exact:true}).selectOption('clouvou-bright-seat');
 await page.getByLabel('Zeitraum',{exact:true}).selectOption('7');await page.getByLabel('Periodenvergleich').selectOption('off');
 const revenue=await page.getByTestId('revenue').innerText();
 await reports(page);await page.getByLabel('Ansicht benennen',{exact:true}).fill('US & DE Wochenreport');await page.getByRole('button',{name:'Ansicht speichern',exact:true}).click();await expect(page.locator('#report-status')).toContainText('lokal gespeichert');
 await page.reload();await reports(page);await channels(page);await page.getByLabel('Gespeicherte Ansichten',{exact:true}).selectOption({label:'US & DE Wochenreport'});await page.getByRole('button',{name:'Laden',exact:true}).click();
 await expect(page.locator('[data-view=products]')).toHaveAttribute('aria-pressed','true');await expect(page.getByTestId('product-analysis-row')).toHaveCount(1);
 await expect(page.getByRole('checkbox',{name:'Amazon USA',exact:true})).toBeChecked();await expect(page.getByLabel('Anzeigewährung')).toBeDisabled();await expect(page.getByLabel('Zeitraum von',{exact:true})).toHaveValue('2026-09-24');await expect(page.getByLabel('Periodenvergleich')).toHaveValue('off');await expect(page.getByTestId('revenue')).toHaveText(revenue);
 await page.getByRole('button',{name:'Löschen',exact:true}).click();await page.reload();await reports(page);await expect(page.getByLabel('Gespeicherte Ansichten',{exact:true}).locator('option')).toHaveCount(1);
});

test('CSV exports filtered model and selected EUR scope; quality makes incomplete advertising explicit',async({page})=>{
 await page.goto('/');await channels(page);await page.getByRole('checkbox',{name:'OTTO',exact:true}).check();await go(page,'Produktanalyse');await page.getByLabel('Modell',{exact:true}).selectOption('clouvou-bright-seat');
 await reports(page);const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Produktreport CSV'}).click();const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('MP-Demo-Produkte-2026-09-01-2026-09-30.csv');const content=await readFile(await download.path(),'utf8');expect(content.split('\r\n')).toHaveLength(2);expect(content).toContain('amazon-de | otto-de');expect(content).toContain('Bright Seat');expect(content).toContain('"Nein"');expect(content).toContain('Synthetische Tageskurse');
 await go(page,'Datenqualität');await expect(page.locator('.quality-grid')).toContainText('1 / 2');await expect(page.locator('#content')).toContainText('Keine echte Kontoverbindung.');
 await page.emulateMedia({media:'print'});await expect(page.locator('.report-toolbar')).not.toBeVisible();await expect(page.locator('#report-meta')).toBeVisible();
});
