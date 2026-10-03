# Produkt- und Amazon-Datenmodell

## Beziehungen

`products` ist der marktplatzunabhängige Produktstamm mit stabiler ID und interner SKU. `accounts` beschreibt den Seller-Kontext einschließlich Marketplace, Land und Währung. Ein `listing` gehört genau einem internen Produkt und Konto; für Amazon ist `external_id` die Child-ASIN. Verschiedene Varianten können einem gemeinsamen internen Produkt zugeordnet werden. Es findet keine automatische Parent-ASIN-Zusammenführung statt.

`marketplace_skus` ordnet Seller-SKUs einem Listing zu. Mehrere FBA-/FBM-SKUs dürfen dieselbe ASIN verwenden. Die SKU ist nur innerhalb des Kontos eindeutig. Fremdschlüssel verhindern Verknüpfungen über Kontogrenzen hinweg. Neue Marktplätze benötigen später einen Importadapter; die Oberfläche bietet nun zwölf getrennte Konto-/Länderkontexte in EUR, GBP, PLN und USD.

`listing_daily` hat genau einen Datensatz je Listing und Datum. Diese Tatsachentabelle wird nie über die SKU-Tabelle vervielfacht. Umsatz und Einheiten müssen vor einem späteren Import auf denselben ASIN-/Tageskontext normalisiert werden. Kennzahlen aus verschiedenen Berichten dürfen nicht addiert werden, wenn sie denselben Umsatz beschreiben. Eine Zuordnung von SKU zu ASIN kann der spätere Import übernehmen; unklare Zuordnungen müssen zur manuellen Prüfung zurückgehalten werden.

`rating_snapshots` speichert Bewertungsstände. `ad_spend` enthält normalisierte Werbekosten mit stabiler Quellzeilen-ID: jede Zeile entweder mit Listing-Bezug oder mit NULL-Listing und Begründung. Der Unique-Key aus Konto, Quelle und Quellzeilen-ID verhindert doppelte Importe. Bei künftigen Imports dürfen Kampagnensummen nicht zusätzlich zu bereits enthaltenen ASIN-Kosten importiert werden. Die getrennte private API-Fact-Datenbank besitzt bereits Upsert-/Lauf-/Checkpoint-Logik (siehe `backend/store.js`); die Überführung in diese Reporting-Tabellen und Schema-Migrationen bleiben offen.

## Kennzahlenvertrag

- Geld: ganzzahlige Centbeträge in der Kontowährung. Keine Mischung verschiedener Währungen.
- Datum: ISO `YYYY-MM-DD` im jeweiligen Reporting-Kalender des Kontos. Die Demo nutzt September 2026; echte Adapter müssen Zeitzone und Berichtsdatum vereinheitlichen.
- Umsatz: Bestellumsatz vor Abzug von Erstattungen, Gebühren und Werbung; keine Gewinnkennzahl. Echte Quellen müssen ihre Steuer-/Umsatzdefinition ausdrücklich mitbringen.
- Sales: verkaufte Einheiten, nicht Bestellungen.
- Sessions: Sessions pro ASIN. Die Summe mehrerer ASINs ist keine deduplizierte Besucherzahl.
- Conversion Rate: Summe verkaufter Einheiten / Summe Sessions. Entspricht der Unit Session Percentage, nicht einer Bestell-Konversionsrate. Nicht Mittelwert täglicher Prozentwerte.
- Erstattungen: Betrag und Einheiten nach Erstattungsdatum. Erstattungsrate: erstattete / verkaufte Einheiten im selben Zeitraum. Keine kohortenbasierte Retourenrate; zeitversetzte Erstattungen können Werte über 100 % erzeugen.
- Bewertungen: letzter Snapshot bis einschließlich Periodenende mit Datum und Anzahl. Keine Addition oder Durchschnittsbildung über ASINs; fehlende oder gemeinsam auf Parent-Ebene ausgewiesene Bewertungen dürfen nicht als eigene Child-Bewertung erfunden werden.
- Werbung: Kosten nach Ausgabedatum, Typ und eindeutiger Zuordnung. Nicht zuordenbare Kosten reagieren nur auf Zeitraum-/Kontofilter. Sie werden nie pro rata auf Produkte verteilt. Bei aktiver Produktauswahl sind zugeordnete Auswahlkosten plus nicht zuordenbare Kontokosten keine vollständige Kontosumme; diese wird separat ausgewiesen.
- NULL oder fehlender Datensatz bedeutet unbekannt, nicht null. Fehlende Tage oder Kennzahlen unterdrücken die betroffene Periodensumme; bekannte andere Kennzahlen bleiben sichtbar. Nullnenner ergeben keine berechenbare Rate. Werbetypen ohne passende Zeilen werden als `—` dargestellt, nicht als gesicherte Nullkosten.

## Spätere Datenquellen

Verkauf/Sessions können aus freigegebenen Amazon-Business-Reports stammen; Erstattungen benötigen entsprechend normalisierte Erstattungs-/Finanzdaten. Werbung erfordert separat Amazon-Ads-Berichte und deren Berechtigungen. Datenverfügbarkeit, ASIN-Zuordnung, Berichtsgranularität und Kostenabgleich müssen pro Werbetyp geprüft werden, insbesondere für Brands, Display und Streaming TV. Bewertungen brauchen eine gesondert geeignete und zulässige Quelle; eine generelle Verfügbarkeit über die Seller-API wird nicht vorausgesetzt.

Kein automatischer Import oder Zugang ist bereits eingerichtet. Keine organischen Sales durch einfaches Subtrahieren von Ads-Sales: Attributionsfenster und Zeit-/Produktbezüge können abweichen. Cross-SKU-/Halo-Auswertungen bleiben zunächst außerhalb des Umfangs.

## Betrieb

`npm run db:init`: leere lokale `.data/catalog.sqlite` ohne Export. `npm run data:prepare`: separate synthetische Demo-Datenbank und öffentlicher Demo-Snapshot. Ein wiederholter Demolauf fügt nur fehlende Seed-Zeilen hinzu; Änderungen an bereits vorhandenen Beispieldaten benötigen einen bewussten Neuaufbau ausschließlich der Demo-Datenbank. Produktivdaten gehören in einen privaten Backend-Dienst mit Migrationen, Backups und Zugangskontrolle; die aktuelle Pages-Website besitzt keine Server-Datenbank.

Der aktuelle Demo-Seed wird aus `catalog/assortment.json` abgeleitet. Nur bestätigte Farbvarianten erhalten klar synthetische Listings; alle benannten Modelle sind zusätzlich im Produktstamm sichtbar. Die Exportdatei enthält die Sortimentsmetadaten getrennt von simulierten Verkaufsdaten. Echte Katalogzuordnungen bleiben leer. Die frühere `demo.sqlite` bleibt erhalten und wird nicht in diesen Snapshot aufgenommen.

## Erweiterung Direktkanäle

`traffic_daily` hält Pageviews und Transaktionen getrennt von Amazon-Sessions. Die Demo-Datei heißt jetzt `.data/demo-direct-channels-v1.sqlite` (216 Listings, 6.480 Listing-Tage); frühere Demo-Datenbanken bleiben erhalten. Die privaten API-Facts verwenden Dezimalstrings statt Demo-Centbeträgen und enthalten Quelle, Umsatzbasis, Berichtszeitraum, Granularität und gegebenenfalls Attribution. Ihre Daten werden nicht in den öffentlichen Build übernommen. Details und noch fehlende Ledger-/Mapping-Schritte: [API-Verträge](../docs/api/README.md).
