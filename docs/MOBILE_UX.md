# Mobile BI-Bedienung · 04.10.2026

## Verwendete Referenzen

Die öffentliche Sellerboard-Startseite war am 04.10.2026 über den vorgesehenen Cloud-Proxy erreichbar. Betrachtet wurden die dort verlinkten Herstellerillustrationen:

- [Dashboard mit KPI-Karten und Produkttabelle](https://sellerboard.com/dist/img/landing/hero-table-large@2x.png)
- [Kompakte Monatskarte](https://sellerboard.com/dist/img/landing/hero-table-small@2x.png)
- [PPC-Tabellenillustration](https://sellerboard.com/dist/img/landing/anim/analytics-1.png)
- Einbettende Seite: https://sellerboard.com/

Die Bilder zeigen zusammengehörige Umsatz-, Ads- und Ergebniskennzahlen, Vergleichswerte, Produktzeilen und sichtbare Detailhinweise. Es handelt sich um öffentliche Marketingillustrationen, nicht um eine durchgeführte Bedienprüfung des aktuellen Sellerboard-Produkts. Sie wurden zur Betrachtung temporär geladen, nicht in unsere Website kopiert. Die untere mobile Navigation, Touch-Karten und KPI-Drilldowns sind unsere eigene Gestaltung.

Die direkten Zugriffe auf `clouvou.de`, `www.clouvou.de`, `clouvou.com` und Amazon wurden durch die Cloud-Netzwerkregel gesperrt. Als nachprüfbarer sekundärer Hinweis auf ein CleverSeat-Listing wurde [dieser öffentliche Uses-Artikel](https://github.com/larswittenberg/larswittenberg.de/blob/3076f262de82407ce15c6431fe3ed6021995c593/src/app/uses/uses.mdx) gefunden; er verlinkt https://www.amazon.de/dp/B0BGZB6VZM. Der Listing-Inhalt wurde nicht gelesen. Die angefragte NN/g-Seite war ebenfalls gesperrt und wird nicht als gelesene Recherche ausgegeben.

**Markenabgleich offen:** Graphit, helle Flächen und Petrol sind vorläufige Designentscheidungen, keine verifizierten Clouvou-Markenfarben. Der Clouvou-Schriftzug ist Text, kein nachgebautes offizielles Logo. Die Farbvariablen am Anfang von `src/workspace.css` erlauben später den gezielten Austausch nach einer bestätigten Markenreferenz. Die benötigten Shop-/Amazon-Domains sind im Cloud-Konfigurationsentwurf ergänzt, aber ein gespeicherter Entwurf ist keine angewandte Netzwerkfreigabe.

## Umgesetzte Wege

- **Übersicht → Umsatz:** öffnet die Produktanalyse für dieselben Kanäle und denselben Zeitraum.
- **Übersicht → Deckungsbeitrag / Einheiten / Werbung / Erstattungen:** öffnet unmittelbar die passende Auswertung. Versteckte Detailfilter werden beim Wechsel aus der Kontosumme aufgehoben, damit die Zielauswertung dieselben Konten vollständig erklärt.
- **Umsatztreiber → Modell → Listings:** zeigt zunächst die beteiligten Varianten und Kanäle, dann die zugehörigen Listings. Kanal- und Zeitraumkontext bleiben erhalten.
- **Untere Navigation:** Übersicht, Produkte, Kanäle und Mehr bleiben auf kleinen Bildschirmen erreichbar. Mehr öffnet die gesamte Navigation einschließlich Kostenpflege.
- **7 Tage / 14 Tage / September / eigener Zeitraum:** direkte Zeitraumwahl auf Mobilgeräten. Weitere Filter, Währung und Vergleich liegen zusammen in einem aufklappbaren Bereich; die Suche ist auf Detailseiten direkt erreichbar.
- **Produkt-Sortierung:** sichtbare Schaltflächen auf Mobilgeräten. Die Tabellen werden bei kleiner Breite mit beschrifteten Kennzahlen pro Datensatz gestapelt, ohne horizontales Scrollen durch zahlreiche Spalten.
- **Trend:** direkte Kennzahlwahl, anklickbarer Verlauf, Tagespunkte per Tastatur sowie ausreichend große Vor-/Zurück-Schaltflächen für einzelne Tage. Der genaue Wert und das Vergleichsdatum stehen als Text unter dem Diagramm.

Die Kostenpflege bleibt eine eigene Verwaltungsseite. Datenqualität, CSV und gespeicherte Ansichten bleiben verfügbar. Fehlende Werbung oder Kosten werden auch in den neuen Einstiegskarten nicht als null interpretiert. Die Home-Kennzahlen nutzen die bestehenden Berechnungsverträge; keine neue Profit- oder Attributionsformel.

## Prüfung

Automatisierte mobile Abläufe prüfen KPI- und Produkt-Drilldowns, erhaltene Zeit-/Kanalauswahl, fehlende Werbekosten, eigene Zeiträume, Charts, Produktsuche, Kostenpflege und Seitenbreite. Desktop- und Mobilansichten wurden zusätzlich visuell geprüft. Das ist keine Nutzungsstudie und kein gemessener Nachweis höherer Usability.
