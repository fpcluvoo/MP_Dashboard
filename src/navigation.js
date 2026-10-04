export const pages={
 overview:{title:'Gesamtüberblick',group:'Analyse',description:'Entwicklung, Veränderungen und die wichtigsten Hinweise.'},
 markets:{title:'Marktplätze',group:'Analyse',description:'Kanäle vergleichen und die gemeinsame Werbeeffizienz verstehen.'},
 products:{title:'Produktanalyse',group:'Analyse',description:'Modelle über alle ausgewählten Kanäle vergleichen.'},
 sales:{title:'Verkauf & Traffic',group:'Analyse',description:'Absatz, Umsatz, Besucher und Bewertungen auf Listing-Ebene.'},
 ads:{title:'Werbung',group:'Analyse',description:'Werbeausgaben nach Listing und Werbetyp.'},
 refunds:{title:'Erstattungen',group:'Analyse',description:'Erstattungsbeträge und Quoten für deine Listings.'},
 profit:{title:'Profit & Marge',group:'Analyse',description:'Deckungsbeitrag, Kostenabdeckung und Ergebnis je Listing.'},
 costs:{title:'Kostenpflege',group:'Verwaltung',description:'SKU-Kosten hinterlegen und ihre Gültigkeit verwalten.'},
 catalog:{title:'Produktstamm',group:'Verwaltung',description:'Marken, Modelle, Varianten und Marketplace-Zuordnungen.'},
 quality:{title:'Datenqualität',group:'Verwaltung',description:'Vollständigkeit und Grenzen der ausgewählten Daten prüfen.'},
 sources:{title:'Datenquellen & APIs',group:'Verwaltung',description:'Anbindungen, Importstatus und verfügbare Quellfelder.'},
};
export const pageFromHash=()=>{const id=location.hash.replace(/^#\/?/,'');return Object.hasOwn(pages,id)?id:'overview';};
export function navigationMarkup(){return `<dialog id="app-menu" aria-labelledby="menu-title"><div class="menu-heading"><span class="brand"><span class="logo">mp</span> Marketplace BI</span><button id="close-menu" aria-label="Menü schließen">×</button></div><h2 id="menu-title">Navigation</h2><nav aria-label="Hauptnavigation">${['Analyse','Verwaltung'].map(group=>`<section><h3>${group}</h3>${Object.entries(pages).filter(([,p])=>p.group===group).map(([id,p])=>`<button data-view="${id}">${p.title}</button>`).join('')}</section>`).join('')}</nav><p class="menu-note">Clouvou · Lutivo · Wintoncove<br>Synthetische Demo · keine Live-Verbindung</p></dialog>`;}
export function bindNavigation(onNavigate){
 const dialog=document.querySelector('#app-menu'),trigger=document.querySelector('#menu-toggle');
 trigger.addEventListener('click',()=>{dialog.showModal();trigger.setAttribute('aria-expanded','true');});
 document.querySelector('#close-menu').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>trigger.setAttribute('aria-expanded','false'));
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 dialog.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{dialog.close();onNavigate(b.dataset.view);}));
 window.addEventListener('popstate',()=>onNavigate(pageFromHash(),false));
}
