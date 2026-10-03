# Private Direktimport-Bausteine

Node 24; keine Abhängigkeit vom Browser oder GitHub Pages. `HttpTransport` → Auth → `DirectConnector` → `normalize` → `IntegrationStore`. Ausgewertete Verträge und Grenzen stehen in [docs/api/README.md](../docs/api/README.md).

## Ohne Zugangsdaten prüfen

```sh
npm run integrations:demo
npm run test:unit
node --use-env-proxy scripts/import-direct.js integrations/amazon-orders.example.json --plan
```

Der erste Befehl importiert 52 synthetische Konto-/Stream-Beispiele in `.data/integration-fixtures.sqlite`. Nur deren Testzusammenfassung wird als `src/data/integrations.generated.json` für die öffentliche Demo exportiert. `--plan` beschreibt die Anfrage und kontaktiert keinen Anbieter.

## Privater Import

Eine Konfiguration unter `.data/private-imports/` erstellen; keine Tokens in JSON oder Git speichern. Die öffentliche Build-Pipeline führt niemals `import-direct.js` aus. Erst nach Konto-/Vertragsprüfung:

```sh
node --use-env-proxy scripts/import-direct.js .data/private-imports/config.json --execute
```

Benötigte Prozessvariablen (nur Namen, keine Werte):

| Provider | Variablen |
| --- | --- |
| Amazon Seller | `AMAZON_SP_CLIENT_ID`, `AMAZON_SP_CLIENT_SECRET`, `AMAZON_SP_REFRESH_TOKEN` |
| Amazon Ads | `AMAZON_ADS_CLIENT_ID`, `AMAZON_ADS_CLIENT_SECRET`, `AMAZON_ADS_REFRESH_TOKEN` |
| eBay | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REFRESH_TOKEN` |
| OTTO | `OTTO_CLIENT_ID`, `OTTO_CLIENT_SECRET` |
| Kaufland | `KAUFLAND_CLIENT_KEY`, `KAUFLAND_SECRET_KEY` |

Diese Werte müssen dem **privaten Serverprozess** zugänglich sein. Insbesondere HMAC kann kein erst nachträglich vom HTTP-Proxy ersetztes Secret signieren. Keine `VITE_*`-Variablen, keine Zugangsdaten im Frontend. OAuth-Erstautorisierung/Consent-Callback und eBay-Key-Management sind noch nicht implementiert; der Tokenmanager verwendet bereits genehmigte Refresh-Tokens bzw. OTTO Client Credentials.

Konfiguration: `accountId`, `stream`, `periodStart`, `periodEnd`, bestätigtes `accountTimeZoneConfirmed`, gegebenenfalls `contractReviewed`, `scope`, `query`. `query` muss die tatsächlichen Anbieterfilter enthalten; die UI-Periode wird nicht automatisch in API-Zeitfilter übersetzt. Kandidatenverträge außerhalb Amazon SP benötigen `contractReviewed: true` erst nach Prüfung. Der Beispielmonat ist Demo, kein sinnvoller universeller Backfill-Start. Datumsangaben sind ISO-Tage; Zeitzonen-/Sommerzeitumrechnung liegt noch beim Aufrufer.

Ads zusätzlich: `profileId`, `reportTypeId`, `adType`, `attributionDays`, `groupBy` als **Dimensionsspalten im Ergebnis**, und `report` mit `reportTypeId`, `adProduct`, `groupBy` als **API-Gruppierung**, `columns`. Diese Angaben müssen zusammenpassen; keine gemeinsame Auswertung verschiedener Profile/Fenster. Das eingebundene Fixture zeigt die erwarteten Werte.

Report-Jobs: erster Aufruf fordert den Report an und speichert die ID; weitere Aufrufe pollen jeweils einmal und importieren nach Fertigstellung. Download-Hostnamen müssen explizit in `approvedDownloadHosts` stehen. Download-Anfragen erhalten keine Seller-Tokens. GZIP und JSON werden geprüft, komprimierte sowie dekomprimierte Antwortgröße auf 32 MiB begrenzt. Für ASIN-Tageswerte Sales-&-Traffic-Reports **pro Tag** anfordern: ASIN-Zeilen eines Monatsreports sind Periodensummen, auch bei DAY-Option. Der Normalisierer speichert deshalb den tatsächlichen Periodenbezug.

eBay Finances verweigert den Live-Abruf ohne konfigurierte Signaturstrategie. `DirectConnector` hat dafür `ebaySigner`; die CLI hat noch keinen fertigen Signer. Ein Token allein schaltet diese Strecke nicht frei.

## Garantien der implementierten Bausteine

- Nur GET und Report-Erstellung, keine Änderungen an Angeboten, Bestellungen oder Budgets.
- HTTPS, gleiche Provider-Origin bei Pagination; keine Auth-Weiterleitung an fremde Hosts oder Redirects.
- Token-Cache/Refresh, einmalige Neuauthentifizierung bei 401. GET wiederholt begrenzt bei 429/Server-/Transportfehlern, `Retry-After` berücksichtigt. POST wird nicht automatisch wiederholt.
- Pagination mit Schleifen-/Seitenlimit; vollständiger Lauf vor atomarem Upsert/Checkpoint. Fehlerhafte Läufe verschieben den Checkpoint nicht.
- Bestellereignisse nach Konto/Stream/Quell-ID dedupliziert, auch bei überlappenden Abfragen. Snapshots nach Datum; Reports nach ihrer tatsächlichen Granularität.
- Exakte Geldbeträge als Dezimalstrings mit sechs Nachkommastellen; keine Wechselkursschätzung. NULL bleibt unbekannt. Käufer-/Adressfelder werden nicht in analytische Facts übernommen.

## Noch kein Produktionsdienst

SQLite ist ein lokales Fundament. Ein einzelner Worker darf die CLI verwenden; verteilte Locks, Queue, Scheduler, Migrationsverwaltung, Mandantenlogin und automatische Kontokonfiguration fehlen. Seiten werden bis zum erfolgreichen Commit im Arbeitsspeicher gesammelt; große Backfills müssen in begrenzte Zeitfenster geteilt werden. Der gespeicherte Checkpoint ist ein Laufmarker, kein bereits automatisch verwendeter Delta-Scheduler.

Ein abgeschlossener Reportjob wird nicht stillschweigend neu angefordert. Korrekturabrufe brauchen bewusst neue Jobs. Ein Timeout bei Report-Erstellung kann trotz fehlender Antwort einen Providerjob erzeugt haben; vor Wiederholung dort abgleichen. Report-Zeilen, die später entfallen, werden noch nicht automatisch aus alten Imports entfernt. Verschiedene überlappende Periodenreports nicht addieren; der Kennzahlenhelfer weist unterschiedliche Perioden zurück. Mehrere Bestandsstichtage werden ebenfalls nicht summiert.

Importierte Facts verbleiben unter `.data/private-imports/integrations.sqlite`. Sie werden **nicht** in die öffentliche Demo exportiert. Produktmapping, Refund-/Gebührenledger und ein privater Reporting-Query-Service sind die nächste Implementierungsstufe; die aktuelle öffentliche UI nutzt weiterhin ihren isolierten synthetischen Snapshot. Vor Live-Betrieb sind Referenzabgleich und reale Sandbox-/Kontotests erforderlich.

## Kosten und Abrechnungen

`CostStore` speichert versionierte SKU-Stückkosten privat mit Revisionsschutz und Audit. Die lokalen CLIs `scripts/costs.js`, `scripts/profit.js`, `scripts/fetch-settlement.js` und `scripts/import-settlement.js` verwalten Kosten, berechnen geprüfte Profit-Eingaben und beziehen/importieren Abrechnungen. Keine dieser Strecken läuft im öffentlichen Build. [Vollständige Anleitung und Grenzen](../docs/PROFIT.md). Noch kein gehosteter Admin-HTTP-Dienst.
