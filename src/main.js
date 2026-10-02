import './style.css';
import data from './data/demo.generated.json';
import { analytics, adTypes } from './analytics.js';

const money = v => v == null ? '—' : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v / 100);
const number = v => v == null ? '—' : new Intl.NumberFormat('de-DE').format(v);
const percent = v => v == null ? '—' : new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 }).format(v);
const escape = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let view = 'sales';
const tabs = { sales: 'Verkauf & Traffic', refunds: 'Erstattungen', ads: 'Werbung', catalog: 'Produktstamm' };
const metric = (name, value, note, id, primary = false) => `<article class="metric ${primary ? 'primary' : ''}"><p>${name}</p><strong ${id ? `data-testid="${id}"` : ''}>${value}</strong><small>${note}</small></article>`;
const sumAds = rows => rows.reduce((n, r) => n + r.spend_cents, 0);
const rating = row => row.rating?.rating == null ? '<span class="muted">Nicht verfügbar</span>' : `<span class="stars">★</span> ${number(row.rating.rating)} <small>(${number(row.rating.rating_count)})</small><small class="subline">Stand ${escape(row.rating.date)}</small>`;

document.querySelector('#app').innerHTML = `
  <aside><a class="brand" href="./"><span class="logo">mp</span> Marketplace</a><p class="nav-label">VERKAUFSKANAL</p><a class="active" href="#overview" aria-current="page"><span class="amazon-icon">a</span> Amazon <span class="country">DE</span></a><div class="aside-note">Deine Produkte.<br>Alle Kennzahlen.<small>Amazon Workspace</small></div></aside>
  <main id="overview">
    <header><span>WORKSPACE / AMAZON DE</span><span class="demo">● Demo-Modus</span></header>
    <section class="heading"><div><p class="eyebrow">AMAZON · DEUTSCHLAND</p><h1>Deine Listings im Überblick.</h1><p>Von der ASIN zum Produkt. Verkauf, Traffic und Werbung an einem Ort.</p></div></section>
    <div class="notice"><strong>Beispieldaten · September 2026.</strong> Keine Amazon-Anbindung aktiv. ASINs, SKUs, Bewertungen und Kennzahlen sind erfunden. Alle Beträge in EUR.</div>
    <section class="filters" aria-label="Filter">
      <label>Zeitraum<select id="period" aria-label="Zeitraum"><option value="30">01.–30. September 2026</option><option value="7">24.–30. September 2026</option></select></label>
      <label>Internes Produkt<select id="product" aria-label="Internes Produkt"><option value="all">Alle Produkte</option>${data.products.map(p => `<option value="${escape(p.id)}">${escape(p.name)}</option>`).join('')}</select></label>
      <label class="search-label">Listing suchen<input id="search" type="search" placeholder="ASIN, SKU oder Produktname" aria-label="Listing suchen"></label>
      <button id="reset">Zurücksetzen</button>
    </section>
    <div id="summary" aria-live="polite"></div>
    <nav class="tabs" aria-label="Auswertungsbereich">${Object.entries(tabs).map(([id, label]) => `<button data-view="${id}" aria-pressed="${id === view}">${label}</button>`).join('')}</nav>
    <div id="content"></div>
    <details class="definitions"><summary>So werden die Kennzahlen berechnet</summary><dl>
      <dt>Umsatz & Sales</dt><dd>Bestellumsatz vor Erstattungen, Werbekosten und Gebühren. Sales = verkaufte Einheiten, nicht Anzahl Bestellungen. Keine Gewinnkennzahl.</dd>
      <dt>Sessions & Conversion Rate</dt><dd>Sessions auf Child-ASIN-Ebene. Conversion Rate = verkaufte Einheiten ÷ Sessions (Amazon Unit Session Percentage). Summenquotient über den Zeitraum, kein Mittelwert der Tagesraten. Über mehrere ASINs sind Sessions nicht besucherübergreifend dedupliziert.</dd>
      <dt>Erstattungen & Erstattungsrate</dt><dd>Erstattungsbetrag und erstattete Einheiten nach Erstattungsdatum. Rate = erstattete Einheiten ÷ verkaufte Einheiten im selben Zeitraum. Kein Bezug auf dieselbe Bestellkohorte; kann bei zeitversetzten Erstattungen über 100 % liegen.</dd>
      <dt>Bewertungen</dt><dd>Letzter verfügbarer Bewertungsstand bis zum Periodenende, einschließlich Bewertungsanzahl und Stichtag. Kein Durchschnitt über verschiedene ASINs. Fehlende Werte werden als nicht verfügbar angezeigt.</dd>
      <dt>Werbeausgaben</dt><dd>Nach Ausgabedatum und Werbetyp. Nur eindeutig zugeordnete Kosten erscheinen bei einer ASIN. Kosten ohne eindeutigen ASIN-Bezug bleiben auf Kontoebene; Produkt- und Suchfilter verändern diese nicht. Keine künstliche Verteilung und keine Ableitung organischer Sales aus Werbeberichten mit abweichenden Attributionsfenstern.</dd>
      <dt>Fehlende Daten</dt><dd>Ein Strich bedeutet nicht verfügbar, nicht null Euro. Bei fehlenden Tageskennzahlen wird keine vollständige Periodensumme vorgetäuscht. Unterschiedliche Währungen und Amazon-Länder werden nicht vermischt.</dd>
    </dl></details>
    <footer>MP Dashboard <span>Amazon DE · Demo · Datenstand 30.09.2026</span></footer>
  </main>
  <dialog id="listing-dialog" aria-labelledby="detail-title"><div id="detail-content"></div></dialog>`;

function listingCell(row) {
  return `<button class="listing-link" data-listing="${escape(row.id)}">${escape(row.title)}</button><span class="subline mono">${escape(row.external_id)}</span>`;
}
function table(headers, rows, label) {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${label}"><table><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function render() {
  const start = document.querySelector('#period').value === '7' ? '2026-09-24' : data.start;
  const productId = document.querySelector('#product').value;
  const query = document.querySelector('#search').value;
  const report = analytics(data, { start, end: data.end, productId, query });
  const m = report.metrics;
  document.querySelector('#summary').innerHTML = `<section class="metrics" aria-label="Verkauf und Traffic">
    ${metric('Umsatz', money(m.revenue_cents), 'Vor Erstattungen & Gebühren', 'revenue', true)}
    ${metric('Sales', number(m.units), 'Verkaufte Einheiten', 'units')}
    ${metric('Sessions', number(m.sessions), 'Summe der ASIN-Sessions', 'sessions')}
    ${metric('Conversion Rate', percent(m.conversion), 'Einheiten ÷ Sessions', 'conversion')}
  </section>`;
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  let html = '';
  const head = (title, note) => `<div class="panel-heading"><h2>${title}</h2><span>${note}</span></div>`;
  if (view === 'sales') {
    html = `<section class="panel">${head('Listing-Performance', `${report.rows.length} ASINs · Bewertungen zum letzten verfügbaren Stand`)}${table(['Listing / ASIN', 'Bewertung', 'Sessions', 'Conversion Rate', 'Sales · Einheiten', 'Umsatz'], report.rows.map(r => `<tr data-testid="listing-row"><td>${listingCell(r)}</td><td>${rating(r)}</td><td>${number(r.metrics.sessions)}</td><td>${percent(r.metrics.conversion)}</td><td>${number(r.metrics.units)}</td><td class="amount">${money(r.metrics.revenue_cents)}</td></tr>`), 'Listing-Performance')}</section>`;
  } else if (view === 'refunds') {
    html = `<section class="metrics secondary">${metric('Erstattungsbetrag', money(m.refund_cents), 'Im gewählten Zeitraum', 'refund-amount')}${metric('Erstattete Einheiten', number(m.refunded_units), 'Nach Erstattungsdatum')}${metric('Erstattungsrate', percent(m.refundRate), 'Periodenquote, keine Bestellkohorte')}</section><section class="panel">${head('Erstattungen nach ASIN', 'Erstattungsdatum · ohne Kohortenzuordnung')}${table(['Listing / ASIN', 'Sales · Einheiten', 'Erstattete Einheiten', 'Erstattungsbetrag', 'Erstattungsrate'], report.rows.map(r => `<tr><td>${listingCell(r)}</td><td>${number(r.metrics.units)}</td><td>${number(r.metrics.refunded_units)}</td><td>${money(r.metrics.refund_cents)}</td><td>${percent(r.metrics.refundRate)}</td></tr>`), 'Erstattungen')}</section>`;
  } else if (view === 'ads') {
    html = `<section class="metrics secondary">${metric('ASIN-zugeordnete Kosten', money(report.assignedSpend), 'Für die gefilterten Listings', 'assigned-spend')}${metric('Nicht zuordenbare Kosten', money(report.unassignedSpend), 'Gesamtes Konto · nur Zeitraumfilter', 'unassigned-spend')}${metric('Werbeausgaben · Konto gesamt', money(report.accountSpend), 'Alle ASINs + nicht zuordenbar', 'account-spend')}</section>
      <section class="panel">${head('Werbeausgaben nach Werbetyp', 'Keine pauschale Verteilung auf Produkte')}${table(['Werbetyp', 'ASIN-zugeordnet · Auswahl', 'Nicht zuordenbar · Konto'], report.adBreakdown.map(a => `<tr><td>${a.name}</td><td>${money(a.assigned)}</td><td>${money(a.unassigned)}</td></tr>`), 'Werbetypen')}<p class="table-note">Streaming TV wird in dieser Demo nur auf Kontoebene berichtet. „—“ bedeutet: kein zugehöriger Datensatz vorhanden.</p></section>
      <section class="panel">${head('Werbekosten nach ASIN', 'Nur Kosten mit eindeutigem Listing-Bezug')}${table(['Listing / ASIN', 'Sponsored Products', 'Sponsored Brands', 'Sponsored Display', 'Streaming TV', 'Sonstige', 'Gesamt'], report.rows.map(r => `<tr><td>${listingCell(r)}</td>${Object.keys(adTypes).map(type => `<td>${r.ads.some(a => a.ad_type === type) ? money(sumAds(r.ads.filter(a => a.ad_type === type))) : '—'}</td>`).join('')}<td>${money(sumAds(r.ads))}</td></tr>`), 'Werbekosten nach ASIN')}</section>
      <div class="notice"><strong>Nicht zuordenbar bleibt separat.</strong> In diesen Beispieldaten fehlt für einen Teil der Kampagnen der eindeutige ASIN-Bezug. Diese Kosten bleiben auch bei Produktauswahl sichtbar und werden keinem Produkt zugeschlagen.</div>`;
  } else {
    const selectedProducts = data.products.filter(p => report.rows.some(r => r.product_id === p.id));
    html = `<section class="panel">${head('Produktstamm & SKU-Zuordnung', 'Internes Produkt → Amazon-ASIN → Seller-SKU')}<p class="table-note">Ein Produkt bündelt mehrere ASINs. Mehrere Seller-SKUs derselben ASIN verdoppeln die Kennzahlen nicht. Die Zuordnungen sind vorbereitet; ein automatischer Amazon-Import ist noch nicht aktiv.</p>${table(['Internes Produkt', 'Interne SKU', 'Amazon-ASIN', 'Seller-SKUs', 'Umsatz · Auswahl'], selectedProducts.map(p => {
      const rows = report.rows.filter(r => r.product_id === p.id);
      const revenue = rows.every(r => r.metrics.revenue_cents != null) ? rows.reduce((n,r) => n + r.metrics.revenue_cents, 0) : null;
      return `<tr><td><strong>${escape(p.name)}</strong><small class="subline">${rows.length} ASINs in Auswahl</small></td><td class="mono">${escape(p.internal_sku)}</td><td>${rows.map(r => `<span class="subline mono">${escape(r.external_id)}</span>`).join('')}</td><td>${rows.flatMap(r => r.skus).map(s => `<span class="subline mono">${escape(s.sku)} <span class="status">${escape(s.fulfillment)}</span></span>`).join('')}</td><td>${money(revenue)}</td></tr>`;
    }), 'Produktstamm')}</section>`;
  }
  if (!report.rows.length) html = `<div class="empty" role="status"><h2>Keine Listings gefunden</h2><p>Suche oder Produktauswahl anpassen. Fehlende Werte werden nicht als Null ausgewiesen.</p></div>` + (view === 'ads' ? html : '');
  document.querySelector('#content').innerHTML = html;
  document.querySelectorAll('[data-listing]').forEach(b => b.addEventListener('click', () => {
    showDetail(report.rows.find(r => r.id === b.dataset.listing));
  }));
}
function showDetail(row) {
  const m = row.metrics;
  const dialog = document.querySelector('#listing-dialog');
  document.querySelector('#detail-content').innerHTML = `<div class="panel-heading"><div><p class="eyebrow">AMAZON DE · ${escape(row.external_id)}</p><h2 id="detail-title">${escape(row.title)}</h2></div><button id="close-detail" aria-label="Details schließen">Schließen ×</button></div>
    <p class="table-note">${escape(row.product.name)} · ${escape(row.product.internal_sku)}<br>${row.skus.map(s => escape(s.sku)).join(' · ')}</p>
    <h3>Verkauf & Traffic</h3><section class="metrics">${metric('Umsatz', money(m.revenue_cents), 'Bestellumsatz')}${metric('Sales', number(m.units), 'Verkaufte Einheiten')}${metric('Sessions', number(m.sessions), 'ASIN-Sessions')}${metric('Conversion Rate', percent(m.conversion), 'Einheiten ÷ Sessions')}</section>
    <h3>Bewertungen & Erstattungen</h3><p>Bewertung: ${rating(row)}</p><section class="metrics secondary">${metric('Erstattungsbetrag', money(m.refund_cents), 'Nach Erstattungsdatum')}${metric('Erstattete Einheiten', number(m.refunded_units), 'Im gewählten Zeitraum')}${metric('Erstattungsrate', percent(m.refundRate), 'Periodenquote')}</section>
    <h3>Werbeausgaben · nur dieser ASIN zugeordnet</h3>${table(['Werbetyp', 'Ausgaben'], Object.entries(adTypes).map(([type,name]) => `<tr><td>${name}</td><td>${row.ads.some(a => a.ad_type === type) ? money(sumAds(row.ads.filter(a => a.ad_type === type))) : '—'}</td></tr>`), 'Listing-Werbung')}`;
  document.querySelector('#close-detail').addEventListener('click', () => dialog.close());
  dialog.showModal();
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; render(); }));
for (const id of ['period', 'product']) document.querySelector(`#${id}`).addEventListener('change', render);
document.querySelector('#search').addEventListener('input', render);
document.querySelector('#reset').addEventListener('click', () => {
  document.querySelector('#period').value = '30';
  document.querySelector('#product').value = 'all';
  document.querySelector('#search').value = '';
  render();
});
render();
