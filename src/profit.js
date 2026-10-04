import {profitReport} from '../profit/calculate.js';
import {addCostVersion,costLabels,validateSchedule} from '../profit/costs.js';
import {micros,decimal} from '../integrations/money.js';
const storageKey='mp-dashboard-demo-costs-v1';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,c)=>v==null?'—':new Intl.NumberFormat('de-DE',{style:'currency',currency:c}).format(Number(v));
const pct=v=>v==null?'—':new Intl.NumberFormat('de-DE',{style:'percent',maximumFractionDigits:1}).format(v);
const total=values=>!values.length||values.some(v=>v==null)?null:decimal(values.reduce((n,v)=>n+micros(v),0n));
export function loadDemoCosts(data) {
 try {const saved=localStorage.getItem(storageKey);if(saved)return {records:validateSchedule(JSON.parse(saved)),message:'Lokale Demo-Kosten geladen.'};}catch{return {records:data.profit.costs,message:'Gespeicherte Demo-Kosten konnten nicht gelesen werden; Beispieldaten geladen.'};}
 return {records:data.profit.costs,message:''};
}
export function profitView({data,rows,accountIds,start,end,eur,costState}) {
 const reports=accountIds.map(accountId=>{const a=data.accounts.find(a=>a.id===accountId);return profitReport({lines:data.profit.lines,costs:costState.records,accountId,currency:a.currency,start,end,listingIds:rows.filter(l=>l.account_id===accountId).map(l=>l.id),advertising:data.profit.advertising,overhead:data.profit.overhead,fx:eur?data.fx:null});});
 const nativeGroups=new Map((eur?accountIds.map(accountId=>{const a=data.accounts.find(a=>a.id===accountId);return profitReport({lines:data.profit.lines,costs:costState.records,accountId,currency:a.currency,start,end,listingIds:rows.filter(l=>l.account_id===accountId).map(l=>l.id),advertising:data.profit.advertising,overhead:data.profit.overhead});}):reports).flatMap(r=>r.groups).map(g=>[g.listingId,g]));
 const groups=reports.flatMap(r=>r.groups),profit=total(groups.map(g=>g.profit)),net=total(groups.map(g=>g.netSales)),beforeAds=total(groups.map(g=>g.beforeAds));
 const currency=eur?'EUR':data.accounts.find(a=>a.id===accountIds[0]).currency;
 const complete=groups.filter(g=>!g.missing.length).length;
 const fullSelection=rows.length===data.listings.filter(l=>accountIds.includes(l.account_id)).length;
 const overhead=total(reports.map(r=>r.overheadNet));
 const after=fullSelection?total(reports.map(r=>r.afterOverhead)):null;
 const card=(title,value,id,note)=>`<article class="metric"><p>${title}</p><strong data-testid="${id}">${value}</strong><small>${note}</small></article>`;
 return `<section class="metrics" aria-label="Profit">
 ${card('Deckungsbeitrag',fmt(profit,currency),'profit-value','Nach zugeordneter Werbung · vor Kontokosten')}
 ${card('Profit Margin',pct(profit==null||net==null||micros(net)<=0n?null:Number(micros(profit))/Number(micros(net))),'profit-margin','Deckungsbeitrag ÷ Nettoerlös nach Erstattungen')}
 ${card('DB vor Werbung',fmt(beforeAds,currency),'profit-before-ads','Warenkosten, Gebühren und Fulfillment abgezogen')}
 ${card('Kostenabdeckung',`${complete} / ${groups.length}`,'profit-coverage','Listings mit vollständigen Eingaben')}
 </section><div class="notice"><strong>Deckungsbeitrag, kein Jahresüberschuss.</strong> Netto nach Erstattungen, Einkauf, Marktplatzgebühren, Fulfillment, Verpackung, Anlieferung, Zoll, Sonderkosten und zugeordneter Werbung. Ohne allgemeine Betriebskosten und Ertragsteuern. Alle Abrechnungen, Steuern und Kosten hier sind simuliert. Fehlende Kosten sperren Profit und Marge.</div>
 <section class="panel"><div class="panel-heading"><h2>Profit nach Listing</h2><span>Bestellpositionen mit Kostenhistorie</span></div><div class="table-scroll"><table><thead><tr><th>Listing / Kanal</th><th>Nettoerlös nach Refunds</th><th>MP-Gebühren</th><th>SKU-Kosten inkl. Fulfillment</th><th>Werbung</th><th>Deckungsbeitrag</th><th>Marge</th></tr></thead><tbody>${groups.map(g=>{const l=rows.find(l=>l.id===g.listingId),a=data.accounts.find(a=>a.id===l.account_id);const native=nativeGroups.get(g.listingId);const show=k=>`<span class="original-amount" tabindex="0" title="Original: ${esc(fmt(native[k],a.currency))}">${fmt(g[k],currency)}</span>`;return `<tr><td>${esc(l.title)}<span class="subline">${esc(a.name)}</span><details><summary>Kosten & Bestellpositionen</summary><p>${g.missing.length?esc(g.missing.join(' · ')):'Alle benötigten Kosten vorhanden.'}</p><p>Originalwährung: ${a.currency}. Nettoerlös ${fmt(native.netSales,a.currency)}, Gebühren ${fmt(native.fees,a.currency)}, SKU-Kosten ${fmt(native.unitCosts,a.currency)}, Werbung ${fmt(native.adCost,a.currency)}, Deckungsbeitrag ${fmt(native.profit,a.currency)}. Einkaufskosten nach Bestelldatum. Refunds stornieren Warenkosten nur bei belegter Rückbuchung. Originalkosten stehen in der SKU-Pflege.</p><ul>${g.lines.slice(0,3).map(x=>`<li>${esc(x.date)} · ${esc(x.sku)} · ${x.units} Einheiten · DB vor Werbung ${fmt(x.contribution,currency)}</li>`).join('')}</ul><small>${g.lines.length} synthetische Bestellpositionen im Zeitraum.</small></details></td><td>${show('netSales')}</td><td>${show('fees')}</td><td>${show('unitCosts')}</td><td>${show('adCost')}</td><td>${show('profit')}</td><td>${pct(g.margin)}</td></tr>`;}).join('')}</tbody></table></div>
 <p class="table-note">Nicht zugeordnete Kontowerbung: ${fmt(overhead,currency)}. ${fullSelection?`Konto-Deckungsbeitrag nach dieser Werbung: <strong data-testid="account-profit">${fmt(after,currency)}</strong>.`:'Bei Produktauswahl kein Kontogewinn: Kontokosten werden nicht auf einzelne Produkte verteilt.'}</p></section>
 <button id="open-costs">Kostenpflege öffnen</button>`;
}
export function costsView({rows,costState}) {
 const skuOptions=rows.flatMap(l=>l.skus.map(s=>({accountId:l.account_id,sku:s.sku,title:l.title,fulfillment:s.fulfillment})));
 return ` <section class="panel"><div class="panel-heading"><h2>SKU-Kosten hinterlegen</h2><span>Netto je verkaufter Einheit · Originalwährung</span></div><p class="table-note">In dieser öffentlichen Demo nur lokal in deinem Browser gespeichert. Keine echten vertraulichen Kosten eingeben. Der private Backend-Kostenspeicher ist separat vorbereitet. Leer = unbekannt; 0 = ausdrücklich keine Kosten. Neue Versionen gelten ab ihrem Startdatum, frühere Werte bleiben erhalten.</p>
 <form id="cost-form" class="cost-form"><label>SKU / Konto<select id="cost-sku" aria-label="Kosten-SKU">${skuOptions.map((s,i)=>`<option value="${i}">${esc(s.accountId)} · ${esc(s.sku)} · ${esc(s.title)}</option>`).join('')}</select></label><label>Gültig ab<input id="cost-date" aria-label="Kosten gültig ab" type="date" required value="2026-09-16"></label>
 ${Object.entries(costLabels).map(([key,label])=>`<label>${label}<input data-cost="${key}" aria-label="Kosten ${label}" inputmode="decimal" type="number" min="0" step="0.000001" placeholder="Unbekannt"></label>`).join('')}
 <label>Fulfillment-Kostenquelle<select id="fulfillment-source" aria-label="Fulfillment-Kostenquelle"><option value="manual">SKU-Kostensatz</option><option value="marketplace">Abrechnung erforderlich</option></select></label><p class="table-note">Ein belegter Fulfillment-Betrag ersetzt den manuellen Satz; er wird nie zusätzlich abgezogen. Verpackung & Anlieferung nur separat pflegen, wenn nicht bereits enthalten.</p><button type="submit">Kostenversion speichern</button><button id="reset-costs" type="button">Demo-Kosten zurücksetzen</button></form><p id="cost-message" role="status">${esc(costState.message)}</p><div id="cost-history"></div></section>`;
}
export function bindProfit({data,rows,costState,render}) {
 const form=document.querySelector('#cost-form');if(!form)return;
 const options=rows.flatMap(l=>l.skus.map(s=>({accountId:l.account_id,sku:s.sku})));
 const selected=options.findIndex(s=>`${s.accountId}/${s.sku}`===costState.selectedSku);
 if(selected>=0)document.querySelector('#cost-sku').value=String(selected);
 if(costState.validFrom)document.querySelector('#cost-date').value=costState.validFrom;
 const current=()=>options[Number(document.querySelector('#cost-sku').value)];
 const fill=()=>{
  const item=current();if(!item)return;costState.selectedSku=`${item.accountId}/${item.sku}`;const a=data.accounts.find(a=>a.id===item.accountId),records=costState.records.filter(r=>r.accountId===item.accountId&&r.sku===item.sku&&r.currency===a.currency).sort((x,y)=>x.validFrom.localeCompare(y.validFrom)),latest=records.at(-1);
  for(const input of form.querySelectorAll('[data-cost]'))input.value=latest?.[input.dataset.cost]??'';
  document.querySelector('#fulfillment-source').value=latest?.fulfillmentSource??'manual';
  document.querySelector('#cost-history').innerHTML=`<h3>Kostenhistorie · ${esc(a.currency)}</h3>${records.map(r=>`<p>${esc(r.validFrom)} bis ${esc(r.validTo??'offen')} · Einkauf ${fmt(r.purchase,a.currency)} · Fulfillment ${r.fulfillmentSource==='marketplace'?'aus Abrechnung':fmt(r.fulfillment,a.currency)} · ${esc(r.note)}</p>`).join('')}`;
 };
 document.querySelector('#cost-sku').addEventListener('change',fill);fill();
 form.addEventListener('submit',e=>{e.preventDefault();try{
  const item=current(),a=data.accounts.find(a=>a.id===item.accountId),input={...item,currency:a.currency,validFrom:document.querySelector('#cost-date').value,fulfillmentSource:document.querySelector('#fulfillment-source').value,note:'Lokale Demo-Kostenversion'};
  for(const field of form.querySelectorAll('[data-cost]'))input[field.dataset.cost]=field.value===''?null:field.value;
  costState.validFrom=input.validFrom;const next=addCostVersion(costState.records,input);localStorage.setItem(storageKey,JSON.stringify(next));costState.records=next;costState.message='Kostenversion gespeichert. Profit neu berechnet.';render();
 }catch(error){document.querySelector('#cost-message').textContent=error.message;}});
 document.querySelector('#reset-costs').addEventListener('click',()=>{try{localStorage.removeItem(storageKey);costState.records=data.profit.costs;costState.message='Demo-Kosten zurückgesetzt.';render();}catch{document.querySelector('#cost-message').textContent='Browserspeicher nicht verfügbar.';}});
}
