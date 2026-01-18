# ACTION_ENGINE_V2

## Formål
Action Engine er beslutningsmotoren som daglig avgjør **hva som skal gjøres** med hver trade.

Den oversetter analyse → handling, uten følelser.

Mulige handlinger:
- ENTER
- HOLD
- MOVE_STOP
- EXIT

---

## Overordnet prinsipp
- Action Engine gir **én tydelig anbefaling per trade per dag**
- Ingen trade kan få motstridende signaler samme dag
- CORE og ikke-CORE behandles forskjellig

---

## Input
Action Engine mottar:

### Per trade
- Strategy / CoreProfile (TREND / ASYM)
- Entry
- Stop
- Target
- Nåværende pris
- CoreScore (dagens)
- Endring i CoreScore (Δ)
- R-multipler (+R / −R)

### Systemstatus
- Antall aktive CORE-slots
- Nye CORE-kandidater
- Markedsregime (risk-on / risk-off – senere)

---

## Beslutningsrekkefølge (viktig)
Handling evalueres i denne rekkefølgen – **første treff vinner**:

1. EXIT (risiko / regelbrudd)
2. MOVE_STOP (risikoreduksjon)
3. ENTER (kun hvis slot tilgjengelig)
4. HOLD (default)

---

## EXIT-logikk
EXIT foreslås når én
- Stop-loss truffet
- Target truffet
- CoreScore < minimum terskel
- CoreScore faller kraftig (trendbrudd)
- Bedre kandidat krever slot (CORE full)

EXIT er alltid høyest prioritet.

---

## MOVE_STOP-logikk
MOVE_STOP foreslås når:

- Trade er ≥ +1R i gevinst
- Volatilitet avtar
- Asymmetri er bevart etter flytting

Typiske regler:
- Flytt stop til break-even ved +1R
- Flytt stop til +0.5R ved +2R
- Aldri flytt stop bakover

---

## ENTER-logikk
ENTER foreslås kun når:

- CORE har ledig slot  
  **eller**
- Kandidaten er bedre enn svakeste CORE-trade

Krav:
- Full score-evaluering
- Definert stop og target
- Tydelig CoreProfile (TREND / ASYM)

ENTER blokkeres hvis CORE er full og ingen EXIT er trigget.

---

## HOLD-logikk
HOLD brukes når:
- Ingen EXIT
- Ingen MOVE_STOP
- Ingen ENTER

HOLD betyr:
> “Ingenting å gjøre i dag – planen er intakt.”

---

## CORE vs Ikke-CORE
### CORE-trades
- Følges daglig
- Full Action Engine-logikk
- Slot-begrenset

### Ikke-CORE
- Kun EXIT / HOLD
- Ingen ENTP
- Brukes for observasjon, læring og tracking

---

## Output-format (per trade)
Action Engine returnerer:

- Action: ENTER | HOLD | MOVE_STOP | EXIT
- Begrunnelse (kort, konkret)
- Eventuell stop-justering
- Prioritet (LOW / MEDIUM / HIGH)

---

## Suksesskriterier
Action Engine fungerer når:

- Antall beslutninger er lavt men presist
- Overtrading er eliminert
- CORE-trades føles “kjedelige på en god måte”
- Systemet kan kjøres daglig uten stress

---

## Viktig filosofi
> Action Engine skal aldri være smart –  
> den skal være **konsekvent**.

Smarthet ligger i strategiene.  
Disiplin ligger i Action Engine.

