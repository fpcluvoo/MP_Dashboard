# Sortimentsdefinition

Stand: 02.10.2026. Quelle: direkte Nutzeraussage in diesem Projekt. Arbeitsgrundlage für das BI-Datenmodell, keine erfundenen Verkaufsdaten. Maschinenlesbare Fassung: [catalog/assortment.json](../catalog/assortment.json).

## Marken und Kategorien

Marken werden vorerst genau so geschrieben: **Cluvo**, **Lutivo**, **Winden Cove**. Diese Schreibweisen sind vom Nutzertext übernommen und noch nicht durch Produktunterlagen bestätigt. Die frühere uneindeutige Bezeichnung „Glovo“ wird nicht als zusätzliche Marke oder Marketplace-Anforderung verwendet.

Kategorien: **Bürostühle**, **Schreibtische**, **Gaming-Stühle**, **Accessories / Upsell-Produkte**. Höhenverstellbarkeit wird zunächst als Merkmal der Schreibtische vorgesehen. Welche genannten Tischmodelle höhenverstellbar sind, ist noch nicht ausdrücklich zugeordnet.

Gaming-Stühle sind als Erweiterung unter Cluvo vorgesehen. Accessories werden aktuell ebenfalls nur unter Cluvo verkauft. Daraus folgt keine dauerhafte Beschränkung des Datenmodells auf diese Marke. Für weitere Marken/Kategorien ist nichts zusätzlich zugesagt.

## Bestätigte Modelle und Varianten

| Marke | Kategorie | Modelle | Bestätigte Varianten / noch offen |
| --- | --- | --- | --- |
| Cluvo | Bürostühle | Bright Seat, Clever Seat, Smart Seat, Power Seat, Pro Seat, Master Seat | Jedes Modell: Schwarz, Anthrazit, Creme. Insgesamt 18 bestätigte Farbvarianten. |
| Lutivo | Bürostühle | Alpha, Bravo, Charlie, Delta | Farben und weitere Varianten noch offen; Cluvo-Farben werden nicht übertragen. |
| Winden Cove | Bürostühle | Fünf Modelle, Namen werden nachgereicht | Farben und weitere Varianten offen; noch keine einzelnen Produktdatensätze. |
| Cluvo | Schreibtische | Pro Desk, Clever Desk, Master Desk | Je Modell zwei Größen, Maße und Farbkombinationen werden nachgereicht. |
| Lutivo | Schreibtische | Foxtrot, Golf | Verschiedene Größen und Farben; konkrete Anzahl/Optionen noch offen. |
| Cluvo | Gaming-Stühle | Namen und Anzahl offen | Kommende Sortimentserweiterung. |
| Cluvo | Accessories / Upsell | Konkrete Artikel/Modelle offen | Mauspad, Stehmatte, ergonomisches Sitzkissen und Fußstütze wurden als Beispiele genannt. |

**Zählstand:** drei Marken, 15 namentlich bekannte Modelle (zehn Bürostuhl- und fünf Tischmodelle), zusätzlich fünf noch unbenannte Winden-Cove-Bürostuhlmodelle. Damit sind 20 Modelle nach Name oder Anzahl beschrieben, zuzüglich noch nicht bezifferter Gaming-/Accessory-Modelle. Nur die 18 Cluvo-Bürostuhl-Farbvarianten sind bisher konkret ableitbar. Die Gesamtzahl verkaufbarer Varianten ist noch nicht bekannt.

## Struktur für die Auswertung

```text
Marke: Cluvo
  Kategorie: Bürostühle
    Modell / Produktfamilie: Bright Seat
      Variante: Schwarz
        interne SKU: noch offen
        Marketplace-Listing / ASIN: noch offen
        Seller-SKU(s): noch offen
      Variante: Anthrazit
      Variante: Creme
```

Ein Modell entspricht vorerst einer Produktfamilie. Eine Farbe/Größe/Farbkombination ist eine verkaufbare Variante. Marke und Kategorie sind getrennte Dimensionen: Dadurch können wir beispielsweise alle Cluvo-Produkte, alle Bürostühle über Marken hinweg oder nur Bright Seat über alle Marktplätze vergleichen.

Bei Tischen werden Maße (Breite/Tiefe in einer normalisierten Einheit) und Farbkombinationen von Platte/Gestell als getrennte Merkmale vorbereitet. Es werden nur tatsächlich bestätigte Kombinationen als Varianten angelegt. Zwei Größen mal mehrere Farben bedeutet nicht automatisch, dass jede Kombination verkauft wird.

Interne technische IDs sind nicht eure tatsächlichen Artikelnummern. ASIN, GTIN, interne SKU und externe Seller-SKU bleiben getrennte Felder und bis zur Lieferung der Daten leer. Es werden weder ASINs erfunden noch Verkaufskonten aus Produktnamen abgeleitet.

## Noch nachzureichen

1. Fünf Winden-Cove-Bürostuhlnamen mit Varianten.
2. Farben/Varianten der vier Lutivo-Bürostühle.
3. Maße und tatsächlich angebotene Platte-/Gestell-Farbkombinationen pro Tischmodell; Höhenverstellbarkeit je Modell.
4. Gaming-Stuhlmodelle und Varianten unter Cluvo.
5. Konkrete Accessories statt der bisherigen Beispiele.
6. Später: interne Artikelnummern, Kosten und Marketplace-Zuordnungen.

Die Reihenfolge blockiert die Definition der bereits bekannten Modelle nicht. Nutzerkorrekturen sollen die bestehenden technischen IDs möglichst erhalten; keine stillen Zusammenführungen nach Namensähnlichkeit.

## Verwendung und Abgrenzung

Der Katalog ist zunächst eine versionierte Definitionsdatei für den nächsten Fundament-Arbeitsblock. Er wird noch nicht automatisch in die alte Prototyp-Datenbank importiert und verändert die veröffentlichte Demo nicht. Der Prototyp besitzt noch keine fertigen Marken-/Varianten-/Mapping-Historien. Diese Struktur wird im geplanten Fundament ergänzt.

Die bisherige Demo mit Kopfhörern, Lampe und Becher beschreibt **nicht euer Sortiment**. Beim nächsten fachlichen Demo-Aufbau werden bestätigte Modelle und Varianten verwendet; alle dazu generierten Kennzahlen und externen Identifikatoren müssen weiterhin eindeutig als synthetisch gekennzeichnet sein. Fehlende echte Varianteninformationen werden nicht durch plausible Verkaufsbehauptungen ersetzt.
