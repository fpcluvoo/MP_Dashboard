# Sellerboard: zugängliche Hinweise und Claim-Abgleich

Aktualisierung 04.10.2026: Die offizielle Startseite und drei dort eingebettete UI-Illustrationen konnten inzwischen abgerufen und visuell geprüft werden. Quellen und daraus abgeleitete UX-Entscheidungen stehen in [MOBILE_UX.md](MOBILE_UX.md). Die folgenden Abschnitte dokumentieren den früheren Stand.

Recherche: 02.10.2026. Die direkte Herstellerseite bleibt über die aktuelle Cloud-Netzwerkregel nicht erreichbar. Deshalb wurde ergänzend auf öffentlich zugänglichem GitHub nach unabhängigen Erwähnungen gesucht. Es wurden weder private Sellerboard-Konten verwendet noch eingeschränkte Seiten über einen Umgehungsproxy geladen.

## Quellen und Aussagekraft

### S1 — öffentlicher Nutzervergleich, 08.10.2024

Quelle: [„Comparativo - Sellerboard“, Dashboard-Homolog, Issue #7](https://github.com/jannech/Dashboard-Homolog/issues/7).

Der Verfasser beschreibt, Sellerboard selbst zu nutzen, und nennt in einem Vergleich/Vorschlag für ein anderes Analyseprodukt:

- Bestandsplanung,
- Erfassung fixer Ausgaben/Kosten zur realistischeren Analyse der finalen Gewinnmarge,
- ein vereinfachtes Dashboard mit wichtigen Informationen einschließlich Ads,
- geschätzte Auszahlungen bzw. Abgleich von Amazon-Zahlungen,
- Berichte über verlorene und beschädigte Ware.

Der Beitrag verlinkt außerdem als Sellerboard bezeichnete Screenshots für Dashboard, Expenses, Reports, Inventory, FBA Shipments, Cashflow und LTV. **Die Bildinhalte konnten wegen Zugriffsfehlern nicht geprüft werden.** Aus Dateibezeichnungen werden keine zusätzlichen Funktionen abgeleitet; keine fremden Geschäftszahlen werden in unser Projekt übernommen.

Einordnung: überprüfbar ist der öffentlich gelesene Text. Es handelt sich um einen Nutzerbeitrag von 2024, keine aktuelle Herstellerdokumentation. Seine Verbesserungsvorschläge für ein anderes Tool belegen nicht automatisch die genaue Umsetzung jeder Funktion in Sellerboard.

### S2 — Marktanalyse eines anderen öffentlichen Softwareprojekts

Quelle: [sudban, docs/MARKET_RESEARCH.md](https://github.com/massoudsh/sudban/blob/main/docs/MARKET_RESEARCH.md), gelesener Blob `f48f84906df473c1db4ce6b20960984fdcad48cb`.

Die fremde Projektanalyse beschreibt Sellerboard sinngemäß als Amazon-Margen-/Profitanalyse unter Einbeziehung von FBA-, PPC- und Lagergebühren. Sie behauptet außerdem Unterstützung für FIFO-/Batch-Warenkosten. Als Referenz ist dort die Sellerboard-Homepage genannt.

Einordnung: **schwache Sekundärquelle**, kein unabhängiger Funktionstest. Insbesondere FIFO/Batch wird nicht als bestätigte Sellerboard-Funktion oder bereits beschlossene eigene Anforderung übernommen. Wir planen ohnehin zeitabhängige Einkaufskosten; Chargenbewertung braucht eine eigene fachliche Entscheidung und belastbare Daten.

### Nicht als Evidenz verwendet

Repos mit „Sellerboard“ im Namen ohne belastbare Beschreibung, Coupon-/Affiliate-Werbung und rein technische Adapter-Migrationsissues liefern keine geeignete vollständige BI-Funktionsliste. Suchtreffer allein gelten nicht als Nachweis.

## Konsequenzen für unser BI-Produkt

| Hinweis / Claim | Unsere Entscheidung | Status |
| --- | --- | --- |
| Kostenpflege verbessert die Aussagekraft von Margen | Zeitbezogene Warenkosten, Gebühren und weitere Kosten in den Kern aufnehmen; fehlende Kosten sichtbar | Eigene fachliche Anforderung, durch S1/S2 plausibilisiert |
| Dashboard mit Werbung | Umsatz/Traffic/Ergebnis und Ads kontextbezogen auswerten | Bereits im Plan, durch S1 gestützt |
| Amazon-Auszahlungen abgleichen | Später separate Zahlungs-/Cashflow-Ansicht; Auszahlung nicht mit Umsatz oder Gewinn verwechseln | Spätere Erweiterung, nicht Demo-Kern |
| Berichte zu verlorener/beschädigter Ware | Später als Finanz-/Erstattungsereignisse analysieren, wenn Daten vorliegen | Kein automatisches Claim-/Erstattungsmanagement |
| Bestandsplanung | Historische Bestandslücken später als Erklärung für Umsatzänderungen nutzbar | Einkauf/Nachbestellautomatisierung bleibt außerhalb Kern |
| FIFO-/Batch-COGS | Noch nicht als Umfang übernehmen | Unbestätigter Drittclaim; Herstellerprüfung und fachlicher Bedarf offen |
| Reports/Exports | Eigene gespeicherte Reportdefinitionen, CSV und druckbare Ansichten | Aus Nutzerziel abgeleitet, nicht aus ungeprüften Screenshot-Inhalten |

## Was weiterhin offen bleibt

Dies ist eine kleine, quellenbelegte Sammlung von Hinweisen, **keine vollständige Recherche aller aktuellen Sellerboard-Funktionen**. Offizielle Beschreibungen, Filter-/Exportdetails, genaue Gewinnformeln und aktuelle API-/Datenabdeckung müssen nach Freigabe der Herstellerseite geprüft werden. Die dafür bereits vorgemerkten Domains sind `sellerboard.com` und `www.sellerboard.com`.

Für den Produktstamm und das nächste Architektur-Fundament entstehen daraus keine Blockaden. Die Entscheidungen werden aus unseren eigenen Reporting-Fragen und Datenverträgen getroffen.
