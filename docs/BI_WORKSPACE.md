# BI-Arbeitsbereich · Demo-Ausbau 04.10.2026

## Bedienung

1. Kanäle über die Kacheln auswählen. Verschiedene Währungen erzwingen EUR; Originalbeträge bleiben in der Umsatzanzeige und den Kanal-/Listingdetails einsehbar.
2. September, 7/14 Tage oder einen eigenen Zeitraum zwischen 01.08. und 30.09.2026 auswählen. Der Vergleich verwendet unmittelbar davor liegende, gleich viele Kalendertage. Beispiel: September 01.–30. gegen August 02.–31., nicht automatisch den vollen Vormonat.
3. **Gesamtüberblick** zeigt Kontosummen, Veränderungen, tägliche Umsatz-/Einheiten-/DB-Verläufe, regelbasierte Hinweise sowie den bestehenden Werbe- und Kanalvergleich. Produktfilter wirken hier ausdrücklich nicht. Chartpunkte sind per Maus, Touch oder Tastatur bedienbar; alle Tageswerte stehen auch als Tabelle bereit.
4. **Produktanalyse** führt Listings über interne Modell-IDs zusammen. Sortierung nach Umsatz, DB, Wachstum oder Erstattungsquote; Details zeigen Varianten, Kanäle und zugeordnete SKUs. Der Sprung in Listings behält Kanäle und Zeitraum bei und wählt das untersuchte Modell.
5. **Datenqualität** zeigt Umsatz- und Profitabdeckung auf Listingebene sowie Werbekosten-/Attributionsabdeckung auf Kanalebene. Das sind Prüfungen der synthetischen Daten, keine Live-Importbestätigung.
6. **Ansicht speichern** speichert bis zu 20 benannte Kanal-, Zeit-, Produkt-, Währungs- und Vergleichseinstellungen samt Bereich lokal im Browser. Laden und Löschen sind verfügbar. Keine geräteübergreifende Synchronisation; die eigentlichen Kennzahlen werden beim Laden neu berechnet.
7. **Produktreport CSV** exportiert die aktuelle Produktauswertung mit Zeitraum, Kanälen, Währung, Vorperiodenwerten und Demo-/FX-Herkunft. Im Gesamtüberblick umfasst sie die gesamten ausgewählten Konten. UTF-8-BOM, Semikolon, deutsche Dezimalzahlen; fehlende Werte bleiben leer. Textfelder werden gegen Spreadsheet-Formelinjektion abgesichert. **Drucken / PDF** öffnet den Browserdruckdialog mit einem Layout ohne Bedienleisten.

## Berechnungen und Grenzen

`bi/model.js` verbindet das bestehende Listing-, Profit- und Werbemodell. Mehrere SKUs erzeugen keine zusätzlichen Listingumsätze. Quoten entstehen aus Summen; Erstattungsraten folgen dem Erstattungsdatum und sind keine Bestellkohorten. Eine gemeinsame Amazon-/eBay-/OTTO-Conversion wird nicht erfunden.

Die Tageshistorie für August wird ausschließlich beim Demoexport durch `database/history.js` ergänzt. Der September-Seed bleibt unverändert; es gibt keine nachträgliche Schätzung echter Geschäftsdaten. Fehlende Vorperioden bleiben unbekannt. Relative Veränderungen bei null oder negativem Ausgangswert werden nicht berechnet. Die Richtung einer Veränderung ist nicht automatisch eine Bewertung als gut oder schlecht.

DB = Nettoerlös nach Refunds minus bestätigte Gebühren, gültige SKU-Kosten und zugeordnete Werbung plus bestätigte Warenkosten-Rückbuchungen. Er steht **vor nicht zugeordneten Kontokosten und allgemeinen Betriebskosten**. Die bestehende Kostenansicht weist Kontokosten separat aus. Das ist keine vollständige Unternehmens-GuV. Fehlende Kosten, Tagesumsätze, Wechselkurse oder nicht mit dem Absatz abgestimmte Finanzpositionen verhindern einen vollständigen DB im BI-Bereich. Die Einheitenabstimmung allein ist kein Ersatz für den späteren echten Abrechnungsabgleich.

Die Regelhinweise markieren Umsatzrückgänge ab 10 %, Erstattungsquoten ab 3 % bei mindestens 20 Einheiten, DB-Margen unter 15 %, Conversion-Rückgänge ab einem Prozentpunkt und fehlende Werbung. Sie nennen überprüfbare Zahlen und verlinken die betreffende Auswertung. Keine behauptete KI-Ursachenerkennung, automatische Optimierung oder Marktprognose.

Alle Geldquellen und FX-Schritte verwenden die bestehenden Dezimalverträge; die Diagramm-/Tabellenansicht formatiert numerische Summen. Synthetische Kosten und Steuersätze sind keine tatsächlichen länderabhängigen Abrechnungsregeln.

## Übergang in den Privatbetrieb

Der Ausbau trennt Berechnung (`bi/model.js`), gespeicherten Filtervertrag/Export (`bi/reporting.js`) und Darstellung (`src/intelligence.js`). Keine neuen Browser-Zugangsdaten oder externen Dienste. Für Live-Betrieb fehlen weiterhin authentifizierte Backend-Abfragen, echte SKU-Mappings, berechtigte Imports, Quellenabgleich, FX-Quelle, serverseitige Reportablage und Login. Der aktuelle öffentliche JSON-Demoexport darf nicht durch einen vollständigen echten Datenexport ersetzt werden. Umfangreiche Live-Historien benötigen serverseitige Aggregation und Pagination.

## Validierung

Rechentests prüfen Periodengrenzen, Historienerweiterung, Rollups, tägliche Summen, gewichtete Quoten, fehlende Finanzpositionen/Tage/FX, Teilabdeckung, gespeicherte Filter und CSV-Sicherheit. Browserprüfungen decken Vergleich/Diagramm, Produktdrilldown, persistente Ansichten, CSV-Download, Drucklayout, fehlende Daten und mobile Breite ab; die bisherigen Marketplace-, Kosten- und Werbetests bleiben erhalten.
