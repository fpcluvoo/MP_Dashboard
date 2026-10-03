// Public configuration only. Seller IDs, OAuth credentials and tokens stay on the server.
export const amazonMarkets = [
  ['de','Deutschland','A1PA6795UKMFR9','EUR','Europe/Berlin','eu'],
  ['fr','Frankreich','A13V1IB3VIYZZH','EUR','Europe/Paris','eu'],
  ['it','Italien','APJ6JRA9NG5V4','EUR','Europe/Rome','eu'],
  ['es','Spanien','A1RKKUPIHCS9HS','EUR','Europe/Madrid','eu'],
  ['nl','Niederlande','A1805IZSGTT6HS','EUR','Europe/Amsterdam','eu'],
  ['be','Belgien','AMEN7PMS3EDWL','EUR','Europe/Brussels','eu'],
  ['pl','Polen','A1C3SOZRARQ6R3','PLN','Europe/Warsaw','eu'],
  ['gb','Großbritannien','A1F83G8C2ARO7P','GBP','Europe/London','eu'],
  ['us','USA','ATVPDKIKX0DER','USD','America/Los_Angeles','na'],
].map(([country,label,marketplaceId,currency,timeZone,region]) => ({id:`amazon-${country}`,provider:'amazon',country,label:`Amazon ${label}`,marketplaceId,currency,timeZone,region}));
export const channels = [...amazonMarkets,
  {id:'ebay-de',provider:'ebay',country:'de',label:'eBay Deutschland',currency:'EUR',timeZone:'Europe/Berlin',region:'eu',marketplaceId:'EBAY_DE'},
  {id:'otto-de',provider:'otto',country:'de',label:'OTTO',currency:'EUR',timeZone:'Europe/Berlin',region:'eu'},
  {id:'kaufland-de',provider:'kaufland',country:'de',label:'Kaufland Deutschland',currency:'EUR',timeZone:'Europe/Berlin',region:'eu',storefront:'de'},
];
export const providers = {
  amazon: {name:'Amazon Selling Partner', evidence:'Offizielles Amazon-Modell', auth:'Login with Amazon · Seller-Autorisierung', docs:'https://developer-docs.amazon.com/sp-api/', needs:['LWA Client-ID / Secret','Seller Refresh-Token','Seller-ID und Marketplace-Berechtigungen'], caveat:'Scopes, Berichtszugang und Datenhistorie müssen je Konto geprüft werden. US-Berichtszeitzone ist konfigurierbar; Ads-Profile können eine andere Zeitzone verwenden.'},
  amazonAds: {name:'Amazon Ads', evidence:'Community-SDK / Herstellerprüfung offen', auth:'OAuth / LWA · Ads-Profil pro Region', docs:'https://advertising.amazon.com/API/docs/en-us', needs:['Ads API-Zulassung / Client-ID','Ads Refresh-Token','Profile-ID je Werbekonto'], caveat:'Eigenständige Ads-Zulassung. SP/SB/SD und DSP/TV besitzen unterschiedliche Berichtsdimensionen und Attributionsfenster; kein allgemeiner TV-zu-ASIN-Report garantiert.'},
  ebay: {name:'eBay Sell APIs', evidence:'Gespiegelte OpenAPI / Herstellerprüfung offen', auth:'OAuth Authorization Code + Refresh', docs:'https://developer.ebay.com/api-docs/sell/static/overview.html', needs:['App Client-ID / Secret','Seller Refresh-Token','Freigaben für Fulfillment, Analytics, Finances, Inventory'], caveat:'Pageviews sind keine Amazon-Sessions. Finances kann zusätzlich signierte Requests und eBay-Key-Management erfordern; dafür ist ein eigener Signer-Hook vorgesehen.'},
  otto: {name:'OTTO Market', evidence:'Generiertes Community-SDK / Herstellerprüfung offen', auth:'OAuth Client Credentials', docs:'https://api.otto.market/docs', needs:['Partner-Client-ID / Secret','Berechtigte API-Scopes'], caveat:'Öffentliche Seller-Lesestrecken liefern keine allgemein bestätigte Sessions-/Ads-/Bewertungsquelle. Order-v4-Vertrag ist ein Kandidat bis zur aktuellen Herstellerprüfung.'},
  kaufland: {name:'Kaufland Seller API', evidence:'Gespiegelte OpenAPI 2.27.0 / Herstellerprüfung offen', auth:'HMAC SHA-256 je Request', docs:'https://sellerapi.kaufland.com/', needs:['Client-Key','Lokal nutzbarer Secret-Key zum Signieren','Freigabe der Storefront'], caveat:'Order-Units, Gebühren, Retouren und Bestand getrennt behandeln. Preis-/Erlösfelder sind nicht automatisch betriebswirtschaftlicher Nettoumsatz. Ads/Traffic benötigen separat bestätigte Quellen.'},
};
export const streams = [
  {id:'amazon.orders',provider:'amazon',label:'Bestellpositionen',path:'/orders/2026-01-01/orders',pagination:'amazonOrders',fields:['Bestell-ID','OrderItem-ID','ASIN','Seller-SKU','Einheiten','Proceeds','Status','Erstell-/Änderungszeit'],basis:'order-item-proceeds'},
  {id:'amazon.salesTraffic',provider:'amazon',label:'Sales & Traffic Report',path:'/reports/2021-06-30/reports',report:true,fields:['Child-/Parent-ASIN','Umsatz','Einheiten','Order Items','Sessions','Pageviews','B2B','Buy-Box-Anteil'],basis:'ordered-product-sales'},
  {id:'amazon.finances',provider:'amazon',label:'Finanztransaktionen',path:'/finances/2024-06-19/transactions',pagination:'amazonToken',fields:['Transaktions-ID','Buchungsdatum','Betrag','Währung','Typ','Status','Breakdowns','Zuordnungen'],basis:'financial-event'},
  {id:'amazon.inventory',provider:'amazon',label:'FBA-Bestand',path:'/fba/inventory/v1/summaries',pagination:'amazonInventory',fields:['ASIN','Seller-SKU','FNSKU','Bestand','Zustand','Reserviert','Inbound','Unverkäuflich'],basis:'snapshot'},
  {id:'amazonAds.report',provider:'amazonAds',label:'Ads Reporting v3',path:'/reporting/reports',report:true,fields:['Datum','Kampagne','Ad Group','Advertised ASIN/SKU sofern verfügbar','Kosten','Klicks','Impressionen','zugeordnete Sales/Umsätze nach Fenster'],basis:'ad-attributed'},
  {id:'ebay.orders',provider:'ebay',label:'Fulfillment Orders',path:'/sell/fulfillment/v1/order',pagination:'next',fields:['Order-ID','LineItem-ID','SKU','Listing-/Varianten-ID','Einheiten','Positionsbetrag','Steuern','Versand','Status'],basis:'discounted-line-item-cost'},
  {id:'ebay.traffic',provider:'ebay',label:'Analytics Traffic',path:'/sell/analytics/v1/traffic_report',fields:['Listing-ID oder Tag','Impressionen','Pageviews','Sales Conversion','Transaktionen','Datenstand'],basis:'traffic-report'},
  {id:'ebay.finances',provider:'ebay',label:'Finances Transactions',path:'/sell/finances/v1/transaction',pagination:'next',fields:['Transaktion','Credit/Debit','Betrag','Gebühren','Payout-Zuordnung','Refund-Typ'],basis:'financial-event'},
  {id:'otto.orders',provider:'otto',label:'Orders v4 · Vertragskandidat',path:'/v4/orders',pagination:'links',fields:['SalesOrder-ID','PositionItem-ID','SKU','Artikelnummer','EAN','Bruttobetrag','reduzierter Bruttobetrag','Lifecycle/Status'],basis:'reduced-gross-item-price'},
  {id:'otto.receipts',provider:'otto',label:'Receipts · Vertragskandidat',path:'/v2/receipts',pagination:'links',fields:['Belegnummer','Belegtyp','Originalbeleg','Brutto/Netto/Steuer','Positionen','Teil-Erstattungen'],basis:'receipt'},
  {id:'kaufland.orders',provider:'kaufland',label:'Order Units',path:'/v2/order-units',pagination:'offset',fields:['Order-Unit-ID','Order-ID','Offer-ID','Produkt-ID','Preis','Revenue gross/net','Status','Storefront'],basis:'order-unit-price'},
  {id:'kaufland.inventory',provider:'kaufland',label:'Units / Angebote',path:'/v2/units',pagination:'offset',fields:['Unit-ID','Offer-ID','Produkt-ID','Bestand','Preis','Zustand','Storefront'],basis:'snapshot'},
];
export const capabilityMatrix = [
  ['Umsatz / Einheiten','amazon','Bestellungen + Sales & Traffic','Direkt, mit unterschiedlicher Umsatzbasis'],
  ['Sessions / Unit Session %','amazon','Sales & Traffic','Berechtigter Bericht, täglich je Child-ASIN anfordern'],
  ['Bewertungen / Review-Themen','amazon','Customer Feedback','Topics/Trends ≠ frei verfügbare historische Sternebewertungen'],
  ['Werbung SP / SB / SD','amazonAds','Reporting v3','Profil, Berichtstyp, Gruppierung und Attribution erforderlich'],
  ['Streaming TV / DSP','amazonAds','Separate Produkte / Reports','Verfügbarkeit offen; keine ASIN-Zuordnung voraussetzen'],
  ['Umsatz / Einheiten','ebay','Fulfillment Orders','Direkt'],
  ['Pageviews / Sales Conversion','ebay','Sell Analytics','Bedingt; Definition nicht mit Amazon-Sessions gleichsetzen'],
  ['Promoted Listings','ebay','Sell Marketing Reports','Separater Reportadapter noch nicht implementiert'],
  ['Orders / Belege / Retouren / Bestand','otto','OTTO Market','Vertragskandidat; Live-Zulassung ausstehend'],
  ['Sessions / Werbung / Sterne','otto','Keine verifizierte Seller-Quelle','Nicht verfügbar darstellen, nicht als Null'],
  ['Orders / Retouren / Bestand / Reports','kaufland','Seller API v2','Bestellungen und Bestandsadapter implementiert; weitere Strecken inventarisiert'],
  ['Sessions / Werbung / Sterne','kaufland','Keine verifizierte Seller-Quelle','Keine Kennzahl oder API erfinden'],
];
