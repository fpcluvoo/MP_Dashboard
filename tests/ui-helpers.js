export async function go(page,name){const trigger=page.getByRole('button',{name:'Menü öffnen',exact:true});if(await trigger.isVisible())await trigger.click();else await page.getByRole('button',{name:'Weitere Bereiche öffnen'}).click();await page.getByRole('navigation',{name:'Hauptnavigation'}).getByRole('button',{name,exact:true}).click();}
export async function channels(page){if(!await page.locator('#channel-panel').evaluate(e=>e.open))await page.locator('#channel-panel > summary').click();}
export async function reports(page){if(!await page.locator('#report-tools').evaluate(e=>e.open))await page.locator('#report-tools > summary').click();}

export async function period(page,value){const quick=page.locator(`[data-period="${value}"]`);if(await quick.isVisible())await quick.click();else await page.getByLabel('Zeitraum',{exact:true}).selectOption(value);}
