import './style.css';

// Synthetic demo data only. Replace through a backend integration, never browser API secrets.
const platforms = ['Amazon', 'eBay', 'Etsy'];
const orders = Array.from({ length: 90 }, (_, i) => ({
  id: `DEMO-${1000 + i}`,
  date: new Date(Date.UTC(2026, 8, 1 + Math.floor(i / 3))),
  platform: platforms[i % 3],
  product: ['Kabellose Kopfhörer', 'Schreibtischlampe', 'Keramikbecher'][i % 3],
  amount: [79.9, 49.5, 24.0][i % 3] * (1 + (i % 4)),
  status: i % 7 === 0 ? 'Offen' : 'Versendet',
}));
const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC' });

document.querySelector('#app').innerHTML = `
  <aside><a class="brand" href="./"><span class="logo">mp</span> Marketplace</a><p class="nav-label">WORKSPACE</p><a class="active" href="#overview" aria-current="page">◫ &nbsp; Übersicht</a><div class="aside-note">Alle Kanäle.<br>Ein Überblick.<small>Deine Marketplace-Zentrale</small></div></aside>
  <main id="overview">
    <header><span>WORKSPACE / ÜBERSICHT</span><span class="demo">● Demo-Modus</span></header>
    <section class="heading"><div><p class="eyebrow">DEIN BUSINESS IM BLICK</p><h1>Marketplace Übersicht</h1><p>Entdecke, wie sich deine Verkaufskanäle entwickeln.</p></div></section>
    <div class="notice">Beispieldaten · September 2026. Es sind noch keine Marktplätze verbunden. Alle Beträge in EUR, ohne Gebühren- oder Retourenabzug.</div>
    <section class="filters" aria-label="Filter"><label>Marktplatz<select id="platform" aria-label="Marktplatz"><option value="all">Alle Marktplätze</option>${platforms.map(p => `<option>${p}</option>`).join('')}</select></label><label>Zeitraum<select id="period" aria-label="Zeitraum"><option value="30">Gesamter September</option><option value="7">24.–30. September</option></select></label><button id="reset">Filter zurücksetzen</button></section>
    <div id="results" aria-live="polite"></div>
    <footer>MP Dashboard <span>Demo-Workspace · Datenstand 30.09.2026</span></footer>
  </main>`;

function render() {
  const platform = document.querySelector('#platform').value;
  const days = Number(document.querySelector('#period').value);
  const selected = orders.filter(o => (platform === 'all' || o.platform === platform) && o.date.getUTCDate() > 30 - days);
  const total = selected.reduce((sum, o) => sum + o.amount, 0);
  const summaries = platforms.map(name => ({ name, total: selected.filter(o => o.platform === name).reduce((sum, o) => sum + o.amount, 0) })).filter(p => platform === 'all' || p.name === platform);
  document.querySelector('#results').innerHTML = `
    <section class="metrics" aria-label="Kennzahlen">
      <article class="metric primary"><p>Umsatz</p><strong data-testid="revenue">${currency.format(total)}</strong><small>Bestellwert im gewählten Zeitraum</small></article>
      <article class="metric"><p>Bestellungen</p><strong data-testid="orders">${selected.length}</strong><small>Über die ausgewählten Kanäle</small></article>
      <article class="metric"><p>Ø Bestellwert</p><strong>${currency.format(selected.length ? total / selected.length : 0)}</strong><small>Umsatz pro Bestellung</small></article>
      <article class="metric"><p>Offene Bestellungen</p><strong>${selected.filter(o => o.status === 'Offen').length}</strong><small>Versand steht noch aus</small></article>
    </section>
    <section class="panel"><div class="panel-heading"><h2>Umsatz nach Marktplatz</h2><span>Anteil am Gesamtumsatz</span></div><div class="channels">${summaries.map(p => `<div class="channel"><div><strong>${p.name}</strong><span>${currency.format(p.total)}</span></div><div class="track"><div style="width:${total ? p.total / total * 100 : 0}%"></div></div><small>${total ? Math.round(p.total / total * 100) : 0} % des Umsatzes</small></div>`).join('')}</div></section>
    <section class="panel"><div class="panel-heading"><h2>Letzte Bestellungen</h2><span>Die neuesten ${Math.min(10, selected.length)} von ${selected.length}</span></div><div class="table-scroll"><table><thead><tr><th>Bestellung</th><th>Datum</th><th>Marktplatz</th><th>Produkt</th><th>Status</th><th class="amount">Betrag</th></tr></thead><tbody>${selected.slice().reverse().slice(0, 10).map(o => `<tr><td class="order-id">${o.id}</td><td>${dateFormat.format(o.date)}</td><td>${o.platform}</td><td>${o.product}</td><td><span class="status ${o.status === 'Offen' ? 'pending' : ''}">${o.status}</span></td><td class="amount">${currency.format(o.amount)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
document.querySelector('#platform').addEventListener('change', render);
document.querySelector('#period').addEventListener('change', render);
document.querySelector('#reset').addEventListener('click', () => {
  document.querySelector('#platform').value = 'all';
  document.querySelector('#period').value = '30';
  render();
});
render();
