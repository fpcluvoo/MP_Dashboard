# Direktanbindungen: Recherche und Implementierungsstand

Stand 03.10.2026. **Keine Live-Kontoverbindung wurde hergestellt.** Die öffentliche Demo enthält ausschließlich synthetische Daten. Implementiert sind ausführbare, serverseitige Importbausteine und Tests mit Beispielantworten; das ist keine Bestätigung durch die Hersteller oder ein fertiger Produktionsbetrieb.

## Kanäle und Produktzuordnung

Amazon Deutschland, Frankreich, Italien, Spanien, Niederlande, Belgien, Polen, Großbritannien und USA sind getrennte Kontokontexte. EU-/NA-Endpunkte, Marketplace-IDs, Währungen und vorgeschlagene Reporting-Zeitzonen stehen in `integrations/registry.js`. Zeitzonen müssen am tatsächlichen Seller-/Ads-Konto bestätigt werden, besonders USA. Ads-Profil und Seller-Konto sind unterschiedliche Identitäten.

eBay Deutschland, OTTO und Kaufland Deutschland kommen als Direktkanäle hinzu. Deutschland ist für eBay/Kaufland zunächst die Demo-Annahme, keine Behauptung über alle angeschlossenen Länder. ChannelEngine und der als „Billware“ genannte weitere Kanal bleiben für den nächsten Schritt offen.

Ein interner Produktstamm trägt alle Kanäle. Eine externe Zuordnung braucht Konto + Listing-ID + SKU, später Gültigkeitszeitraum; Namensähnlichkeit reicht nicht. Die Demo zeigt 18 bestätigte Varianten auf zwölf Kanälen (216 synthetische Listings). Das bestätigt keine reale Verfügbarkeit dieser Varianten in jedem Land. Unbekannte echte SKU-/ASIN-Mappings bleiben leer.

## Evidenz und nachschlagbares Dateninventar

[Das maschinenlesbare Inventar](field-inventory.json) enthält **130 Modell-/Schemasammlungen, 903 Operations-/Pfad-Einträge und 12.518 deklarierte Modellfelder**. Jeder Eintrag verweist auf einen festgehaltenen Quellstand. Das Inventar umfasst auch Schreib-, Vendor- und Logistikoperationen zur Recherche; nur die unten genannten Lesestrecken sind implementiert. OTTO-Einträge sind SDK-Pfade, nicht vollständig nach HTTP-Methode aufgelöste Operationen. Verschachtelte JSON-Schema-Felder und dynamische Ads-Spalten sind damit nicht vollständig katalogisiert. Es ist keine Zusage, sämtliche APIs oder Kontoberechtigungen erfasst zu haben.

| Anbieter | Gelesene Quelle | Belegqualität / Grenze |
| --- | --- | --- |
| Amazon SP-API | [Offizielle Modelle und Report-Schemas, festgehaltener Commit](https://github.com/amzn/selling-partner-api-models/tree/3677bb9d96f4450e6843f1f8207005e925d5c867) | Herstellerquelle, einschließlich Orders 2026-01-01, Finances 2024-06-19 und Reports 2021-06-30 |
| Amazon Ads | [Reporting-v3-SDK und Beispiele](https://github.com/denisneuf/python-amazon-ad-api/tree/11034e74b6da071c4a0738a9a7cd44e61a0a029d) | Community-SDK; dynamische Spalten/zulässige Kombinationen müssen im Herstellerportal überprüft werden |
| eBay | [Gespiegelte OpenAPI-Spezifikationen](https://github.com/hendt/ebay-api/tree/e20388bcf49cb7a46b5bf5ba8006b8d7d29ec3c8/specs) | Community-Spiegel; keine Garantie für aktuelle Freigaben |
| OTTO | [Generierter SDK-Quellstand](https://github.com/creatissimo/otto-market-api/tree/0f4467327db60c75f769d75d06793a312807722d) | Community-SDK; Orders-v4-/Receipts-Verträge als Kandidaten |
| Kaufland | [Seller-API-Swagger im Community-SDK](https://github.com/saleweaver/python-kaufland-api) | Spiegel der Version 2.27.0; exakter Commit und Dateipfad im Inventar |

Die direkten Dokumentationsportale waren in dieser Cloud durch die Netzwerkfreigabe blockiert. Daher wurden öffentlich abrufbare GitHub-Quellen ausgewertet und die schwächere Evidenz sichtbar gemacht. Herstellerportale für die nächste Prüfung: [Amazon SP-API](https://developer-docs.amazon.com/sp-api/), [Amazon Ads](https://advertising.amazon.com/API/docs/en-us), [eBay](https://developer.ebay.com/api-docs/sell/static/overview.html), [OTTO](https://api.otto.market/docs), [Kaufland](https://sellerapi.kaufland.com/).

## Daten, die für BI relevant sind

| Quelle | Datenfamilien im recherchierten Vertrag | Aktuell normalisierter Teil |
| --- | --- | --- |
| Amazon Orders | Bestellung/Position, ASIN/SKU, Status, Mengen, Erlöse, weitere optional eingebundene Kosten-/Steuer-/Fulfillment-Daten | IDs, ASIN/SKU, Bestellzeit, Status, Menge, Positions-Proceeds |
| Amazon Sales & Traffic | Ordered Product Sales, Units, Order Items, Sessions, Pageviews, Unit Session %, Buy Box, B2B-/Browser-/App-Aufteilung | Child-ASIN, SKU sofern enthalten, Umsatz, Einheiten, Sessions, Pageviews |
| Amazon Finances | Transaktionen, Status, Beträge, Gebühren-/Erstattungs-Breakdowns und Zuordnungen | Transaktions-ID, Typ/Status, Buchungszeit, Währung/Betrag; keine vollständige Gebühren-/Refund-Auflösung |
| Amazon FBA Inventory | ASIN, SKU, FNSKU, Zustand, verfügbar, reserviert, inbound, unverkäuflich | SKU/ASIN, Gesamtbestand, erfüllbarer Bestand, Snapshot-Datum |
| Amazon Ads v3 | Kosten, Klicks, Impressionen, Sales/Purchases nach Attribution, Kampagnen-/Anzeigen-/Produktdimensionen je Report | Datum, explizite Dimensionsschlüssel, advertised ASIN/SKU sofern vorhanden, Kosten/Klicks/Impressionen, salesXd/purchasesXd für gewähltes Fenster |
| eBay Fulfillment | Bestellungen/Positionen, Listing/SKU, Mengen, Preise, Steuern, Versand und Status | Positions-ID, Listing/SKU, Datum, Menge, Positionsbetrag, Fulfillment-Status |
| eBay Analytics | Listing-/Tagesdimensionen, Impressionen, Views, Transactions, Conversion und Datenstand | dynamisch über Header zugeordnete Views/Impressionen/Transaktionen; `applicable=false` bleibt fehlend |
| eBay Finances | Transaktionen, Credit/Debit, Gebühren, Erstattungen, Auszahlungsbezug | Transaktions-ID, Typ, Buchungsrichtung, Betrag, Datum, Bestellbezug; Signer noch einzusetzen |
| OTTO Orders | Bestellung, einzelne PositionItem, SKU/Artikel/EAN, Brutto-/reduzierter Bruttopreis, Lifecycle | Positions-ID, SKU/Artikel, Datum, Status, Bruttobetrag; eine PositionItem entspricht einer Einheit |
| OTTO Receipts | Belege, ursprünglicher Beleg, Typ, Positionen, Netto/Brutto/Steuer und Teil-Erstattungen | Belegnummer/-typ, Datum, Bestellbezug, Summen brutto/netto/Steuer |
| Kaufland Order Units | Bestell-/Order-Unit-ID, Offer-/Produkt-ID, Status, Preis, Erlöse, Storefront | IDs, Offer/SKU, Datum, Status, Preis, revenue gross/net; Centwerte werden dezimal normalisiert |
| Kaufland Units | Angebote, Produkt-/Offer-ID, Zustand, Bestand, Preis | IDs, Offer/SKU, Bestand, Preis, Snapshot-Datum |

Weitere inventarisierte Familien sind Katalog/Attribute, Listings/Angebote, Pricing, Fulfillment/Versand, Retouren, Reports, Benachrichtigungen sowie teilweise Marketing. Dafür sind noch keine vollständigen Importadapter implementiert. Nicht benötigte Käufer-/Adressdaten werden vom Normalisierer nicht übernommen.

### Werbung und Bewertungen

SP, SB und SD verwenden unterschiedliche Report-Typen, Gruppierungen und Spalten. Das Beispiel ist ein Sponsored-Products-Produktreport mit explizitem Attributionsfenster. Der Jobtreiber erlaubt andere Konfigurationen; damit sind SB/SD **nicht automatisch fachlich validiert**. Unsuffixed `sales`/`purchases`, andere Conversion-Definitionen sowie DSP-/TV-Berichte brauchen eigene Spaltenzuordnungen. Report-`groupBy` (API-Gruppierung) und die Dimensionsspalten im Normalisierungskontext sind verschiedene Angaben.

Ein Kampagnenreport ohne Produktdimension bleibt unzugeordnet. Produkt- und Kampagnentotale dürfen nicht gemeinsam addiert werden. Unzugeordnete Restkosten dürfen erst nach belegtem Abgleich desselben Kontos, Zeitraums und Kostentyps gebildet werden. Die Demo simuliert SP/SB/SD/TV; sie verspricht keinen universellen TV-zu-ASIN-Bericht. eBay Promoted Listings ist recherchiert, dessen Reportadapter fehlt noch. OTTO-/Kaufland-Ads und Traffic sind nicht als allgemeine Seller-API-Funktion bestätigt.

Amazon Customer Feedback liefert Themen/Trends zu Reviews/Retouren; daraus folgt **kein allgemeiner Zugriff auf historische Sternebewertungen**. Die Beispielbewertungen sind simuliert. Für tatsächliche Bewertungsstände braucht es eine gesondert bestätigte Quelle.

## Berechenbare Kennzahlen und fachliche Grenzen

| Kennzahl | Berechnung / notwendige Grundlage | Stand |
| --- | --- | --- |
| Umsatz / Einheiten | Summe innerhalb einer Quelle, Währung und Umsatzdefinition | Normalisierte Summen; Statusbehandlung noch fachlich zu erweitern |
| Durchschnittspreis | Umsatz / Einheiten | Ableitbar; Nullnenner unbekannt |
| Amazon Unit Session % | Summe Units / Summe Sessions | Implementiert; keine Order-Conversion und keine eindeutigen Besucher über ASINs |
| eBay Transaktionen / Views | Transactions / Listing Views | Implementiert; keine Amazon-Sessions |
| CTR / CPC | Klicks / Impressionen; Kosten / Klicks | Implementiert |
| ACoS / ROAS | Ads-Kosten / attribuierter Ads-Umsatz und umgekehrt | Implementiert, nur bei gleichem Profil, Reporttyp und Attributionsfenster |
| Erstattungsbetrag/-quote | verifizierte Refund-Ereignisse; erstattete / verkaufte Einheiten | In Demo vorhanden; reale Ereignis-/Positionszuordnung noch auszubauen |
| TACoS | sämtliche passenden Werbekosten / passenden Gesamtumsatz | Nach Kostenabgleich ableitbar; noch keine fertige Zusammenführung |
| Gebührenquote / Deckungsbeitrag | vollständige Gebühren, Retouren, Steuerbasis, COGS und weitere Kosten | Fehlende Daten bedeuten unbekannt; keine Gewinnzusage |
| Bestandsreichweite | nutzbarer Bestand / Absatz pro Tag über explizites Fenster | Ableitbar nach Snapshot-/Absatzabgleich; keine fertige Prognose |
| Wachstum / Vorperiode / YoY | vergleichbare vollständige Perioden mit gleicher Definition | Geplant; die neue Anbindung allein implementiert noch keine Vergleichs-UI |
| Organischer Absatz | Ads-Attribution ist nicht deckungsgleich mit Bestellumsatz | Nicht durch einfaches Subtrahieren errechnen; Halo/Cross-SKU bleibt außerhalb |

Orders enthalten auch offene/stornierte Vorgänge. Ihre aktuellen Summen beschreiben Quellpositionen und sind **kein abgestimmtes Nettoverkaufsergebnis**. Finanztransaktionsbeträge, Auszahlungen und Kaufland `revenue_net` dürfen nicht stillschweigend als Umsatz oder Gewinn verwendet werden.

## Importbetrieb und nächster Schritt

Siehe [Betriebsanleitung](../../backend/README.md). 12 Stream-Typen werden mit 52 Konto-/Stream-Kombinationen geprüft. Beispiele decken den Grundvertrag ab, keine komplette Sammlung aller optionalen API-Antworten.

Vor echten Daten: Herstellerverträge/Scopes bestätigen, Seller-/Ads-Konten autorisieren, Zeitzonen und Historienfenster prüfen, Referenzberichte abgleichen, echte SKU-Zuordnungen einrichten. Backfill-Fenster, Rate Limits und Report-Latenzen sind konto-/reportabhängig und werden nicht pauschal garantiert. Bestellungen mit Änderungszeit abrufen; spätere Korrekturen mit bewusstem Überlappungsfenster und erneuten Reports einlesen.

Danach folgen Ledger-/Refund-Normalisierung, geprüfte Zuordnung zum Produktstamm, ein privater Query-Service für das UI, PostgreSQL/Migrationen, Queue/Scheduler, Login/Rollen, Monitoring und Backups. Die öffentliche Pages-Demo bleibt unabhängig davon. Ein API-Token allein ersetzt diese Betriebsbausteine nicht.
