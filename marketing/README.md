# Kanalübergreifende Werbekennzahlen

`calculate.js` ist browser- und serverfähig. `demo.js` erzeugt ausschließlich synthetische Konto-/Tagesdaten. Der neue Standardreiter **Gesamtüberblick** folgt frei gewählten Kanälen und dem Zeitraum. Marken-, Modell-, Kategorie- und Suchfilter wirken auf die bestehenden Detailauswertungen; sie werden in der Kontoübersicht ausdrücklich nicht auf unzuordenbare Werbekosten verteilt.

## Definitionen

| Anzeige | Berechnung |
| --- | --- |
| Blended ROAS / MER | Gesamtumsatz / gesamter Werbespend |
| Blended ACoS | gesamter Werbespend / attribuierter Ads-Umsatz |
| TACoS | gesamter Werbespend / Gesamtumsatz |
| Ads-ROAS · attribuiert | attribuierter Ads-Umsatz / gesamter Werbespend |

„Blended ROAS“ wird hier als Marketing Efficiency Ratio bezeichnet, weil der Begriff auch abweichend verwendet wird. Ads-ROAS und ACoS sind Kehrwerte; MER und TACoS ebenfalls. Quotienten werden aus Summen gebildet, nicht als Durchschnitt der Kanalquoten. Nullnenner ergeben unbekannt; bestätigter Spend 0 bei positivem Gesamtumsatz ergibt TACoS 0.

Umsatzbasis der Demo: Bestellumsatz brutto vor Erstattungen. Spend: berichtete Kosten. Attribuierter Umsatz ist nicht zwingend inkrementell, eindeutig dedupliziert oder im selben Moment wie Bestellumsatz entstanden. Keine organischen Sales durch Subtraktion. Für reale Daten sind Kostensteuerbasis, Umsatzdefinition, Zeitbezug, Zeitzonen, Produktumfang und Attribution abzugleichen.

## Gemeinsamer Datenvertrag

`marketing_daily` enthält genau einen konsolidierten Datensatz je Konto und Reporting-Tag:

- `accountId`, `date` als ISO-Tag, `currency` in Kontowährung;
- `spendCents`, `salesCents`, `adSalesCents` als ganzzahlige Minor Units oder NULL;
- `spendComplete`, `salesComplete`, `adSalesComplete` als ausdrückliche Vollständigkeitskennzeichen;
- `salesBasis`, `adSalesBasis` als geprüfte gemeinsame Umsatzdefinition;
- `attributionKey` als Version der abgestimmten Attributionsdefinition einschließlich Fenster, Modell, Zeit-/Produktbezug;
- `source` zur Herkunft.

Tageslücken, fehlende Werte oder Wechselkurse sperren die betroffenen Summen. Doppelte Konto-/Tageszeilen und falsche Kontowährungen werden zurückgewiesen. Fehlende Attribution verhindert ACoS und Ads-ROAS, aber nicht MER/TACoS bei vollständigen Kosten und Gesamtumsätzen. Nicht vergleichbare Umsatzdefinitionen verhindern auch gemeinsame Gesamtumsatzquoten.

Die Kontokosten enthalten zugeordnete und nicht zugeordnete Ausgaben **genau einmal**. Keine zusätzliche Addition von Produkt-, Kampagnen- und Account-Totals. Die Demo gleicht ihre Tages-Spends mit `ad_spend` ab. Ein tatsächlicher Import muss disjunkte Werbequellen oder einen geprüften Gesamtbericht auswählen und nachträgliche Korrekturen ersetzen. Das Modul ist kein bereits freigegebener Live-Aggregator für alle Werbenetzwerke.

Die synthetischen Amazon-Daten simulieren kompatible 14-Tage-Klickattribution. Daraus folgt keine allgemeine Verfügbarkeit identischer SP/SB/SD/TV-Reportfelder. eBay, OTTO und Kaufland haben weiterhin unbekannten Spend bzw. Ads-Umsatz. Bei gemischter Auswahl wird nur ein ausdrücklich bezeichneter bekannter Teilbetrag gezeigt; es gibt keine stillschweigende Verengung der KPI-Auswahl auf Amazon.

## Währungen und Bedienung

Kanäle werden über native Checkboxen in Kacheln beliebig kombiniert. Schnellaktionen: Alle auswählen, Nur Amazon, Auswahl leeren. Eine leere Auswahl zeigt einen eigenen Zustand statt alter Summen. Tastaturbedienung mit Tab/Leertaste ist möglich. Bei unterschiedlichen Originalwährungen ist EUR zwingend, bei identischer Währung optional. Tagesumrechnung erfolgt vor Summierung über `profit/fx.js`; die Kurse bleiben Demo-Werte, siehe [Profit-Vertrag](../docs/PROFIT.md).

Der Kanalvergleich zeigt Beträge und Quoten pro Konto sowie Originalbeträge und Datenlücken in aufklappbaren Details. Ein Kanal-Klick setzt die Auswahl auf dieses Konto und öffnet Verkauf & Traffic. „Zur Kanalauswahl zurück“ stellt die vorherige Kombination wieder her. Individuelle Kachelauswahl löst diesen temporären Rücksprung auf. Die Auswahl wird bislang nicht über Browser-Neuladen hinweg gespeichert.
