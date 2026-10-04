export async function go(page,name){await page.getByRole('button',{name:'Menü öffnen',exact:true}).click();await page.getByRole('navigation',{name:'Hauptnavigation'}).getByRole('button',{name,exact:true}).click();}
export async function channels(page){if(!await page.locator('#channel-panel').evaluate(e=>e.open))await page.locator('#channel-panel > summary').click();}
export async function reports(page){if(!await page.locator('#report-tools').evaluate(e=>e.open))await page.locator('#report-tools > summary').click();}
