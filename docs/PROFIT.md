# Profit, SKU-Kosten und EUR-Reporting

Stand 03.10.2026. Implementiert sind Kostenhistorie, private lokale Speicherung, eine geteilte Berechnungsfunktion und die Demo-Bedienung. **Keine echten Konten sind autorisiert, keine tatsächliche Abrechnung ist abgeglichen.**

## Berechnung

Nettoerlös nach Erstattungen − Marktplatzgebühren − Einkauf − Fulfillment − Verpackung − Anlieferung − Zoll − Sonderkosten + belegte Warenkosten-Rückbuchung − zugeordnete Werbung = **Deckungsbeitrag**.

Profit Margin = Deckungsbeitrag / Nettoerlös nach Erstattungen. Quote aus Summen, kein Durchschnitt einzelner Margen. Bei Nettoerlös ≤ 0 bleibt die Marge unbekannt; negative Deckungsbeiträge sind zulässig. Nicht zugeordnete Kontowerbung wird getrennt gezeigt und nur bei vollständiger Kontoauswahl für den Konto-Deckungsbeitrag abgezogen. Ohne allgemeine Betriebskosten, Finanzierung und Ertragsteuern ist das kein Unternehmensgewinn/Jahresüberschuss.

Netto meint betriebswirtschaftlich bereinigte Umsatzsteuer, nicht „Auszahlungsbetrag“. Steuerbehandlung, Reverse Charge, nicht abzugsfähige Vorsteuer, Marketplace-Deemed-Supplier und Versand-/Rabattbestandteile müssen vor echten Imports fachlich zugeordnet werden. Es gibt keinen pauschalen 19%-Abzug für echte Länder. Nur die ausdrücklich erfundene Demo verwendet ein vereinfachtes Steuermodell.

`profit/calculate.js` erwartet geprüfte Positionsdaten: eindeutige ID, Konto, Listing, Seller-SKU, Datum, Währung, Menge, `revenueNet`, `refundNet`, `marketplaceFeesNet`, `feesComplete`, optional tatsächliche `fulfillmentNet`, explizite `inventoryCreditNet`. Datum ist der vereinbarte Ergebniszeitbezug. Demo-Bestellungen/Refunds liegen am selben Tag. Echte zeitversetzte Refunds benötigen eine bewusste Buchungsperioden- oder Bestellkohorten-Zuordnung; bestehende Order-Facts dürfen nicht ungeprüft direkt eingesetzt werden. Teilstornos, Rücksendungen und Statusübergänge müssen abgeglichen sein.

Die Berechnung prüft doppelte Positionen, Konto-/Währungsgrenzen, doppelte Tageskosten und fehlende Werte. Fehlender Einkauf, ungeklärte Gebühren oder fehlende Werbung sperren den vollständigen Deckungsbeitrag; der bekannte DB vor Werbung bleibt separat sichtbar. Explizite Null ist erlaubt. Ein Geld-Refund allein begründet keine Warenkosten-Rückbuchung: Erst eine bestätigte wiederverkaufbare Rücknahme berechtigt zum entsprechenden Wareneinsatz-Kredit. Dieser verwendet die ursprünglichen Kosten, nicht den heutigen Einkaufspreis.

Tatsächliche Fulfillment-Kosten ersetzen den manuellen SKU-Satz, auch wenn sie ausdrücklich 0 sind. Mit `fulfillmentSource: marketplace` muss dieser tatsächliche Betrag vorliegen. Mit `manual` wird bei fehlender tatsächlicher Abrechnung der hinterlegte Satz verwendet. Aus der Gebührenquelle muss Fulfillment zuvor separat klassifiziert werden, damit es nicht zusätzlich in `marketplaceFeesNet` enthalten ist. Account-/Lager-/Abo-Gebühren ohne Bestellbezug werden nicht auf SKUs erfunden; die vollständige allgemeine Kostenrechnung bleibt ein weiterer Ausbau.

## SKU-Kostenpflege

Schlüssel: Konto + Seller-SKU + Währung + Gültigkeitszeitraum. Alle sechs Kategorien sind **netto je verkaufter Einheit**. Fixkosten pro Bestellung/Paket gehören als tatsächlicher Positions-/Bestellbetrag in die geprüften Abrechnungsdaten, nicht unbemerkt in einen Stückkostensatz. Bereits im Einkauf enthaltene Fracht/Zoll bzw. in Fulfillment enthaltene Verpackung nicht erneut hinterlegen.

Neue Versionen schließen den vorherigen offenen Zeitraum. Rückwirkende Überschneidungen werden zurückgewiesen. Die SQLite-Backendklasse `backend/cost-store.js` speichert Revisionen und Auditstände mit Bearbeiter/Zeitpunkt und schützt vor konkurrierenden Änderungen über `expectedRevision`. Die öffentliche Demo nutzt denselben Kostenvertrag, speichert Änderungen jedoch nur im Browserspeicher. Sie schreibt nichts in den privaten Backend-Speicher und synchronisiert nicht zwischen Geräten.

Privat, aus dem Repository-Verzeichnis:

```sh
node scripts/costs.js list
node scripts/costs.js add .data/private-imports/my-cost-version.json
node scripts/costs.js history
node scripts/profit.js .data/private-imports/reviewed-profit-input.json
```

[Das Eingabeformat](../integrations/cost.example.json) enthält ausdrücklich nur Beispielbeträge. Für echte Nutzung SKU, Datum, Werte und Revisionsnummer ersetzen. Kosten liegen in `.data/private-imports/costs.sqlite`; die Profit-CLI verwendet diesen Speicher und erwartet die übrigen geprüften Eingaben entsprechend `profitReport` (mit `lines`, `accountId`, `currency`, `start`, `end`, `listingIds`, `advertising`, `overhead`, optional `fx`). Tageswerbung ist vorab je Konto/Listing/Tag aggregiert, Kontowerbung je Konto/Tag. Die CLI ist lokale Administration, kein bereits gehosteter Login- oder HTTP-Service.

## Abrechnungsquellen pro Marktplatz

Evidenz: dieselben festgehaltenen [API-Quellstände](api/README.md). Amazon offiziell; eBay/Kaufland gespiegelte Spezifikationen, OTTO generiertes SDK. Direktportale bleiben in dieser Cloud eingeschränkt erreichbar. Keine Herstellergarantie für aktuelle Kontozulassung.

| Marktplatz | Quelle / Endpunkt | Was jetzt implementiert ist | Fachliche Restarbeit |
| --- | --- | --- | --- |
| Alle neun Amazon-Länder | Finances `GET /finances/2024-06-19/transactions`; Reports `GET /reports/2021-06-30/reports` mit `GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2` | Finanzadapter bewahrt Bestell-/Settlement-IDs, Item-SKU/ASIN und rekursive Breakdown-Blätter. Bestehende Settlement-Reports auflisten, Dokument abrufen, Text herunterladen. | Steuertaxonomie, Gebühren-/Refund-Mapping, eindeutige Ereignisidentität und Abgleich mit Abrechnungen; keine Addition von Transaktionssummen und Item-Breakdowns. Settlement-Reports werden von Amazon erzeugt, nicht hier per createReport angefordert. |
| eBay | `GET /sell/finances/v1/transaction` | Positionsbezogene `marketplaceFees`, `lineItemId`, Gesamtgebühr und Payout-Bezug erhalten; Refund-Gebühren als Gutschriften markiert. Transaktionsschlüssel jetzt aus Typ + ID gemäß Vertrag. | Zusätzlich `NON_SALE_CHARGE`, Versandlabels, Credit/Debit, Gebührensteuer und Signaturfreigabe prüfen. `totalFeeAmount` nicht zusätzlich zu Einzelgebühren addieren. Alter Importbestand mit ID-only-Schlüsseln braucht kontrollierte Migration/Reimport, sonst doppelte Transaktionen. |
| OTTO | `GET /v2/receipts`, Orders v4 | Belegpositionen/-IDs und nach Steuersatz gegliederte VAT-Map erhalten; privater CSV/TSV-Abrechnungsimport vorbereitet. | Customer Receipts sind keine nachgewiesene Verkäufer-Provisionsabrechnung. Eine geeignete Partner-Abrechnungsquelle muss freigegeben werden; keinen erfundenen Gebührenendpunkt verwenden. Bis dahin geprüfter Abrechnungsdatei-Import. |
| Kaufland | `POST /v2/reports/bookings-new?storefront=de&version=v2`, `GET /v2/reports/{id_report}` | Buchungsbericht anfordern, Status prüfen und CSV als privaten Text laden; HMAC bleibt erforderlich. | Tatsächliche CSV-Spalten, Buchungstypen, Steuer und Order-Unit-Zuordnung am echten Bericht bestätigen. `price − revenue_net` ist keine verlässlich klassifizierte Provision. |

`financialDetails` sind zunächst Quellenbelege mit unbestätigter Steuerbasis. Sie werden **nicht automatisch** als vollständige Profit-Kosten freigegeben. Verschachtelte Gebührenhierarchien werden blattweise erhalten; Transaktions- und Itemebene bleiben getrennt. Verkäufergebühren mit unklarem Bestellbezug bleiben ungeklärt.

### Dateien und Reportabruf

```sh
node --use-env-proxy scripts/fetch-settlement.js .data/private-imports/report-config.json --plan
# Nach tatsächlicher Vertrags-/Kontoprüfung:
node --use-env-proxy scripts/fetch-settlement.js .data/private-imports/report-config.json --list
node --use-env-proxy scripts/fetch-settlement.js .data/private-imports/report-config.json --request
node --use-env-proxy scripts/fetch-settlement.js .data/private-imports/report-config.json --download
node scripts/import-settlement.js .data/private-imports/mapping.json .data/private-imports/report.csv
```

`--list` ist Amazon, `--request` Kaufland. Konfiguration: `accountId`, `contractReviewed`, für Kaufland `periodStart`/`periodEnd`, für Download `reportId`, `approvedDownloadHosts`. Amazon-Listenpagination per `query.nextToken`; IDs werden bewusst ausgewählt. Downloads überschreiben keine vorhandene Datei. Authentifizierung gemäß backend/README.md. Dateiinhalte bleiben privat.

CSV-Mapping: `accountId`, `source` (stabile Quelle), `delimiter` (Komma/Semikolon/Tab), `columns` für `id`, `date`, `type`, `amount`, `currency`, optional `orderId`/`sku`; `id` darf eine Liste von Spalten für einen zusammengesetzten stabilen Schlüssel sein. `decimalSeparator`, `sign`, `taxBasis` explizit festlegen. Datumswerte müssen ISO-Tage sein; Timestamp-/Locale-Normalisierung vor dem Import bewusst durchführen. Mehrdeutige Zahlen, doppelte Schlüssel, fehlende Pflichtspalten werden zurückgewiesen. Rohbetrag, Vorzeichenkonvention und Steuerbasis werden erhalten, noch nicht automatisch auf Kostenkategorien gebucht. Wiederholte vollständige Dateien werden idempotent gespeichert. Derselbe Geschäftsvorgang darf nicht zusätzlich aus API und Datei in den Profit-Ledger übernommen werden.

## Marktplatzfilter und Euro

Einzelländer, Amazon gesamt und alle Marktplätze sind auswählbar. Euro ist die Standardanzeige; bei Einzelkonten ist Originalwährung umschaltbar. Aggregierte Konten werden ausschließlich in EUR angezeigt. Originalumsatz und Durchschnittspreis sind per Hover und aufklappbarer Ansicht erreichbar, Profitkomponenten ebenfalls über Details.

Alle Demo-Kurse sind ausdrücklich **synthetisch**, keine abgerufenen Devisenkurse. Vertrag je Kurs: `{date, currency, target: 'EUR', rate, source}`; `rate` ist EUR je Einheit der Ausgangswährung. Tagesbeträge werden vor der Summierung umgerechnet. Profit wird erst in der Kontowährung berechnet und anschließend mit demselben Tageskurs übersetzt, inklusive Kosten. Geldbeträge verwenden sechs Dezimalstellen; Rundung auf Cent erfolgt in der Anzeige. Fehlende oder widersprüchliche Tageskurse lassen die betroffene Summe unbekannt. Keine stillschweigende Mischung von EUR, GBP, USD und PLN.

Für echte Daten ist eine historische Kursquelle (z. B. EZB-Referenzkurse) samt Wochenend-/Feiertagsregel, Quelle, Quellstichtag und Gültigkeit einzusetzen. Kein aktueller Kurs wird rückwirkend auf ganze Monate angewandt. Operatives EUR-Reporting ersetzt keine steuerliche oder buchhalterische Währungsbewertung.
