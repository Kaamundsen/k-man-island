# 19_CORE_SCORE_IMPLEMENTATION_V2

## Formål
Definere **én endelig** CORE scoringmodell som brukes av CORE (TREND + ASYM) på en konsistent måte.
Dette dokumentet beskriver:
- hard filters vs soft score
- vekting
- terskler for ENTER / EXIT / SLOT-priority
- krav til determinisme og forklarbarhet

**Viktig**
- Endrer ikke kontrakter i 11–14
- Ingen nye strategier
- Ingen ML / fancy
- Kun CORE

---

## 1) Score-ramme (TREND + ASYM)
CORE-score består av to profiler:
- **TREND**: kvalitet på trend + robusthet
- **ASYM**: asymmetrisk payoff / “fat right tail” med kontrollert downside

Resultat per kandidat:
- `profile`: TREND | ASYM | NONE
- `hardPass`: true/false (må være true for ENTER / slot-opptak)
- `softScore`: 0–100 (brukes for ranking/prioritet)
- `reasons[]`: korte forklaringer (maks 6)

---

## 2) Hard filters (må passere)
Hard filters brukes for å sikre at CORE ikke tar “dårlige” trades selv om score er høy.

### 2.1 Datakvalitet
- Daily data komplett (min hist, ingen future bale=NONE`, `hardPass=false`, reason: `INSUFFICIENT_DATA`

### 2.2 Likviditet / handelbarhet (enkelt, stabilt)
- kandidat må være “handelbar” iht. V2 data-krav (16)
- hvis fail → `hardPass=false`, reason: `NOT_TRADEABLE`

### 2.3 Volatilitet / bevegelse (minimum)
- må ha minimum daglig bevegelse/volatilitet for at stops/targets gir mening
- hvis fail → `hardPass=false`, reason: `TOO_STATIC`

> NB: terskelverdier settes i config (ingen tuning her), men regelen skal finnes.

---

## 3) Soft score (0–100)
Soft score brukes til:
- ranking av kandidater
- prioritering når slots er fulle
- “hvem får ENTER først”

### 3.1 Score-komponenter (TREND)
TREND soft score summerer vektede komponenter:
- Trend strength (f.eks. pris over relevante MA/ability (lav “whipsaw” / jevnhet)
- Pullback quality (entry på “ikke-extreme” nivåer)
- Risk quality (stop-avstand vs forventet move)

### 3.2 Score-komponenter (ASYM)
ASYM soft score summerer:
- Asymmetry potential (stor oppside vs kontrollert downside)
- Compression → expansion signal (stram range før mulig break)
- Optional catalyst-agnostic momentum (kun price/volume daily)
- Risk containment (stop kan settes uten å bli “for nær”)

---

## 4) Profilvalg (TREND vs ASYM)
Regler:
- Kandidat evalueres for begge profiler.
- Velg profilen med:
  - `hardPass=true`
  - høyest `softScore`
- Hvis ingen hardPass → `profile=NONE`

---

## 5) Terskler og beslutningsregler

### 5.1 ENTER threshold
ENTER kan kun skje hvis:
- `hardPass=true`
- `softScore >= ENTER_MIN`
- Slot Manager har kapasitet, eller Action Engigjør slot

Output:
- `action = ENTER`
- `priority` settes fra score + slot-trykk

### 5.2 EXIT threshold
EXIT trigges av:
- Hard exit: stop/invalid state (alltid)
- Soft exit: score faller under `EXIT_MIN` (bare hvis ikke i “protect mode”)

Output:
- `action = EXIT`

### 5.3 MOVE_STOP rule
MOVE_STOP trigges når:
- trade har oppnådd definert progress (f.eks. +1R eller “structure break”)
- ny stop er høyere (for long) og gyldig iht. risk rules

Output:
- `action = MOVE_STOP`
- `newStop`

### 5.4 SLOT priority
Når slots er fulle:
- Slot Manager rangerer:
  - behold trades med høyest “hold quality”
  - frigjør trades som bryter exit rules eller lavest score

---

## 6) Forklarbarhet (reasons)
Krav:
- Hver score eval skal gi maks 6 grunner.
- kens, f.eks:
  - `TREND_STRONG`
  - `MA_ALIGNMENT`
  - `LOW_WHIPSAW`
  - `ASYM_SETUP`
  - `RISK_GOOD`
  - `SCORE_DROP`

Dette er viktig for CORE Brief.

---

## 7) Determinisme og caching
Regler:
- Samme input (daily data + state) → samme score
- Ingen tilfeldighet
- Ingen intraday
- Cache keyed på: (symbol, asOfDate, profileVersion)

---

## 8) Output til neste dokument (20)
Når 19 er ferdig har vi:
- definert hard filters
- definert scorekomponenter (uten tuning)
- definert terskler (ENTER_MIN, EXIT_MIN) som konfig
- definert hvordan score styrer slots og actions

Neste:
**20_ACTION_ENGINE_IMPLEMENTATION_V2**
- koble CoreScore + Slots → ENTER/HOLD/MOVE_STOP/EXIT decision object

