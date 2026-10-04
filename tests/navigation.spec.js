import {test,expect} from '@playwright/test';
import {go,channels,period} from './ui-helpers.js';

test('drawer supports keyboard, focus, direct page links, reload and browser history',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('#page-title')).toHaveText('Gesamtüberblick');await expect(page.locator('#channel-panel')).not.toHaveAttribute('open','');
 await expect(page.locator('.trend-panel')).toBeVisible();await expect(page.getByTestId('blended-roas')).toHaveCount(0);await expect(page.locator('#cost-form')).toHaveCount(0);
 const trigger=page.getByRole('button',{name:'Menü öffnen'});await trigger.focus();await page.keyboard.press('Enter');await expect(trigger).toHaveAttribute('aria-expanded','true');
 await expect(page.getByRole('dialog',{name:'Navigation'})).toBeVisible();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');
 await go(page,'Kostenpflege');await expect(page).toHaveURL(/#\/costs$/);await expect(page.locator('#page-title')).toBeFocused();await expect(page.locator('#cost-form')).toBeVisible();await expect(page.getByLabel('Zeitraum',{exact:true})).not.toBeVisible();await expect(page.locator('#summary')).not.toBeVisible();
 await page.reload();await expect(page.locator('#page-title')).toHaveText('Kostenpflege');await expect(page.locator('#cost-form')).toBeVisible();
 await go(page,'Profit & Marge');await expect(page.locator('#cost-form')).toHaveCount(0);await expect(page.getByTestId('profit-value')).toBeVisible();
 await page.goBack();await expect(page.locator('#page-title')).toHaveText('Kostenpflege');await page.goForward();await expect(page.locator('#page-title')).toHaveText('Profit & Marge');
 await page.goto('/#/markets');await expect(page.getByTestId('blended-roas')).toBeVisible();await expect(page.locator('.trend-panel')).toHaveCount(0);
 await channels(page);await page.getByRole('button',{name:'Auswahl leeren',exact:true}).click();await page.getByRole('checkbox',{name:'Amazon USA',exact:true}).check();await page.getByLabel('Anzeigewährung').selectOption('original');await go(page,'Produktstamm');await go(page,'Verkauf & Traffic');await expect(page.getByLabel('Anzeigewährung')).toHaveValue('original');await expect(page.getByTestId('revenue')).toContainText('$');expect(errors).toEqual([]);
});

test('cost page retains the edited SKU, updates separate profit page and remains usable with invalid analysis dates',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/#/costs');
 await page.getByLabel('Kosten-SKU').selectOption('1');await page.getByLabel('Kosten Einkauf',{exact:true}).fill('99');await page.getByRole('button',{name:'Kostenversion speichern',exact:true}).click();await expect(page.getByLabel('Kosten-SKU')).toHaveValue('1');await expect(page.getByLabel('Kosten Einkauf',{exact:true})).toHaveValue('99.000000');
 await go(page,'Profit & Marge');const changed=await page.getByTestId('profit-value').innerText();await go(page,'Kostenpflege');await expect(page.getByLabel('Kosten-SKU')).toHaveValue('1');await page.getByRole('button',{name:'Demo-Kosten zurücksetzen'}).click();await go(page,'Profit & Marge');await expect(page.getByTestId('profit-value')).not.toHaveText(changed);
 await period(page,'custom');await page.getByLabel('Zeitraum von',{exact:true}).fill('2026-09-30');await page.getByLabel('Zeitraum bis',{exact:true}).fill('2026-09-01');await expect(page.locator('#content')).toContainText('Zeitraum muss');
 await go(page,'Kostenpflege');await expect(page.locator('#cost-form')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await channels(page);await page.getByRole('button',{name:'Auswahl leeren',exact:true}).click();await go(page,'Produktstamm');await expect(page.getByTestId('catalog-row')).toHaveCount(15);
});
