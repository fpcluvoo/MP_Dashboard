import './style.css';
import {pages,pageFromHash,navigationMarkup,bindNavigation} from './navigation.js';
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
import {analyze,datesBetween} from '../bi/model.js';
import {validateView,productCsv} from '../bi/reporting.js';
import {comparisonView,trendView,insightsView,productsView,bridgeView,qualityView,productDetail,bindIntelligence} from './intelligence.js';
import {blendedReport} from '../marketing/calculate.js';
import {overviewView} from './overview.js';
import {euroData} from '../profit/fx.js';
import {profitView,costsView,bindProfit,loadDemoCosts} from './profit.js';
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
let view = pageFromHash();
let selectedAccounts=new Set([data.accountId]);
let previousSelection=null;
let trendMetric='revenue',productSort='revenue',lastAnalysis=null;
const viewsKey='mp-bi-saved-views-v1';
let savedViews=[];
try{const saved=JSON.parse(localStorage.getItem(viewsKey)??'[]');if(Array.isArray(saved))savedViews=saved.filter(v=>{try{validateView(v.state,data);return typeof v.name==='string'&&typeof v.id==='string';}catch{return false;}}).slice(0,20);}catch{/* Optional browser storage; default view remains available. */}

const metric = (name, value, note, id, primary = false) => `<article class="metric ${primary ? 'primary' : ''}"><p>${name}</p><strong ${id ? `data-testid="${id}"` : ''}>${value}</strong><small>${note}</small></article>`;
const sumAds = rows => rows.some(r=>r.spend_cents==null)?null:rows.reduce((n, r) => n + r.spend_cents, 0);
const rating = row => row.rating?.rating == null ? '<span class="muted">Nicht verfügbar</span>' : `<span class="stars">★</span> ${number(row.rating.rating)} <small>(${number(row.rating.rating_count)})</small><small class="subline">Stand ${escape(row.rating.date)}</small>`;

document.querySelector('#app').innerHTML = `
  ${navigationMarkup()}
  <main id="overview">
    <header class="app-header"><button id="menu-toggle" aria-label="Menü öffnen" aria-controls="app-menu" aria-expanded="false"><span aria-hidden="true">☰</span> Menü</button><a class="brand home-link" href="#/overview"><span class="logo">mp</span> Marketplace BI</a><span class="demo">● Demo-Modus</span></header>
    <section class="heading"><div><p class="eyebrow" id="page-group"></p><h1 id="page-title" tabindex="-1"></h1><p id="page-description"></p></div></section>
    <p class="demo-context">Synthetische Beispieldaten · August / September 2026 · simulierte EUR-Kurse</p>
    <section class="brand-overview" aria-label="Markenübersicht">${data.catalog.brands.map(b => {
      const count = data.catalog.models.filter(m => m.brand_id === b.id).length;
      return `<article><span class="brand-wordmark">${escape(b.name)}</span><small>${count ? `${count} benannte Modelle` : '5 Bürostuhlmodelle · Namen folgen'}</small></article>`;
    }).join('')}</section>
    <details class="channel-picker" id="channel-panel"><summary><span>Marktplätze auswählen</span><strong id="active-channel"></strong><span id="channel-selection-summary" aria-live="polite"></span></summary>
      <div class="channel-actions"><button id="select-all-channels">Alle auswählen</button><button id="select-amazon-channels">Nur Amazon</button><button id="clear-channels">Auswahl leeren</button><button id="back-channels" hidden>Zur Kanalauswahl zurück</button></div>
      <div class="channel-tiles" role="group" aria-label="Marktplatz-Mehrfachauswahl">${data.accounts.map(a=>`<label class="channel-choice"><input type="checkbox" data-channel="${escape(a.id)}" aria-label="${escape(a.name.replace(' · Demo',''))}" ${a.id===data.accountId?'checked':''}><span><strong>${escape(a.name.replace(' · Demo',''))}</strong><small>${escape(a.currency)}</small></span></label>`).join('')}</div>
    </details>
    <section class="filters" aria-label="Filter">

      <label>Anzeigewährung<select id="display-currency" aria-label="Anzeigewährung"><option value="eur">Euro (EUR)</option><option value="original">Originalwährung</option></select></label>
      <label>Zeitraum<select id="period" aria-label="Zeitraum"><option value="30">01.–30. September 2026</option><option value="7">24.–30. September 2026</option><option value="14">17.–30. September 2026</option><option value="custom">Eigener Zeitraum</option></select></label><label class="custom-range" hidden>Von<input id="range-start" type="date" aria-label="Zeitraum von" min="2026-08-01" max="2026-09-30" value="2026-09-01"></label><label class="custom-range" hidden>Bis<input id="range-end" type="date" aria-label="Zeitraum bis" min="2026-08-01" max="2026-09-30" value="2026-09-30"></label><label>Vergleich<select id="compare" aria-label="Periodenvergleich"><option value="previous">Gleich lange Vorperiode</option><option value="off">Ohne Vergleich</option></select></label>
      <label>Marke<select id="brand" aria-label="Marke"><option value="all">Alle Marken</option>${data.catalog.brands.map(b => `<option value="${escape(b.id)}">${escape(b.name)}</option>`).join('')}</select></label>
      <label>Kategorie<select id="category" aria-label="Kategorie"><option value="all">Alle Kategorien</option>${data.catalog.categories.map(c => `<option value="${escape(c.id)}">${escape(c.name)}</option>`).join('')}</select></label>
      <label>Modell<select id="product" aria-label="Modell"></select></label>
      <label class="search-label">Listing suchen<input id="search" type="search" placeholder="ASIN, SKU oder Produktname" aria-label="Listing suchen"></label>
      <button id="reset">Zurücksetzen</button>
    </section>
    <details id="report-tools" class="report-tools"><summary>Ansichten & Export</summary><section class="report-toolbar" aria-label="Reports verwalten"><div><label>Ansicht benennen<input id="view-name" aria-label="Ansicht benennen" maxlength="50" placeholder="z. B. Amazon Wochenreport"></label><button id="save-view">Ansicht speichern</button></div><div><label>Gespeicherte Ansichten<select id="saved-view" aria-label="Gespeicherte Ansichten"><option value="">Ansicht wählen</option></select></label><button id="load-view">Laden</button><button id="delete-view">Löschen</button></div><div><button id="export-products">Produktreport CSV</button><button id="print-report">Drucken / PDF</button></div></section>
    <p id="report-status" role="status" class="report-status"></p></details><p id="report-meta" class="print-meta"></p>
    <p class="fx-note">EUR-Umrechnung mit synthetischen Demo-Tageskursen. Keine echten Marktkurse. Originalbeträge per Hover oder unter „Originalbeträge & Wechselkurse“.</p>
    <p id="coverage" class="coverage" aria-live="polite"></p>
    <div id="summary" aria-live="polite"></div>

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
function navigate(id,push=true){
 view=Object.hasOwn(pages,id)?id:'overview';
 if(push&&location.hash!==`#/${view}`)history.pushState(null,'',`#/${view}`);
 render();document.querySelector('#page-title').focus({preventScroll:true});window.scrollTo(0,0);
}
function pageLayout(){
 const page=pages[view],admin=['catalog','costs','sources'].includes(view),accountScope=['overview','markets'].includes(view);
 document.title=`${page.title} · Marketplace BI`;
 document.querySelector('#page-title').textContent=page.title;
 document.querySelector('#page-group').textContent=page.group;
 document.querySelector('#page-description').textContent=page.description;
 document.querySelector('.brand-overview').hidden=view!=='catalog';
 document.querySelector('#channel-panel').hidden=view==='catalog';
 document.querySelector('.filters').hidden=['sources','costs'].includes(view);
 for(const id of ['display-currency','period'])document.querySelector(`#${id}`).closest('label').hidden=admin;
 document.querySelector('#compare').closest('label').hidden=!['overview','products'].includes(view);
 for(const id of ['brand','category','product','search'])document.querySelector(`#${id}`).closest('label').hidden=accountScope||view==='sources';
 document.querySelector('#reset').hidden=accountScope;
 document.querySelector('#report-tools').hidden=admin;
 document.querySelector('#summary').hidden=admin||['quality','profit'].includes(view);
 document.querySelector('#coverage').hidden=!['catalog','sales','products'].includes(view);
 document.querySelector('.fx-note').hidden=admin;
 document.querySelector('.definitions').hidden=admin;
 document.querySelectorAll('[data-view]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.view===view));if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
}
function render() {
  pageLayout();
  const accounts=data.accounts.filter(a=>selectedAccounts.has(a.id)||(view==='catalog'&&!selectedAccounts.size&&a.id===data.accountId));
  const accountIds=accounts.map(a=>a.id),accountId=accountIds[0];
  document.querySelectorAll('[data-channel]').forEach(input=>{input.checked=selectedAccounts.has(input.dataset.channel);input.closest('label').classList.toggle('selected',input.checked);});
  document.querySelector('#channel-selection-summary').textContent=`${accounts.length} von ${data.accounts.length} Kanälen ausgewählt`;
  document.querySelector('#back-channels').hidden=!previousSelection;
  const selector=document.querySelector('#display-currency');
  const mixedCurrencies=new Set(accounts.map(a=>a.currency)).size>1;
  selector.querySelector('[value=original]').disabled=mixedCurrencies;
  selector.disabled=mixedCurrencies;
  if(mixedCurrencies)selector.value='eur';
  const eur=selector.value==='eur';
  activeAccount=accounts.length===1?{...accounts[0],currency:eur?'EUR':accounts[0].currency}:{id:'selected',name:accounts.length?`${accounts.length} ausgewählte Kanäle`:'Keine Kanäle ausgewählt',currency:eur?'EUR':accounts[0]?.currency??'EUR',marketplace:accounts.length&&accounts.every(a=>a.marketplace==='amazon')?'amazon':'mixed'};
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  if(!accounts.length){
    document.querySelector('#active-channel').textContent='Keine Auswahl';
    lastAnalysis=null;document.querySelector('#export-products').disabled=true;document.querySelector('#report-meta').textContent='Keine Kanalauswahl';
    document.querySelector('#coverage').textContent='';document.querySelector('#summary').innerHTML='';
    document.querySelector('#content').innerHTML='<section class="empty" role="status"><h2>Wähle mindestens einen Marktplatz</h2><p>Die Kacheln lassen sich einzeln oder gemeinsam auswählen. Ohne Auswahl werden keine Gesamtwerte berechnet.</p></section>';return;
  }
  document.querySelector('#active-channel').textContent=activeAccount.name.replace(' · Demo','');
  const isAmazon=activeAccount.marketplace==='amazon';
  const isEbay=activeAccount.marketplace==='ebay';
  const trafficLabel=activeAccount.marketplace==='mixed'?'Traffic je Kanal':isAmazon?'Sessions':'Pageviews';
  const conversionLabel=activeAccount.marketplace==='mixed'?'Conversion je Kanal':isAmazon?'Conversion Rate':isEbay?'Transaktionen / Views':'Conversion nicht verfügbar';
  const admin=['costs','catalog','sources'].includes(view);
  const preset=admin?'30':document.querySelector('#period').value;
  document.querySelectorAll('.custom-range').forEach(label=>label.hidden=preset!=='custom');
  const end=preset==='custom'?document.querySelector('#range-end').value:data.end;
  const start=preset==='custom'?document.querySelector('#range-start').value:preset==='7'?'2026-09-24':preset==='14'?'2026-09-17':data.start;
  try{datesBetween(start,end);if(start<data.historyStart||end>data.end)throw new Error('Bitte einen Zeitraum innerhalb der Demo-Historie wählen.');}catch(error){lastAnalysis=null;document.querySelector('#export-products').disabled=true;document.querySelector('#summary').innerHTML='';document.querySelector('#coverage').textContent='';document.querySelector('#report-meta').textContent='Kein gültiger Berichtszeitraum';document.querySelector('#content').innerHTML=`<div class="empty" role="status">${escape(error.message)}</div>`;return;}
  const productId = document.querySelector('#product').value;
  const query = document.querySelector('#search').value;
  const brandId = document.querySelector('#brand').value;
  const categoryId = document.querySelector('#category').value;
  const selection = { brandId, categoryId, productId, query };
  const catalog = selectCatalog(data, selection);
  const appliedSelection=['overview','markets','sources','costs'].includes(view)?{}:selection;
  const bi=analyze(data,eur?eurData:data,{start,end,accountIds,eur,...appliedSelection,costs:costState.records,compare:document.querySelector('#compare').value==='previous'});
  lastAnalysis=bi;const report=bi.report;
  document.querySelector('#export-products').disabled=!bi.products.length;
  document.querySelector('#report-meta').textContent=`Synthetischer Demo-Report · ${start} bis ${end} · ${accounts.map(a=>a.name.replace(' · Demo','')).join(', ')} · ${activeAccount.currency} · ${eur?'Demo-Tageskurse':'Originalwährung'} · Produktfilter: ${['overview','markets'].includes(view)?'gesamte Konten':[brandId,categoryId,productId,query].join(' / ')}`;
  const nativeReports=accounts.map(a=>analytics(data,{start,end,accountId:a.id,...appliedSelection}));
  const originals=field=>nativeReports.map(r=>`${r.account.name.replace(' · Demo','')}: ${formatMoney(r.metrics[field],r.account.currency)}`).join(' · ');
  const nativeRows=new Map(nativeReports.flatMap(r=>r.rows.map(l=>[l.id,{...l,currency:r.account.currency}])));
  const originalRevenue=l=>formatMoney(nativeRows.get(l.id).metrics.revenue_cents,nativeRows.get(l.id).currency);
  document.querySelector('#coverage').textContent = view==='overview'?`Kontoblick · ${accounts.length} ausgewählte Kanäle · ${report.rows.length} Demo-Listings. Produktfilter wirken in den Detailauswertungen.`:`${catalog.models.length} benannte Modelle in Auswahl · ${report.rows.length} Demo-Listings auf Basis bestätigter Farbvarianten. Weitere Modelle und offene Angaben findest du im Produktstamm.`;
  const m = report.metrics;
  document.querySelector('#summary').innerHTML = `<section class="metrics" aria-label="Verkauf und Traffic">
    ${metric('Umsatz', money(m.revenue_cents,originals('revenue_cents')), 'Vor Erstattungen & Gebühren', 'revenue', true)}
    ${metric('Sales', number(m.units), 'Verkaufte Einheiten', 'units')}
    ${metric(trafficLabel, number(isAmazon?m.sessions:m.page_views), isAmazon?'Summe der Listing-Sessions':'Kein Ersatz für Amazon-Sessions', 'sessions')}
    ${metric(conversionLabel, percent(isAmazon?m.conversion:m.transactionViewRate), isAmazon?'Einheiten ÷ Sessions':isEbay?'Transaktionen ÷ Pageviews':'Keine bestätigte Traffic-Quelle', 'conversion')}
  </section><details class="originals"><summary>Originalbeträge & Wechselkurse</summary><p>Bestellumsatz: ${escape(originals('revenue_cents'))}</p><p>Erstattungen: ${escape(originals('refund_cents'))}</p><p>Jeder Tagesbetrag wird mit seinem Tageskurs in EUR umgerechnet. Beispielkurse am ${end}: ${data.fx.filter(r=>r.date===end&&accounts.some(a=>a.currency===r.currency)).map(r=>`1 ${r.currency} = ${r.rate} EUR`).join(' · ')||'EUR unverändert'}. Quelle: synthetische Demodaten.</p></details>`;
  document.querySelector('#summary .metrics').hidden=!['sales','refunds','ads'].includes(view);
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  let html = '';
  const head = (title, note) => `<div class="panel-heading"><h2>${title}</h2><span>${note}</span></div>`;
  if(view==='overview'){ html=comparisonView(bi,activeAccount.currency)+trendView(bi,activeAccount.currency,trendMetric)+insightsView(bi);
  } else if(view==='markets'){html=overviewView(bi.marketing,{productFiltered:brandId!=='all'||categoryId!=='all'||productId!=='all'||!!query.trim()});
  } else if(view==='products'){html=comparisonView(bi,activeAccount.currency)+productsView(bi,activeAccount.currency,productSort)+bridgeView(bi,activeAccount.currency);
  } else if(view==='quality'){html=qualityView(bi,data);
  } else if(view==='costs'){html=costsView({rows:report.rows,costState});
  } else if (view === 'profit') { html=profitView({data,rows:report.rows,accountIds,start,end,eur,costState});
  } else if (view === 'sources') { html = accounts.map(a=>sourcesView(a,integrationData.results)).join('');
  } else if (view === 'sales') {
    html = `<section class="panel">${head('Listing-Performance', `${report.rows.length} Demo-Listings · Bewertungen nur mit geeigneter Quelle`)}${table(['Listing / externe ID', 'Bewertung', trafficLabel, conversionLabel, 'Sales · Einheiten', 'Umsatz'], report.rows.map(r => `<tr data-testid="listing-row"><td>${listingCell(r)}</td><td>${rating(r)}</td><td>${number(data.accounts.find(a=>a.id===r.account_id).marketplace==='amazon'?r.metrics.sessions:r.metrics.page_views)}</td><td>${percent(data.accounts.find(a=>a.id===r.account_id).marketplace==='amazon'?r.metrics.conversion:r.metrics.transactionViewRate)}</td><td>${number(r.metrics.units)}</td><td class="amount">${money(r.metrics.revenue_cents,originalRevenue(r))}<small class="subline">Ø Preis ${money(r.metrics.units?r.metrics.revenue_cents/r.metrics.units:null,formatMoney(nativeRows.get(r.id).metrics.units?nativeRows.get(r.id).metrics.revenue_cents/nativeRows.get(r.id).metrics.units:null,nativeRows.get(r.id).currency))}</small><details><summary>Originalbetrag</summary>${escape(originalRevenue(r))} · ${escape(nativeRows.get(r.id).currency)}</details></td></tr>`), 'Listing-Performance')}</section>`;
  } else if (view === 'refunds') {
    html = `<section class="metrics secondary">${metric('Erstattungsbetrag', money(m.refund_cents), 'Im gewählten Zeitraum', 'refund-amount')}${metric('Erstattete Einheiten', number(m.refunded_units), 'Nach Erstattungsdatum')}${metric('Erstattungsrate', percent(m.refundRate), 'Periodenquote, keine Bestellkohorte')}</section><section class="panel">${head('Erstattungen nach Listing', 'Erstattungsdatum · ohne Kohortenzuordnung')}${table(['Listing / ASIN', 'Sales · Einheiten', 'Erstattete Einheiten', 'Erstattungsbetrag', 'Erstattungsrate'], report.rows.map(r => `<tr><td>${listingCell(r)}</td><td>${number(r.metrics.units)}</td><td>${number(r.metrics.refunded_units)}</td><td>${money(r.metrics.refund_cents)}</td><td>${percent(r.metrics.refundRate)}</td></tr>`), 'Erstattungen')}</section>`;
  } else if (view === 'ads') {
    const blended=blendedReport(data,{accountIds,start,end,eur});
    report.accountSpend=blended.spend==null?null:Number(blended.spend)*100;
    html = `${blended.spend==null?'<div class="notice">Werbedaten der Kanalauswahl sind unvollständig. Zugeordnete Kosten und Werbetypen zeigen nur vorliegende Werte; die Kontogesamtsumme bleibt offen.</div>':''}<section class="metrics secondary">${metric('Listing-zugeordnete Kosten', money(report.assignedSpend), 'Für die gefilterten Listings', 'assigned-spend')}${metric('Nicht zuordenbare Kosten', money(report.unassignedSpend), 'Gesamtes Konto · nur Zeitraumfilter', 'unassigned-spend')}${metric('Werbeausgaben · Konto gesamt', money(report.accountSpend), 'Alle Listings + nicht zuordenbar', 'account-spend')}</section>
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
  if (!report.rows.length && !['catalog','sources','quality'].includes(view)) html = `<div class="empty" role="status"><h2>Keine Demo-Listings in dieser Auswahl</h2><p>${catalog.models.length || catalog.groups.length ? 'Das Sortiment ist vorgemerkt. Varianten und echte Marketplace-Zuordnungen sind noch offen; deshalb werden hier keine Kennzahlen erfunden.' : 'Suche oder Filter anpassen. Fehlende Daten sind keine Nullverkäufe.'}</p><button id="open-catalog">Produktstamm ansehen</button></div>` + (view === 'ads' ? html : '');
  if (view === 'catalog' && !catalog.models.length && !catalog.groups.length) html = '<div class="empty" role="status"><h2>Keine Modelle gefunden</h2><p>Suche oder Filter anpassen.</p></div>';
  document.querySelector('#content').innerHTML = html;
  document.querySelectorAll('[data-drill-channel]').forEach(button=>button.addEventListener('click',()=>{previousSelection=[...selectedAccounts];selectedAccounts=new Set([button.dataset.drillChannel]);navigate('sales');}));
  bindIntelligence(bi,activeAccount.currency,{trendMetric,onTrend:value=>{trendMetric=value;render();},onSort:value=>{productSort=value;render();},onProduct:id=>showProduct(bi.products.find(p=>p.id===id)),onJump:id=>navigate(id)});
  if(view==='costs')bindProfit({data,rows:report.rows,costState,render});
  document.querySelector('#open-costs')?.addEventListener('click',()=>navigate('costs'));
  document.querySelector('#open-catalog')?.addEventListener('click', () => { navigate('catalog'); });
  document.querySelectorAll('[data-listing]').forEach(b => b.addEventListener('click', () => {
    showDetail(report.rows.find(r => r.id === b.dataset.listing));
  }));
}
function showDetail(row) {
  const m = row.metrics;
  const rowAccount=data.accounts.find(a=>a.id===row.account_id);
  const dialog = document.querySelector('#listing-dialog');
  document.querySelector('#detail-content').innerHTML = `<div class="panel-heading"><div><p class="eyebrow">${escape(rowAccount.name.replace(' · Demo',''))} · ${escape(row.external_id)}</p><h2 id="detail-title">${escape(row.title)}</h2></div><button id="close-detail" aria-label="Details schließen">Schließen ×</button></div>
    <p class="table-note">Synthetisches Demo-Listing · echte SKU/ASIN-Zuordnung noch offen.<br>${escape(row.product.name)} · ${escape(row.product.internal_sku)}<br>${row.skus.map(s => escape(s.sku)).join(' · ')}</p>
    <h3>Verkauf & Traffic</h3><section class="metrics">${metric('Umsatz', money(m.revenue_cents), 'Bestellumsatz')}${metric('Sales', number(m.units), 'Verkaufte Einheiten')}${metric(rowAccount.marketplace==='amazon'?'Sessions':'Pageviews', number(rowAccount.marketplace==='amazon'?m.sessions:m.page_views), 'Definition abhängig vom Kanal')}${metric('Conversion', percent(rowAccount.marketplace==='amazon'?m.conversion:m.transactionViewRate), rowAccount.marketplace==='amazon'?'Einheiten ÷ Sessions':'Transaktionen ÷ Pageviews')}</section>
    <h3>Bewertungen & Erstattungen</h3><p>Bewertung: ${rating(row)}</p><section class="metrics secondary">${metric('Erstattungsbetrag', money(m.refund_cents), 'Nach Erstattungsdatum')}${metric('Erstattete Einheiten', number(m.refunded_units), 'Im gewählten Zeitraum')}${metric('Erstattungsrate', percent(m.refundRate), 'Periodenquote')}</section>
    <h3>Werbeausgaben · nur diesem Listing zugeordnet</h3>${table(['Werbetyp', 'Ausgaben'], Object.entries(adTypes).map(([type,name]) => `<tr><td>${name}</td><td>${row.ads.some(a => a.ad_type === type) ? money(sumAds(row.ads.filter(a => a.ad_type === type))) : '—'}</td></tr>`), 'Listing-Werbung')}`;
  document.querySelector('#close-detail').addEventListener('click', () => dialog.close());
  dialog.showModal();
}
bindNavigation(navigate);
document.querySelector('.home-link').addEventListener('click',e=>{e.preventDefault();navigate('overview');});
function updateModels() {
  const current = document.querySelector('#product').value;
  const { models } = selectCatalog(data, { brandId: document.querySelector('#brand').value, categoryId: document.querySelector('#category').value });
  document.querySelector('#product').innerHTML = `<option value="all">Alle Modelle</option>${models.map(m => `<option value="${escape(m.id)}">${escape(m.name)}</option>`).join('')}`;
  if (models.some(m => m.id === current)) document.querySelector('#product').value = current;
}
for (const id of ['brand', 'category']) document.querySelector(`#${id}`).addEventListener('change', () => { updateModels(); render(); });
for (const id of ['period', 'product','display-currency','compare','range-start','range-end']) document.querySelector(`#${id}`).addEventListener('change', render);
document.querySelector('#search').addEventListener('input', render);
document.querySelector('#reset').addEventListener('click', () => {
  if(!['catalog','costs','sources'].includes(view)){document.querySelector('#period').value = '30';document.querySelector('#compare').value = 'previous';}
  document.querySelector('#brand').value = 'all';
  document.querySelector('#category').value = 'all';
  updateModels();
  document.querySelector('#product').value = 'all';
  document.querySelector('#search').value = '';
  render();
});
document.querySelectorAll('[data-channel]').forEach(input=>input.addEventListener('change',()=>{previousSelection=null;if(input.checked)selectedAccounts.add(input.dataset.channel);else selectedAccounts.delete(input.dataset.channel);render();}));
document.querySelector('#select-all-channels').addEventListener('click',()=>{previousSelection=null;selectedAccounts=new Set(data.accounts.map(a=>a.id));render();});
document.querySelector('#select-amazon-channels').addEventListener('click',()=>{previousSelection=null;selectedAccounts=new Set(data.accounts.filter(a=>a.marketplace==='amazon').map(a=>a.id));render();});
document.querySelector('#clear-channels').addEventListener('click',()=>{previousSelection=null;selectedAccounts.clear();render();});
document.querySelector('#back-channels').addEventListener('click',()=>{selectedAccounts=new Set(previousSelection??[]);previousSelection=null;navigate('markets');});
refreshSavedViews();
updateModels();
render();

function showProduct(product){
 if(!product)return;const dialog=document.querySelector('#listing-dialog');document.querySelector('#detail-content').innerHTML=productDetail(product,activeAccount.currency,data);
 document.querySelector('#close-detail').addEventListener('click',()=>dialog.close());
 document.querySelector('#product-to-listings').addEventListener('click',()=>{dialog.close();document.querySelector('#brand').value='all';document.querySelector('#category').value='all';document.querySelector('#search').value='';updateModels();document.querySelector('#product').value=product.id;navigate('sales');});dialog.showModal();
}
function refreshSavedViews(){document.querySelector('#saved-view').innerHTML='<option value="">Ansicht wählen</option>'+savedViews.map(v=>`<option value="${escape(v.id)}">${escape(v.name)}</option>`).join('');}
function reportStatus(text){document.querySelector('#report-status').textContent=text;}
function captureView(){if(!lastAnalysis)throw new Error('Zuerst Kanäle und einen gültigen Zeitraum auswählen.');return validateView({version:1,accountIds:[...selectedAccounts],start:lastAnalysis.options.start,end:lastAnalysis.options.end,view,currency:document.querySelector('#display-currency').value,brandId:document.querySelector('#brand').value,categoryId:document.querySelector('#category').value,productId:document.querySelector('#product').value,query:document.querySelector('#search').value,compare:document.querySelector('#compare').value==='previous'},data);}
document.querySelector('#save-view').addEventListener('click',()=>{try{const name=document.querySelector('#view-name').value.trim();if(!name)throw new Error('Bitte einen Namen für die Ansicht eingeben.');if(savedViews.length>=20)throw new Error('Maximal 20 Ansichten. Bitte eine alte Ansicht löschen.');const next=[...savedViews,{id:crypto.randomUUID(),name,state:captureView()}];localStorage.setItem(viewsKey,JSON.stringify(next));savedViews=next;refreshSavedViews();document.querySelector('#saved-view').value=next.at(-1).id;reportStatus('Ansicht lokal gespeichert. Keine Synchronisation zwischen Geräten.');}catch(error){reportStatus(error.message);}});
document.querySelector('#load-view').addEventListener('click',()=>{try{const saved=savedViews.find(v=>v.id===document.querySelector('#saved-view').value);if(!saved)throw new Error('Bitte eine gespeicherte Ansicht wählen.');const state=validateView(saved.state,data);selectedAccounts=new Set(state.accountIds);previousSelection=null;view=state.view;document.querySelector('#period').value='custom';document.querySelector('#range-start').value=state.start;document.querySelector('#range-end').value=state.end;document.querySelector('#compare').value=state.compare?'previous':'off';document.querySelector('#display-currency').value=state.currency;document.querySelector('#brand').value=state.brandId;document.querySelector('#category').value=state.categoryId;updateModels();document.querySelector('#product').value=state.productId;document.querySelector('#search').value=state.query;navigate(state.view);reportStatus(`Ansicht „${saved.name}“ geladen.`);}catch(error){reportStatus(error.message);}});
document.querySelector('#delete-view').addEventListener('click',()=>{try{const id=document.querySelector('#saved-view').value;if(!savedViews.some(v=>v.id===id))throw new Error('Bitte eine gespeicherte Ansicht wählen.');const next=savedViews.filter(v=>v.id!==id);localStorage.setItem(viewsKey,JSON.stringify(next));savedViews=next;refreshSavedViews();reportStatus('Gespeicherte Ansicht gelöscht.');}catch(error){reportStatus(error.message);}});
document.querySelector('#export-products').addEventListener('click',()=>{if(!lastAnalysis)return;const url=URL.createObjectURL(new Blob([productCsv(lastAnalysis,activeAccount.currency)],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`MP-Demo-Produkte-${lastAnalysis.options.start}-${lastAnalysis.options.end}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);reportStatus('Produktreport exportiert: aktuelle Auswertung, Zeitraum, Währung und Demo-Herkunft enthalten.');});
document.querySelector('#print-report').addEventListener('click',()=>window.print());
