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

## Öffentliche Demo auf GitHub Pages

Der Workflow `.github/workflows/pages.yml` testet und baut die Anwendung bei jedem Push auf `main` und veröffentlicht `dist` auf GitHub Pages. Die Website zeigt ausschließlich die oben beschriebenen Beispieldaten.

Einmalig unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** auswählen. Falls der erste Workflow vor der Aktivierung fehlgeschlagen ist, unter **Actions → Deploy dashboard to GitHub Pages → Run workflow** erneut starten. Bei privaten Repositories hängt die Verfügbarkeit von GitHub Pages vom GitHub-Tarif ab; das Repository muss für diese Einrichtung nicht öffentlich gestellt werden.

Nach einem erfolgreichen Deploy ist die erwartete Adresse:
https://fpcluvoo.github.io/MP_Dashboard/

Der relative Vite-Basispfad stellt sicher, dass JavaScript und CSS auch unter dem Repository-Unterpfad geladen werden.
