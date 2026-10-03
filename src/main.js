import './style.css';
import dataUrl from './data/demo.generated.json?url';
let data;
try {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`Demo data: HTTP ${response.status}`);
  data = await response.json();
} catch (error) {
  document.querySelector('#app').innerHTML = '<main class="load-error"><h1>Demodaten konnten nicht geladen werden</h1><p>Bitte lade die Seite erneut.</p></main>';
  throw error;
}
import {euroData} from '../profit/fx.js';
import {profitView,bindProfit,loadDemoCosts} from './profit.js';
import { analytics, adTypes } from './analytics.js';
import { selectCatalog } from './catalog.js';
import { sourcesView } from './sources.js';
import integrationUrl from './data/integrations.generated.json?url';
const integrationResponse=await fetch(integrationUrl);
if(!integrationResponse.ok)throw new Error('Integration fixture manifest could not be loaded');
const integrationData=await integrationResponse.json();
const eurData=euroData(data);
const costState=loadDemoCosts(data);
let activeAccount=data.accounts.find(a=>a.id===data.accountId);

const formatMoney=(v,currency)=>v==null?'—':new Intl.NumberFormat('de-DE',{style:'currency',currency}).format(v/100);
const money=(v,original)=>{const shown=formatMoney(v,activeAccount.currency);return original?`<span class="original-amount" tabindex="0" title="${escape(original)}" aria-label="${escape(shown+' · Original: '+original)}">${shown}</span>`:shown;};
const number = v => v == null ? '—' : new Intl.NumberFormat('de-DE').format(v);
const percent = v => v == null ? '—' : new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 }).format(v);
const escape = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let view = 'sales';
const tabs = { sales: 'Verkauf & Traffic', refunds: 'Erstattungen', ads: 'Werbung', catalog: 'Produktstamm', profit: 'Profit & Kosten', sources: 'Datenquellen & APIs' };
const metric = (name, value, note, id, primary = false) => `<article class="metric ${primary ? 'primary' : ''}"><p>${name}</p><strong ${id ? `data-testid="${id}"` : ''}>${value}</strong><small>${note}</small></article>`;
const sumAds = rows => rows.reduce((n, r) => n + r.spend_cents, 0);
const rating = row => row.rating?.rating == null ? '<span class="muted">Nicht verfügbar</span>' : `<span class="stars">★</span> ${number(row.rating.rating)} <small>(${number(row.rating.rating_count)})</small><small class="subline">Stand ${escape(row.rating.date)}</small>`;

document.querySelector('#app').innerHTML = `
  <aside><a class="brand" href="./"><span class="logo">mp</span> Marketplace</a><p class="nav-label">VERKAUFSKANAL</p><a class="active" href="#overview" aria-current="page"><span class="amazon-icon">a</span> <span id="active-channel">Amazon DE</span></a><div class="aside-note">Drei Marken.<br>Ein Überblick.<small>Clouvou · Lutivo · Wintoncove</small></div></aside>
  <main id="overview">
    <header><span>WORKSPACE / MARKETPLACE BI</span><span class="demo">● Demo-Modus</span></header>
    <section class="heading"><div><p class="eyebrow"><span id="channel-heading">AMAZON · DEUTSCHLAND</span></p><h1>Deine Listings im Überblick.</h1><p>Clouvou, Lutivo & Wintoncove. Euer Sortiment über Amazon, eBay, OTTO und Kaufland.</p></div></section>
    <div class="notice"><strong>Beispieldaten · September 2026.</strong> Marken und Modelle stammen aus eurem Katalog. Kennzahlen, Bewertungen und alle mit DEMO gekennzeichneten IDs sind erfunden. Keine Live-Anbindung; echte Listing-IDs und SKUs bleiben offen. Originalwährungen bleiben erhalten; die EUR-Anzeige verwendet ausdrücklich simulierte Tageskurse.</div>
    <section class="brand-overview" aria-label="Markenübersicht">${data.catalog.brands.map(b => {
      const count = data.catalog.models.filter(m => m.brand_id === b.id).length;
      return `<article><span class="brand-wordmark">${escape(b.name)}</span><small>${count ? `${count} benannte Modelle` : '5 Bürostuhlmodelle · Namen folgen'}</small></article>`;
    }).join('')}</section>
    <section class="filters" aria-label="Filter">
      <label>Marktplatz / Land<select id="account" aria-label="Marktplatz / Land"><option value="all">Alle Marktplätze · EUR</option><option value="amazon-all">Amazon · alle Länder · EUR</option>${data.accounts.map(a=>`<option value="${escape(a.id)}">${escape(a.name.replace(' · Demo',''))} · ${escape(a.currency)}</option>`).join('')}</select></label>
      <label>Anzeigewährung<select id="display-currency" aria-label="Anzeigewährung"><option value="eur">Euro (EUR)</option><option value="original">Originalwährung</option></select></label>
      <label>Zeitraum<select id="period" aria-label="Zeitraum"><option value="30">01.–30. September 2026</option><option value="7">24.–30. September 2026</option></select></label>
      <label>Marke<select id="brand" aria-label="Marke"><option value="all">Alle Marken</option>${data.catalog.brands.map(b => `<option value="${escape(b.id)}">${escape(b.name)}</option>`).join('')}</select></label>
      <label>Kategorie<select id="category" aria-label="Kategorie"><option value="all">Alle Kategorien</option>${data.catalog.categories.map(c => `<option value="${escape(c.id)}">${escape(c.name)}</option>`).join('')}</select></label>
      <label>Modell<select id="product" aria-label="Modell"></select></label>
      <label class="search-label">Listing suchen<input id="search" type="search" placeholder="ASIN, SKU oder Produktname" aria-label="Listing suchen"></label>
      <button id="reset">Zurücksetzen</button>
    </section>
    <p class="fx-note">EUR-Umrechnung mit synthetischen Demo-Tageskursen. Keine echten Marktkurse. Originalbeträge per Hover oder unter „Originalbeträge & Wechselkurse“.</p>
    <p id="coverage" class="coverage" aria-live="polite"></p>
    <div id="summary" aria-live="polite"></div>
    <nav class="tabs" aria-label="Auswertungsbereich">${Object.entries(tabs).map(([id, label]) => `<button data-view="${id}" aria-pressed="${id === view}">${label}</button>`).join('')}</nav>
    <div id="content"></div>
    <details class="definitions"><summary>So werden die Kennzahlen berechnet</summary><dl>
      <dt>Umsatz & Sales</dt><dd>Bestellumsatz vor Erstattungen, Werbekosten und Gebühren. Sales = verkaufte Einheiten, nicht Anzahl Bestellungen. Keine Gewinnkennzahl.</dd>
      <dt>Sessions & Conversion Rate</dt><dd>Sessions auf Child-ASIN-Ebene. Conversion Rate = verkaufte Einheiten ÷ Sessions (Amazon Unit Session Percentage). Summenquotient über den Zeitraum, kein Mittelwert der Tagesraten. Über mehrere ASINs sind Sessions nicht besucherübergreifend dedupliziert.</dd>
      <dt>Erstattungen & Erstattungsrate</dt><dd>Erstattungsbetrag und erstattete Einheiten nach Erstattungsdatum. Rate = erstattete Einheiten ÷ verkaufte Einheiten im selben Zeitraum. Kein Bezug auf dieselbe Bestellkohorte; kann bei zeitversetzten Erstattungen über 100 % liegen.</dd>
      <dt>Bewertungen</dt><dd>Letzter verfügbarer Bewertungsstand bis zum Periodenende, einschließlich Bewertungsanzahl und Stichtag. Kein Durchschnitt über verschiedene ASINs. Fehlende Werte werden als nicht verfügbar angezeigt.</dd>
      <dt>Werbeausgaben</dt><dd>Nach Ausgabedatum und Werbetyp. Nur eindeutig zugeordnete Kosten erscheinen bei einer ASIN. Kosten ohne eindeutigen ASIN-Bezug bleiben auf Kontoebene; Marken-, Produkt- und Suchfilter verändern diese nicht. Der Kontofilter wählt dagegen das zugehörige Konto. Keine künstliche Verteilung und keine Ableitung organischer Sales aus Werbeberichten mit abweichenden Attributionsfenstern.</dd>
      <dt>Fehlende Daten</dt><dd>Ein Strich bedeutet nicht verfügbar, nicht null Euro. Bei fehlenden Tageskennzahlen wird keine vollständige Periodensumme vorgetäuscht. Unterschiedliche Währungen und Amazon-Länder werden nicht vermischt.</dd>
    </dl></details>
    <footer>MP Dashboard <span>Marketplace BI · Demo · Datenstand 30.09.2026</span></footer>
  </main>
  <dialog id="listing-dialog" aria-labelledby="detail-title"><div id="detail-content"></div></dialog>`;

function listingCell(row) {
  return `<span class="subline">${escape(data.accounts.find(a=>a.id===row.account_id).name.replace(' · Demo',''))}</span><button class="listing-link" data-listing="${escape(row.id)}">${escape(row.title)}</button><span class="subline mono">${escape(row.external_id)}</span>`;
}
function table(headers, rows, label) {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${label}"><table><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function render() {
  const accountId=document.querySelector('#account').value;
  const accounts=data.accounts.filter(a=>accountId==='all'||accountId==='amazon-all'&&a.marketplace==='amazon'||a.id===accountId);
  const accountIds=accounts.map(a=>a.id);
  const selector=document.querySelector('#display-currency');
  selector.querySelector('[value=original]').disabled=accounts.length>1;
  selector.disabled=accounts.length>1;
  if(accounts.length>1)selector.value='eur';
  const eur=selector.value==='eur';
  activeAccount=accounts.length===1?{...accounts[0],currency:eur?'EUR':accounts[0].currency}:{id:accountId,name:accountId==='all'?'Alle Marktplätze':'Amazon · alle Länder',currency:'EUR',marketplace:accountId==='all'?'mixed':'amazon'};
  document.querySelector('#active-channel').textContent=activeAccount.name.replace(' · Demo','');
  document.querySelector('#channel-heading').textContent=activeAccount.name.replace(' · Demo','');
  const isAmazon=activeAccount.marketplace==='amazon';
  const isEbay=activeAccount.marketplace==='ebay';
  const trafficLabel=activeAccount.marketplace==='mixed'?'Traffic je Kanal':isAmazon?'Sessions':'Pageviews';
  const conversionLabel=activeAccount.marketplace==='mixed'?'Conversion je Kanal':isAmazon?'Conversion Rate':isEbay?'Transaktionen / Views':'Conversion nicht verfügbar';
  const start = document.querySelector('#period').value === '7' ? '2026-09-24' : data.start;
  const productId = document.querySelector('#product').value;
  const query = document.querySelector('#search').value;
  const brandId = document.querySelector('#brand').value;
  const categoryId = document.querySelector('#category').value;
  const selection = { brandId, categoryId, productId, query };
  const catalog = selectCatalog(data, selection);
  const report = analytics(eur?eurData:data, { start, end: data.end, accountId, accountIds, ...selection });
  const nativeReports=accounts.map(a=>analytics(data,{start,end:data.end,accountId:a.id,...selection}));
  const originals=field=>nativeReports.map(r=>`${r.account.name.replace(' · Demo','')}: ${formatMoney(r.metrics[field],r.account.currency)}`).join(' · ');
  const nativeRows=new Map(nativeReports.flatMap(r=>r.rows.map(l=>[l.id,{...l,currency:r.account.currency}])));
  const originalRevenue=l=>formatMoney(nativeRows.get(l.id).metrics.revenue_cents,nativeRows.get(l.id).currency);
  document.querySelector('#coverage').textContent = `${catalog.models.length} benannte Modelle in Auswahl · ${report.rows.length} Demo-Listings auf Basis bestätigter Farbvarianten. Weitere Modelle und offene Angaben findest du im Produktstamm.`;
  const m = report.metrics;
  document.querySelector('#summary').innerHTML = `<section class="metrics" aria-label="Verkauf und Traffic">
    ${metric('Umsatz', money(m.revenue_cents,originals('revenue_cents')), 'Vor Erstattungen & Gebühren', 'revenue', true)}
    ${metric('Sales', number(m.units), 'Verkaufte Einheiten', 'units')}
    ${metric(trafficLabel, number(isAmazon?m.sessions:m.page_views), isAmazon?'Summe der Listing-Sessions':'Kein Ersatz für Amazon-Sessions', 'sessions')}
    ${metric(conversionLabel, percent(isAmazon?m.conversion:m.transactionViewRate), isAmazon?'Einheiten ÷ Sessions':isEbay?'Transaktionen ÷ Pageviews':'Keine bestätigte Traffic-Quelle', 'conversion')}
  </section><details class="originals"><summary>Originalbeträge & Wechselkurse</summary><p>Bestellumsatz: ${escape(originals('revenue_cents'))}</p><p>Erstattungen: ${escape(originals('refund_cents'))}</p><p>Jeder Tagesbetrag wird mit seinem Tageskurs in EUR umgerechnet. Beispielkurse am ${data.end}: ${data.fx.filter(r=>r.date===data.end&&accounts.some(a=>a.currency===r.currency)).map(r=>`1 ${r.currency} = ${r.rate} EUR`).join(' · ')||'EUR unverändert'}. Quelle: synthetische Demodaten.</p></details>`;
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  let html = '';
  const head = (title, note) => `<div class="panel-heading"><h2>${title}</h2><span>${note}</span></div>`;
  if (view === 'profit') { html=profitView({data,rows:report.rows,accountIds,start,end:data.end,eur,costState});
  } else if (view === 'sources') { html = accounts.map(a=>sourcesView(a,integrationData.results)).join('');
  } else if (view === 'sales') {
    html = `<section class="panel">${head('Listing-Performance', `${report.rows.length} Demo-Listings · Bewertungen nur mit geeigneter Quelle`)}${table(['Listing / externe ID', 'Bewertung', trafficLabel, conversionLabel, 'Sales · Einheiten', 'Umsatz'], report.rows.map(r => `<tr data-testid="listing-row"><td>${listingCell(r)}</td><td>${rating(r)}</td><td>${number(data.accounts.find(a=>a.id===r.account_id).marketplace==='amazon'?r.metrics.sessions:r.metrics.page_views)}</td><td>${percent(data.accounts.find(a=>a.id===r.account_id).marketplace==='amazon'?r.metrics.conversion:r.metrics.transactionViewRate)}</td><td>${number(r.metrics.units)}</td><td class="amount">${money(r.metrics.revenue_cents,originalRevenue(r))}<small class="subline">Ø Preis ${money(r.metrics.units?r.metrics.revenue_cents/r.metrics.units:null,formatMoney(nativeRows.get(r.id).metrics.units?nativeRows.get(r.id).metrics.revenue_cents/nativeRows.get(r.id).metrics.units:null,nativeRows.get(r.id).currency))}</small><details><summary>Originalbetrag</summary>${escape(originalRevenue(r))} · ${escape(nativeRows.get(r.id).currency)}</details></td></tr>`), 'Listing-Performance')}</section>`;
  } else if (view === 'refunds') {
    html = `<section class="metrics secondary">${metric('Erstattungsbetrag', money(m.refund_cents), 'Im gewählten Zeitraum', 'refund-amount')}${metric('Erstattete Einheiten', number(m.refunded_units), 'Nach Erstattungsdatum')}${metric('Erstattungsrate', percent(m.refundRate), 'Periodenquote, keine Bestellkohorte')}</section><section class="panel">${head('Erstattungen nach Listing', 'Erstattungsdatum · ohne Kohortenzuordnung')}${table(['Listing / ASIN', 'Sales · Einheiten', 'Erstattete Einheiten', 'Erstattungsbetrag', 'Erstattungsrate'], report.rows.map(r => `<tr><td>${listingCell(r)}</td><td>${number(r.metrics.units)}</td><td>${number(r.metrics.refunded_units)}</td><td>${money(r.metrics.refund_cents)}</td><td>${percent(r.metrics.refundRate)}</td></tr>`), 'Erstattungen')}</section>`;
  } else if (view === 'ads') {
    html = `<section class="metrics secondary">${metric('Listing-zugeordnete Kosten', money(report.assignedSpend), 'Für die gefilterten Listings', 'assigned-spend')}${metric('Nicht zuordenbare Kosten', money(report.unassignedSpend), 'Gesamtes Konto · nur Zeitraumfilter', 'unassigned-spend')}${metric('Werbeausgaben · Konto gesamt', money(report.accountSpend), 'Alle Listings + nicht zuordenbar', 'account-spend')}</section>
      <section class="panel">${head('Werbeausgaben nach Werbetyp', 'Keine pauschale Verteilung auf Produkte')}${table(['Werbetyp', 'ASIN-zugeordnet · Auswahl', 'Nicht zuordenbar · Konto'], report.adBreakdown.map(a => `<tr><td>${a.name}</td><td>${money(a.assigned)}</td><td>${money(a.unassigned)}</td></tr>`), 'Werbetypen')}<p class="table-note">Streaming TV wird in dieser Demo nur auf Kontoebene berichtet. „—“ bedeutet: kein zugehöriger Datensatz vorhanden.</p></section>
      <section class="panel">${head('Werbekosten nach Listing', 'Nur Kosten mit eindeutigem Listing-Bezug')}${table(['Listing / ASIN', 'Sponsored Products', 'Sponsored Brands', 'Sponsored Display', 'Streaming TV', 'Sonstige', 'Gesamt'], report.rows.map(r => `<tr><td>${listingCell(r)}</td>${Object.keys(adTypes).map(type => `<td>${r.ads.some(a => a.ad_type === type) ? money(sumAds(r.ads.filter(a => a.ad_type === type))) : '—'}</td>`).join('')}<td>${r.ads.length ? money(sumAds(r.ads)) : '—'}</td></tr>`), 'Werbekosten nach Listing')}</section>
      <div class="notice"><strong>Nicht zuordenbar bleibt separat.</strong> In diesen Beispieldaten fehlt für einen Teil der Kampagnen der eindeutige ASIN-Bezug. Diese Kosten bleiben auch bei Produktauswahl sichtbar und werden keinem Produkt zugeschlagen.</div>`;
  } else {
    html = `<section class="panel">${head('Euer Produktstamm', 'Bestätigte Modelle · keine echten Marketplace-Zuordnungen')}<p class="table-note">Alle 15 benannten Modelle sind erfasst. Kennzahlen werden vorerst nur für die 18 bestätigten Clouvou-Bürostuhlvarianten simuliert. Fehlende Varianten bleiben offen; interne SKUs und Amazon-Zuordnungen wurden noch nicht geliefert.</p>${table(['Marke', 'Modell', 'Kategorie', 'Bestätigte Varianten / Angaben', 'Datenstand'], catalog.models.map(p => {
      const brand = data.catalog.brands.find(b => b.id === p.brand_id);
      const category = data.catalog.categories.find(c => c.id === p.category_id);
      const variants = data.catalog.variants.filter(v => v.model_id === p.id);
      const info = variants.length ? variants.map(v => v.color).join(' · ') : p.category_id === 'desks' ? `${p.size_option_count === 2 ? '2 Größen' : 'Mehrere Größen'} · Maße und Farbkombinationen folgen` : 'Farben und Varianten folgen';
      return `<tr data-testid="catalog-row"><td>${escape(brand.name)}</td><td><strong>${escape(p.name)}</strong></td><td>${escape(category.name)}</td><td class="catalog-description">${escape(info)}</td><td><span class="status ${variants.length ? '' : 'pending'}">${variants.length ? `${variants.length} Farbvarianten bestätigt` : 'Varianten offen'}</span><span class="subline">Echte SKU / ASIN noch offen</span></td></tr>`;
    }), 'Produktstamm')}</section>`;
    if (catalog.groups.length) html += `<section class="panel">${head('Noch zu ergänzen', 'Keine erfundenen Artikel oder Varianten')}<div class="pending-grid">${catalog.groups.map(g => `<article><p class="eyebrow">${escape(data.catalog.brands.find(b => b.id === g.brand_id).name)}</p><h3>${escape(data.catalog.categories.find(c => c.id === g.category_id).name)}</h3><p>${g.confirmed_model_count ? `${g.confirmed_model_count} Modelle · Namen und Varianten folgen.` : g.category_id === 'gaming-chairs' ? 'Geplante Erweiterung · Modelle und Varianten folgen.' : 'Konkrete Artikel folgen. Beispiele: Mauspad, Stehmatte, Sitzkissen, Fußstütze.'}</p></article>`).join('')}</div></section>`;
  }
  if (!report.rows.length && view !== 'catalog' && view !== 'sources') html = `<div class="empty" role="status"><h2>Keine Demo-Listings in dieser Auswahl</h2><p>${catalog.models.length || catalog.groups.length ? 'Das Sortiment ist vorgemerkt. Varianten und echte Marketplace-Zuordnungen sind noch offen; deshalb werden hier keine Kennzahlen erfunden.' : 'Suche oder Filter anpassen. Fehlende Daten sind keine Nullverkäufe.'}</p><button id="open-catalog">Produktstamm ansehen</button></div>` + (view === 'ads' ? html : '');
  if (view === 'catalog' && !catalog.models.length && !catalog.groups.length) html = '<div class="empty" role="status"><h2>Keine Modelle gefunden</h2><p>Suche oder Filter anpassen.</p></div>';
  document.querySelector('#content').innerHTML = html;
  if(view==='profit')bindProfit({data,rows:report.rows,costState,render});
  document.querySelector('#open-catalog')?.addEventListener('click', () => { view = 'catalog'; render(); });
  document.querySelectorAll('[data-listing]').forEach(b => b.addEventListener('click', () => {
    showDetail(report.rows.find(r => r.id === b.dataset.listing));
  }));
}
function showDetail(row) {
  const m = row.metrics;
  const dialog = document.querySelector('#listing-dialog');
  document.querySelector('#detail-content').innerHTML = `<div class="panel-heading"><div><p class="eyebrow">${escape(activeAccount.name.replace(' · Demo',''))} · ${escape(row.external_id)}</p><h2 id="detail-title">${escape(row.title)}</h2></div><button id="close-detail" aria-label="Details schließen">Schließen ×</button></div>
    <p class="table-note">Synthetisches Demo-Listing · echte SKU/ASIN-Zuordnung noch offen.<br>${escape(row.product.name)} · ${escape(row.product.internal_sku)}<br>${row.skus.map(s => escape(s.sku)).join(' · ')}</p>
    <h3>Verkauf & Traffic</h3><section class="metrics">${metric('Umsatz', money(m.revenue_cents), 'Bestellumsatz')}${metric('Sales', number(m.units), 'Verkaufte Einheiten')}${metric(activeAccount.marketplace==='amazon'?'Sessions':'Pageviews', number(activeAccount.marketplace==='amazon'?m.sessions:m.page_views), 'Definition abhängig vom Kanal')}${metric('Conversion', percent(activeAccount.marketplace==='amazon'?m.conversion:m.transactionViewRate), activeAccount.marketplace==='amazon'?'Einheiten ÷ Sessions':'Transaktionen ÷ Pageviews')}</section>
    <h3>Bewertungen & Erstattungen</h3><p>Bewertung: ${rating(row)}</p><section class="metrics secondary">${metric('Erstattungsbetrag', money(m.refund_cents), 'Nach Erstattungsdatum')}${metric('Erstattete Einheiten', number(m.refunded_units), 'Im gewählten Zeitraum')}${metric('Erstattungsrate', percent(m.refundRate), 'Periodenquote')}</section>
    <h3>Werbeausgaben · nur diesem Listing zugeordnet</h3>${table(['Werbetyp', 'Ausgaben'], Object.entries(adTypes).map(([type,name]) => `<tr><td>${name}</td><td>${row.ads.some(a => a.ad_type === type) ? money(sumAds(row.ads.filter(a => a.ad_type === type))) : '—'}</td></tr>`), 'Listing-Werbung')}`;
  document.querySelector('#close-detail').addEventListener('click', () => dialog.close());
  dialog.showModal();
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; render(); }));
function updateModels() {
  const current = document.querySelector('#product').value;
  const { models } = selectCatalog(data, { brandId: document.querySelector('#brand').value, categoryId: document.querySelector('#category').value });
  document.querySelector('#product').innerHTML = `<option value="all">Alle Modelle</option>${models.map(m => `<option value="${escape(m.id)}">${escape(m.name)}</option>`).join('')}`;
  if (models.some(m => m.id === current)) document.querySelector('#product').value = current;
}
for (const id of ['brand', 'category']) document.querySelector(`#${id}`).addEventListener('change', () => { updateModels(); render(); });
for (const id of ['account', 'period', 'product','display-currency']) document.querySelector(`#${id}`).addEventListener('change', render);
document.querySelector('#search').addEventListener('input', render);
document.querySelector('#reset').addEventListener('click', () => {
  document.querySelector('#period').value = '30';
  document.querySelector('#brand').value = 'all';
  document.querySelector('#category').value = 'all';
  updateModels();
  document.querySelector('#product').value = 'all';
  document.querySelector('#search').value = '';
  render();
});
document.querySelector('#account').value=data.accountId;
updateModels();
render();
