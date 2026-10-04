import {test,expect} from '@playwright/test';
import {channels} from './ui-helpers.js';
test.use({viewport:{width:390,height:844}});

test('mobile home links KPIs and products directly while preserving channel and period context',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.getByRole('button',{name:'7 Tage',exact:true}).click();await channels(page);await page.getByRole('checkbox',{name:'Amazon USA',exact:true}).check();await page.locator('#channel-panel > summary').click();
 await page.getByRole('button',{name:'Umsatz nach Produkten aufschlüsseln'}).click();await expect(page).toHaveURL(/#\/products$/);await expect(page.locator('[data-period="7"]')).toHaveAttribute('aria-pressed','true');await expect(page.getByTestId('product-analysis-row')).toHaveCount(6);
 await page.getByRole('group',{name:'Produkte ordnen'}).getByRole('button',{name:'Wachstum',exact:true}).click();await expect(page.locator('[data-product-sort="growth"]')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('navigation',{name:'Schnellnavigation'}).getByRole('button',{name:'Übersicht',exact:true}).click();await page.getByRole('button',{name:'Pro Seat Produktdetails öffnen'}).click();await expect(page.getByRole('dialog',{name:'Pro Seat',exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toContainText('Amazon USA');
 await page.getByRole('button',{name:'Dieses Modell in Listings öffnen'}).click();await expect(page.getByTestId('listing-row')).toHaveCount(6);await expect(page.locator('[data-period="7"]')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('navigation',{name:'Schnellnavigation'}).getByRole('button',{name:'Übersicht',exact:true}).click();await page.locator('[data-home-page="profit"]').click();await expect(page.getByTestId('profit-value')).toBeVisible();await expect(page.locator('#cost-form')).toHaveCount(0);
 await page.getByRole('button',{name:'Weitere Bereiche öffnen'}).click();await page.getByRole('button',{name:'Kostenpflege',exact:true}).click();await expect(page.locator('#cost-form')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});

test('mobile chart, filter controls and missing spend remain usable without hidden dropdowns',async({page})=>{
 await page.goto('/');await page.getByRole('group',{name:'Trend auswählen'}).getByRole('button',{name:'Einheiten',exact:true}).click();await expect(page.locator('#trend-readout')).toContainText('2026-09-01');await page.getByRole('button',{name:'Nächster Tag'}).click();await expect(page.locator('#trend-readout')).toContainText('2026-09-02');
 await page.getByRole('button',{name:'Eigener Zeitraum',exact:true}).click();await expect(page.getByLabel('Zeitraum von',{exact:true})).toBeVisible();await page.getByLabel('Zeitraum von',{exact:true}).fill('2026-09-24');await page.getByRole('button',{name:'Filter & Vergleich',exact:true}).click();await expect(page.getByLabel('Zeitraum von',{exact:true})).not.toBeVisible();
 await channels(page);await page.getByRole('checkbox',{name:'OTTO',exact:true}).check();await page.locator('#channel-panel > summary').click();await expect(page.getByTestId('home-spend')).toHaveText('—');await expect(page.locator('.coverage-link')).toContainText('unvollständig');await page.locator('[data-home-page="ads"]').click();await expect(page.getByTestId('account-spend')).toHaveText('—');
 await page.getByRole('navigation',{name:'Schnellnavigation'}).getByRole('button',{name:'Produkte',exact:true}).click();await page.getByLabel('Listing suchen').fill('Bright');await expect(page.getByTestId('product-analysis-row')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
