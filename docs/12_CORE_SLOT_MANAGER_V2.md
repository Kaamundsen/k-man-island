# CORE_SLOT_MANAGER_V2

## Formål
Begrense og kontrollere antall aktive CORE-trades for å sikre fokus, disiplin og kapitalbeskyttelse.

Core Slot Manager er ansvarlig for at systemet aldri overtrader, og at kun de beste mulighetene får plass i CORE.

---

## Grunnprinsipp
- CORE har **maks 3–5 samtidige trades**
- CORE er alltid selektiv, aldri fullinvestert uten grunn
- Nye trades vurderes alltid relativt til eksisterende CORE-trades

---

## Slot-definisjon
En CORE-slot er en aktiv trade som:
- er godkjent av Core Engine
- har definert entry, stop og target
- følges daglig av Action Engine

Slots er ikke strategier – de er **kapitalplasser**.

---

## Slot-typer
- CORE_TREND
- CORE_ASYM

Hver trade fyller nøyaktig **én slot**, uavhengig av størrelse.

---

## ENTER-regel
Systemet kan kun foreslå ENTER når:
- Antall aktive CORE-slots < maks-grense
- Kandidaten har høyere CoreScore enn minst én eksisterende trade  
  (hvis CORE er full)

Hvis CORE er full og ingen eksisterende trade er svakerokkert

---

## EXIT-regel
EXIT vurderes når:
- Stop-loss er truffet
- Target er truffet
- CoreScore har falt under terskel
- En betydelig bedre kandidat krever plass

EXIT frigjør slot umiddelbart.

---

## MOVE_STOP-regel
MOVE_STOP foreslås når:
- Trade er +R i gevinst
- Volatilitet avtar
- Risiko kan reduseres uten å skade asymmetri

MOVE_STOP teller ikke som EXIT eller ENTER.

---

## Prioriteringsrekkefølge
Når CORE er full:

1. EXIT svake trades
2. MOVE_STOP på vinnere
3. HOLD stabile trades
4. ENTER kun hvis kandidat er klart bedre

---

## Suksesskriterier
Slot Manager fungerer når:
- CORE aldri overstiger maks slots
- Dårlige trades forsvinner raskere enn gode
- Systemet føles rolig selv i volatile markeder

