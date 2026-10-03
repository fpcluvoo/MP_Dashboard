# MP Dashboard · Marketplace BI

Der verbindliche nächste Ausbau ist in [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md) geplant: Marketplace BI, Demo zuerst, gemeinsame Reporting-Verträge und späterer API-/Login-Betrieb. Die [Sortimentsdefinition](docs/PRODUCT_CATALOG.md) und [Sellerboard-Recherchehinweise](docs/SELLERBOARD_RESEARCH.md) konkretisieren die Planung. Der folgende Abschnitt beschreibt den bereits implementierten Stand.

Dashboard für neun Amazon-Länder sowie eBay, OTTO und Kaufland auf Listing-Ebene mit einer lokalen Produktdatenbank als Grundlage für spätere Marketplace-Importe. Node.js 24, JavaScript, SQLite (Node `node:sqlite`), Vite und Playwright.

## Funktionsumfang

- **Verkauf & Traffic:** Bestellumsatz, verkaufte Einheiten (Sales), Sessions, Conversion Rate und letzter Bewertungsstand inklusive Anzahl und Datum je ASIN.
- **Erstattungen:** Betrag, erstattete Einheiten und Periodenquote je ASIN.
- **Werbung:** Sponsored Products, Sponsored Brands, Sponsored Display, Streaming TV und sonstige Werbeformen. Eindeutig ASIN-zugeordnete Kosten sind getrennt von nicht zuordenbaren Kosten auf Kontoebene.
- **Produktstamm:** interne Produkte → ASINs → Seller-SKUs. Mehrere SKUs einer ASIN verdoppeln keine Kennzahlen. Ein Produkt kann mehrere ASINs bündeln.
- Zeitraum-, Produkt- und ASIN/SKU-Suchfilter, Listing-Details sowie mobile Darstellung.

Marken und Modellnamen stammen aus dem bestätigten Sortiment **Clouvou, Lutivo und Wintoncove**. Der Produktstamm zeigt 15 benannte Modelle und offene Sortimentsgruppen. Für die 18 bestätigten Clouvou-Bürostuhl-Farbvarianten werden **synthetische Kennzahlen für September 2026** erzeugt; sämtliche Demo-Listing-/SKU-IDs sind ausdrücklich mit `DEMO-` gekennzeichnet. Echte ASINs/SKUs und unbekannte Varianten bleiben offen. Zwölf serverseitige Importstrecken mit OAuth-/HMAC-Authentifizierung, Report-Jobs, Normalisierung und SQLite-Upserts sind vorbereitet und mit synthetischen API-Antworten getestet. Echte Konten sind noch nicht verbunden; Login und Datenpflege im Browser fehlen weiterhin. Siehe [API-Recherche und Dateninventar](docs/api/README.md) sowie [Importbetrieb](backend/README.md). Es gibt keine Auswertung anderer gekaufter SKUs und keine künstlich abgeleiteten organischen Sales.

Neun getrennte Amazon-Kanäle: DE, FR, IT, ES, NL, BE, PL, GB und US. eBay/Kaufland zunächst Deutschland. 216 synthetische Listings, EUR/GBP/PLN/USD ohne Währungsmischung; eBay-Pageviews bleiben getrennt von Amazon-Sessions. OTTO-/Kaufland-Traffic und nicht belegte Werbung werden als unbekannt dargestellt. Der Reiter **Datenquellen & APIs** zeigt Importstatus, Quellfelder und Grenzen.

## Entwicklung

```sh
npm ci
npm run db:init
npm run dev
```

`db:init` legt die leere lokale Datenbank `.data/catalog.sqlite` mit dem relationalen Schema an. Der Befehl ist wiederholbar und überschreibt keine Daten. Dieses lokale Datenbankfundament ist noch kein gehosteter Backend-Dienst.

`predev` und `prebuild` führen automatisch `npm run data:prepare` aus. Dieser Befehl legt separat `.data/demo-direct-channels-v1.sqlite` an, ergänzt fehlende Beispieldatensätze idempotent und exportiert ausschließlich diese Demo in die ignorierte Datei `src/data/demo.generated.json`. Die öffentliche Website lädt den versionierten JSON-Snapshot als statische Datei. Der Seed liest Modelle und Varianten aus `catalog/assortment.json`; Marken-/Kategorie-/Modellfilter sind direkt nutzbar. Die vorherige `.data/demo.sqlite` wird nicht gelöscht oder weiter exportiert. Die Katalogdatenbank wird **nie** durch diesen Build exportiert. Beide SQLite-Dateien bleiben außerhalb von Git.

```sh
npm run build
npm run preview
npm run test:unit
npx playwright install chromium
npm test
```

In der Cloud mit vorhandenem Browser: `CHROMIUM_PATH=/usr/bin/chromium npm test`. npm-Installationen hier mit `--cache /workspace/.npm-cache` ausführen. Der Browsertest startet seinen Server auf Port 4173 selbst. `npm test` prüft zuerst das Datenmodell und anschließend die Oberfläche.

## Datenmodell und Definitionen

Siehe [database/README.md](database/README.md) und [database/schema.sql](database/schema.sql). Die Kennzahlendefinitionen sind ebenfalls direkt im Dashboard abrufbar. Fehlende Werte sind keine Nullwerte; Bewertungen werden nicht über ASINs gemittelt. Kosten ohne eindeutigen ASIN-Bezug werden niemals auf Produkte verteilt.

## Veröffentlichung

Öffentliche Demo: https://fpcluvoo.github.io/MP_Dashboard/

`.github/workflows/pages.yml` testet und baut bei jedem Push auf `main` und veröffentlicht den synthetischen Snapshot über GitHub Pages. In **Settings → Pages → Source** muss **GitHub Actions** ausgewählt sein. GitHub Pages hostet nur die statische Demo, keine SQLite-Datenbank oder Server-API.

Echte Seller-Daten dürfen nicht in diesen öffentlichen Demo-Build gelangen. Die spätere Amazon-Anbindung braucht einen privaten Backend-Dienst mit Zugriffskontrolle, sicheren API-Zugangsdaten und freigegebenen Datenquellen. Dafür stehen Tabellen für Konten/Regionen, Produkt-/SKU-Zuordnungen, Tageskennzahlen, Bewertungsstände und Werbeausgaben bereit. Bestehende Konto- und Produktzuordnungen dürfen beim Import nicht aus Produktnamen erraten werden.
