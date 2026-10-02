# MP Dashboard · Amazon Analytics

Amazon-DE-Dashboard auf ASIN-Ebene mit einer lokalen Produktdatenbank als Grundlage für spätere Marketplace-Importe. Node.js 24, JavaScript, SQLite (Node `node:sqlite`), Vite und Playwright.

## Funktionsumfang

- **Verkauf & Traffic:** Bestellumsatz, verkaufte Einheiten (Sales), Sessions, Conversion Rate und letzter Bewertungsstand inklusive Anzahl und Datum je ASIN.
- **Erstattungen:** Betrag, erstattete Einheiten und Periodenquote je ASIN.
- **Werbung:** Sponsored Products, Sponsored Brands, Sponsored Display, Streaming TV und sonstige Werbeformen. Eindeutig ASIN-zugeordnete Kosten sind getrennt von nicht zuordenbaren Kosten auf Kontoebene.
- **Produktstamm:** interne Produkte → ASINs → Seller-SKUs. Mehrere SKUs einer ASIN verdoppeln keine Kennzahlen. Ein Produkt kann mehrere ASINs bündeln.
- Zeitraum-, Produkt- und ASIN/SKU-Suchfilter, Listing-Details sowie mobile Darstellung.

Alle Daten und IDs sind **synthetische Beispieldaten für September 2026**. Amazon-Importe, API-Verbindungen, Authentifizierung und Datenpflege im Browser sind noch nicht implementiert. Es gibt keine Auswertung anderer gekaufter SKUs und keine künstlich abgeleiteten organischen Sales.

## Entwicklung

```sh
npm ci
npm run db:init
npm run dev
```

`db:init` legt die leere lokale Datenbank `.data/catalog.sqlite` mit dem relationalen Schema an. Der Befehl ist wiederholbar und überschreibt keine Daten. Dieses lokale Datenbankfundament ist noch kein gehosteter Backend-Dienst.

`predev` und `prebuild` führen automatisch `npm run data:prepare` aus. Dieser Befehl legt separat `.data/demo.sqlite` an, ergänzt fehlende Beispieldatensätze idempotent und exportiert ausschließlich diese Demo in die ignorierte Datei `src/data/demo.generated.json`. Vite bindet den Snapshot in die öffentliche Website ein. Die Katalogdatenbank wird **nie** durch diesen Build exportiert. Beide SQLite-Dateien bleiben außerhalb von Git.

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
