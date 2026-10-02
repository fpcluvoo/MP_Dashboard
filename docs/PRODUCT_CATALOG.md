# Sortimentsdefinition

Stand: 02.10.2026. Quelle: direkte Nutzeraussage in diesem Projekt. Arbeitsgrundlage für das BI-Datenmodell, keine erfundenen Verkaufsdaten. Maschinenlesbare Fassung: [catalog/assortment.json](../catalog/assortment.json).

## Marken und Kategorien

Die vom Nutzer ausdrücklich bestätigten Markenschreibweisen sind **Clouvou**, **Lutivo** und **Wintoncove**. Die frühere uneindeutige Bezeichnung „Glovo“ wird nicht als zusätzliche Marke oder Marketplace-Anforderung verwendet.

Kategorien: **Bürostühle**, **Schreibtische**, **Gaming-Stühle**, **Accessories / Upsell-Produkte**. Höhenverstellbarkeit wird zunächst als Merkmal der Schreibtische vorgesehen. Welche genannten Tischmodelle höhenverstellbar sind, ist noch nicht ausdrücklich zugeordnet.

Gaming-Stühle sind als Erweiterung unter Clouvou vorgesehen. Accessories werden aktuell ebenfalls nur unter Clouvou verkauft. Daraus folgt keine dauerhafte Beschränkung des Datenmodells auf diese Marke. Für weitere Marken/Kategorien ist nichts zusätzlich zugesagt.

## Bestätigte Modelle und Varianten

| Marke | Kategorie | Modelle | Bestätigte Varianten / noch offen |
| --- | --- | --- | --- |
| Clouvou | Bürostühle | Bright Seat, Clever Seat, Smart Seat, Power Seat, Pro Seat, Master Seat | Jedes Modell: Schwarz, Anthrazit, Creme. Insgesamt 18 bestätigte Farbvarianten. |
| Lutivo | Bürostühle | Alpha, Bravo, Charlie, Delta | Farben und weitere Varianten noch offen; Clouvou-Farben werden nicht übertragen. |
| Wintoncove | Bürostühle | Fünf Modelle, Namen werden nachgereicht | Farben und weitere Varianten offen; noch keine einzelnen Produktdatensätze. |
| Clouvou | Schreibtische | Pro Desk, Clever Desk, Master Desk | Je Modell zwei Größen, Maße und Farbkombinationen werden nachgereicht. |
| Lutivo | Schreibtische | Foxtrot, Golf | Verschiedene Größen und Farben; konkrete Anzahl/Optionen noch offen. |
| Clouvou | Gaming-Stühle | Namen und Anzahl offen | Kommende Sortimentserweiterung. |
| Clouvou | Accessories / Upsell | Konkrete Artikel/Modelle offen | Mauspad, Stehmatte, ergonomisches Sitzkissen und Fußstütze wurden als Beispiele genannt. |

**Zählstand:** drei Marken, 15 namentlich bekannte Modelle (zehn Bürostuhl- und fünf Tischmodelle), zusätzlich fünf noch unbenannte Wintoncove-Bürostuhlmodelle. Damit sind 20 Modelle nach Name oder Anzahl beschrieben, zuzüglich noch nicht bezifferter Gaming-/Accessory-Modelle. Nur die 18 Clouvou-Bürostuhl-Farbvarianten sind bisher konkret ableitbar. Die Gesamtzahl verkaufbarer Varianten ist noch nicht bekannt.

## Struktur für die Auswertung

```text
Marke: Clouvou
  Kategorie: Bürostühle
    Modell / Produktfamilie: Bright Seat
      Variante: Schwarz
        interne SKU: noch offen
        Marketplace-Listing / ASIN: noch offen
        Seller-SKU(s): noch offen
      Variante: Anthrazit
      Variante: Creme
```

Ein Modell entspricht vorerst einer Produktfamilie. Eine Farbe/Größe/Farbkombination ist eine verkaufbare Variante. Marke und Kategorie sind getrennte Dimensionen: Dadurch können wir beispielsweise alle Clouvou-Produkte, alle Bürostühle über Marken hinweg oder nur Bright Seat über alle Marktplätze vergleichen.

Bei Tischen werden Maße (Breite/Tiefe in einer normalisierten Einheit) und Farbkombinationen von Platte/Gestell als getrennte Merkmale vorbereitet. Es werden nur tatsächlich bestätigte Kombinationen als Varianten angelegt. Zwei Größen mal mehrere Farben bedeutet nicht automatisch, dass jede Kombination verkauft wird.

Interne technische IDs sind nicht eure tatsächlichen Artikelnummern. ASIN, GTIN, interne SKU und externe Seller-SKU bleiben getrennte Felder und bis zur Lieferung der Daten leer. Es werden weder ASINs erfunden noch Verkaufskonten aus Produktnamen abgeleitet.

## Noch nachzureichen

1. Fünf Wintoncove-Bürostuhlnamen mit Varianten.
2. Farben/Varianten der vier Lutivo-Bürostühle.
3. Maße und tatsächlich angebotene Platte-/Gestell-Farbkombinationen pro Tischmodell; Höhenverstellbarkeit je Modell.
4. Gaming-Stuhlmodelle und Varianten unter Clouvou.
5. Konkrete Accessories statt der bisherigen Beispiele.
6. Später: interne Artikelnummern, Kosten und Marketplace-Zuordnungen.

Die Reihenfolge blockiert die Definition der bereits bekannten Modelle nicht. Nutzerkorrekturen sollen die bestehenden technischen IDs möglichst erhalten; keine stillen Zusammenführungen nach Namensähnlichkeit.

## Verwendung und Abgrenzung

Der Katalog steuert jetzt den Produktstamm und die Marken-/Kategorie-/Modellfilter der Live-Demo. Alle 15 benannten Modelle sowie die noch offenen Sortimentsgruppen sind sichtbar. Die 18 bestätigten Clouvou-Bürostuhl-Farbvarianten erhalten simulierte Kennzahlen und ausdrücklich mit `DEMO-` gekennzeichnete externe IDs. Echte Marketplace-Zuordnungen bleiben in der Definitionsdatei leer.

Die früheren Demoartikel (Kopfhörer, Lampe, Becher) wurden aus dem aktuellen Snapshot entfernt. Für Lutivo, Wintoncove und Tischmodelle ohne bestätigte Varianten werden keine Varianten oder Kennzahlen erfunden. Die lokale echte Katalogdatenbank wird nicht überschrieben oder veröffentlicht; vollständige Mapping-Historien und produktive Imports bleiben Bestandteil des geplanten Fundament-Ausbaus.
