# MP Dashboard

Deutschsprachige Dashboard-Basis für Online-Marketplace-Daten, gebaut mit JavaScript und Vite.

## Aktueller Stand

- Umsatz, Bestellungen, durchschnittlicher Bestellwert und offene Bestellungen
- Filter nach Marktplatz und Zeitraum sowie Umsatzvergleich und Bestellliste
- Responsive Oberfläche mit **synthetischen Beispieldaten** für Amazon, eBay und Etsy (September 2026)

Es bestehen noch keine echten Marketplace-Verbindungen. Die Plattformnamen sind Beispiele und legen die späteren Integrationen nicht fest. Umsatz bedeutet hier Bestellwert, ohne Gebühren- und Retourenabzug. Es gibt noch kein Backend, Login oder dauerhafte Datenspeicherung. API-Schlüssel gehören niemals in Browsercode oder Git; echte Anbindungen benötigen eine abgesicherte serverseitige Integration.

## Entwicklung

Node.js 24 (siehe `.nvmrc`) und npm verwenden.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

## Browsertests

Einmalig den Playwright-Browser installieren, dann die Tests starten:

```sh
npx playwright install chromium
npm test
```

Alternativ einen vorhandenen Chromium verwenden:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

Die Tests prüfen Kennzahlen, kombinierte Filter, Zurücksetzen, JavaScript-Fehler und das mobile Layout. Der Testserver startet automatisch auf Port 4173; dieser Port muss frei sein.

## Cloud-Umgebung

Das Checkout liegt unter `/workspace/MP_Dashboard`. In dieser Umgebung npm mit `--cache /workspace/.npm-cache` ausführen, da der Standardcache im Home-Verzeichnis nicht beschreibbar ist. Es werden keine Secrets oder externen Dienste für die Demo benötigt. Nach einer neuen Sitzung `npm run dev -- --port 5173 --strictPort` starten. Laufende Prozesse werden nicht als Bestandteil des Umgebungssnapshots vorausgesetzt.
