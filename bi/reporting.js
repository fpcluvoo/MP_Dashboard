import {datesBetween} from './model.js';
export const reportViews=['overview','products','sales','refunds','ads','catalog','profit','quality','sources'];
export function validateView(state,data) {
 if(!state||state.version!==1||!Array.isArray(state.accountIds)||!state.accountIds.length||new Set(state.accountIds).size!==state.accountIds.length||state.accountIds.some(id=>!data.accounts.some(a=>a.id===id)))throw new Error('Ungültige Kanalauswahl');
 datesBetween(state.start,state.end);if(state.start<data.historyStart||state.end>data.end)throw new Error('Zeitraum außerhalb der Demo');
 if(!reportViews.includes(state.view)||!['eur','original'].includes(state.currency))throw new Error('Ungültige Ansicht');
 for(const [key,records] of [['brandId',data.catalog.brands],['categoryId',data.catalog.categories],['productId',data.catalog.models]])if(state[key]!=='all'&&!records.some(r=>r.id===state[key]))throw new Error('Ungültiger Produktfilter');
 if(state.productId!=='all'){const model=data.catalog.models.find(m=>m.id===state.productId);if(state.brandId!=='all'&&model.brand_id!==state.brandId||state.categoryId!=='all'&&model.category_id!==state.categoryId)throw new Error('Widersprüchliche Produktfilter');}
 return {version:1,accountIds:[...state.accountIds],start:state.start,end:state.end,view:state.view,currency:state.currency,brandId:state.brandId,categoryId:state.categoryId,productId:state.productId,query:String(state.query??'').slice(0,160),compare:state.compare!==false};
}
export function csvCell(value) {
 if(value==null)return '""';
 let text=typeof value==='number'?String(Number(value.toFixed(6))).replace('.',','):String(value);
 if(typeof value!=='number'&&/^[\s\u0000-\u001f]*[=+\-@]/.test(text))text="'"+text;
 return `"${text.replaceAll('"','""')}"`;
}
export function productCsv(analysis,currency) {
 const {options}=analysis;
 const header=['Modell','Marke','Produkt-ID','Kanäle','Von','Bis','Währung','Umsatz','Vorperiode Umsatz','Änderung %','Einheiten','Erstattungsquote %','Deckungsbeitrag vor Kontokosten','Marge %','DB verfügbar','Quelle','FX-Quelle'];
 const rows=analysis.products.map(p=>[p.name,p.brandName,p.id,options.accountIds.join(' | '),options.start,options.end,currency,p.revenue,p.previousRevenue,p.change.relative==null?null:p.change.relative*100,p.metrics.units,p.refundRate==null?null:p.refundRate*100,p.profit,p.margin==null?null:p.margin*100,p.profit==null?'Nein':'Ja','Synthetische Demo',options.eur?'Synthetische Tageskurse':'Originalwährung']);
 return '\uFEFF'+[header,...rows].map(r=>r.map(csvCell).join(';')).join('\r\n');
}
