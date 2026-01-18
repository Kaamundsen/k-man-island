# 20_ACTION_ENGINE_IMPLEMENTATION_V2

## Formål
Koble CORE score/output + Slot Manager state → **faktiske daglige handlinger**:
- ENTER
- HOLD
- MOVE_STOP
- EXIT

Ingen UI. Ingen eksekvering. Kun logikk + beslutningsobjekt.
Respekter kontrakter i 11–14.

---

## 1) Inputs (hva Action Engine får)
Action Engine skal være “ren” og få alt den trenger som input.

### 1.1 Fra CORE_ENGINE / Core scoring (19)
Per symbol/trade:
- `profile` (TREND | ASYM | NONE)
- `hardPass` (true/false)
- `softScore` (0–100)
- `reasons[]`
- eventuelle nivåer beregnet av CORE (hvis kontrakten har det)

### 1.2 Fra SLOT_MANAGER (12)
- `maxSlots` (3–5)
- `activeCoreTrades[]`
- `openSlots`
- `blockedCandidates[]` (fullt)
- evt. `exitCandidates[]` når konflikt

### 1.3 Fra Portfolio/Trade snapshot (adapter)
For aktive trades:
- entryPrice
- size/qty (hvis relevant for stops)
- currentStop
- currentTarget (hvis dere bruker det i state)
- currentRMultiple / progress (kan beregnes)
- lastActionDate / lastDecision
- tradeTaSystem state
- `asOfDate`
- `mode` = READONLY | PAPER | LIVE (24 styrer)
- `config` (ENTER_MIN, EXIT_MIN, +1R rule osv.)

---

## 2) Output (Decision Object)
Action Engine produserer en liste av beslutninger som kan brukes av CORE_BRIEF (21) og senere UI.

### 2.1 Decision schema (minimum)
Per symbol/trade:
- `symbol`
- `action` = ENTER | HOLD | MOVE_STOP | EXIT
- `priority` (0–100 eller enum HIGH/MED/LOW)
- `profile` (TREND/ASYM)
- `confidence` (valgfritt, men deterministisk – kan være avledet av score)
- `reasons[]` (maks 6)
- `params` (valgfritt):
  - `newStop` (for MOVE_STOP)
  - `entryPlan` (for ENTER: entryType, stop, risk)
  - `exitReason` (STOP_HIT, SCORE_DROP, INVALID_STATE)

**Regel:** Maks 1 beslutning per trade per dag.

---

## 3) Beslutningsrekkefølge (viktig)
Action Engine skal alltid evaluere i denne rekkefølgen:

1) **Hard EXIT** (sikkerhet)
2) **MOVE_STOP** (beskytte gevinst)
3) **Soft EXIT** (score/tilstand)
4) **HOLD**
5) **ENTER** (kun hvis slots tillater)

Dette hindrer at ENTERmens EXIT egentlig burde skje.

---

## 4) Regler (konkret)

### 4.1 Hard EXIT (alltid)
Trigger hvis:
- stop er brutt (daily close/low iht. deres definisjon)
- trade er “invalid” (mangler state, symbol delistet, datafeil)
- hard filter feiler for trade (ikke tradeable / insufficient data)

Output:
- `action=EXIT`
- `priority=HIGH`
- `reasons` inkluderer en av:
  - `STOP_HIT`
  - `INVALID_STATE`
  - `INSUFFICIENT_DATA`
  - `NOT_TRADEABLE`

---

### 4.2 MOVE_STOP (beskyttelse)
Trigger hvis:
- trade har nådd “progress threshold” (f.eks. +1R) **og**
- ny stop er høyere enn gammel (for long) **og**
- ny stop er gyldig (ikke over dagens close, ikke for tett hvis dere har min-avstand)

`action=MOVE_STOP`
- `priority=HIGH|MED` (avhengig av hvor nær prisen er)
- `params.newStop`
- `reasons` inkluderer `LOCK_PROFIT`

**Regel:** MOVE_STOP får prioritet over HOLD og SOFT EXIT.

---

### 4.3 Soft EXIT (score faller / tilstand svekkes)
Trigger hvis:
- `softScore < EXIT_MIN` over en definert regel (samme dag)
- eller CORE-engine state indikerer at profilen er brutt (hvis kontrakten sier det)

Output:
- `action=EXIT`
- `priority=MED`
- `reasons` inkluderer `SCORE_DROP` / `PROFILE_BROKEN`

---

### 4.4 HOLD (default)
Hvis ingen triggers over:
- `action=HOLD`
- `priority=LOW`
- `reasons` kan være tom eller `NO_CHANGE`

---

### 4.5 ENTER (kun etter alt annet)
ENTER kan kun produseres hvis:
- kandidat `hardPass=true`
- `softScore >= ENTER_MIN`
- Slot Manager har `openSlots > 0`
- kandidat ikke er blokkert av slot manager

**ENTER-rate cap (for kontroll)**
- maks `MAX_ENTERS_PER_DAY` (typisk 1–2) for å holde CORplinert

Output:
- `action=ENTER`
- `priority` settes av score (høy score = høy priority)
- `params.entryPlan` inkluderer minst:
  - `entryType` = MARKET_NEXT_OPEN eller LIMIT (velg én standard nå)
  - `initialStop`
  - `riskNote` (kort)

---

## 5) Konflikthåndtering når slots er fulle
Hvis `openSlots == 0`:
- ENTER beslutninger skal normalt være **HOLD/BLOCKED** (ikke ENTER)
- men hvis Slot Manager har identifisert `exitCandidates[]`:
  - Action Engine produserer EXIT for de svakeste
  - og ENTER for topp-kandidaten (samme dag) **kun hvis kontrakten tillater dette**

**Regel:** Ikke produser 5 ENTER og 5 EXIT. Hold det stramt.

---

## 6) Read-only / Paper / Live (styring)
Action Engine er alltid samme logikk, men output håndteres ulikt:

- READONLY: beslutninger logges, ingen state-endring
- PAPER: state-endring kan skje i “paper ledger”
- LIVE: state-endring tillates for CORE trades (24)

Dette dokumentet definerer kun beslutningene, ikke eksekvering.

---

## 7) Logging (minimum for sporbarslutning logges med:
- `asOfDate`
- symbol
- action
- score snapshot (softScore + hardPass + profile)
- reasons[]
- trade id (hvis aktiv trade)

---

## 8) Done-kriterier for 20
20 er ferdig når:
- Decision object er definert
- Prioritert regelrekkefølge er definert
- ENTER/HOLD/MOVE_STOP/EXIT er deterministisk fra inputs
- Konfliktregler ved fulle slots er definert
- Output er klart for CORE_BRIEF (21)

---

## Neste dokument (21)
**21_CORE_BRIEF_IMPLEMENTATION_V2**
- generere daglig “hva gjør jeg i dag?” fra decisions + slots

