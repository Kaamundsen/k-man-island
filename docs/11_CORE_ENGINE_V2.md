Ctrl + O
# CORE_ENGINE_V2.md

## Formål
Bygge én stabil kapitalmotor som kan levere 100–200% årlig avkastning ved å kjøre maks 3–5 samtidige trades, med mekaniske regler som minimerer følelser, overtrading og feil.

Core Engine er den eneste delen av systemet som gir handle-ordre (ENTER / EXIT / MOVE_STOP).

---

## Omfang

### Core Engine inkluderer
- Rangering av kandidater basert på Core-profiler
- Utvelgelse av trades til CORE-slots (3–5)
- Daglige anbefalinger:
  - ENTER (ny trade)
  - HOLD (hold trade)
  - MOVE_STOP (flytt stop)
  - EXIT (lukk trade)
- Konsistent risk- og posisjonsstyring

### Core Engine ekskluderer
- Utbytte / income-forvaltning
- Langsiktige investeringer (Buffett / HODL)
- Følgeporteføljer (Tveitereid, Tingvoll, DNB, Investtech m.fl.)
- Daytrade / rebound / eksperimenter
- Nyheter som direkte signalmotor

Disse kan eksistere i systemet, men er ikke Core.

---

## Core-profiler

### CORE_TREND (stabil ryggrad)
- Mål: høy win-rate, lav drawdown, jevn vekst
- Holding: 2–6 uker
- Forventet gevinst: 8–15%
- RR: ≥ 1.8–2.5
- Fokus: bekreftet trend (momentum + over SMA)

### CORE_ASYM (booster)
- Mål: høy payoff, akselerere totalavkastning
- Holding: 5–20 dager
- Forventet gevinst: 15–40%
- RR: ≥ 3.0
- Fokus: asymmetrisk oppside (breakout / reprising / squeeze)

---

## Slot-regler

- Min: 3 trades
- Maks: 5 trades

Fordeling:
- CORE_TREND: 2–3 slots
- CORE_ASYM: 1–2 slots
- CORE_ASYM ≤ 40% av Core Engine

Hvis Core er full → ingen nye ENTER før EXIT.

---

## Output-format (kontrakt)

For hver trade/kandidat:

- ACTION: ENTER | HOLD | MOVE_STOP | EXIT
- PROFILE: CORE_TREND | CORE_ASYM
- CONFIDENCE: 0–100
- WHY: 3–5 korte punkter
- ENTRY: pris / trigger
- STOP: pris
- TARGET: pris
- RR: tall
- RISK_%: % av portefølje

Samme input skal alltid gi samme output.

---

## Risiko-regler

- Risiko per Core-trade: 0.75–1.25%
- Maks total risiko (sum stops): 3–5%
- Ingen trade uten stop og target
- MOVE_STOP brukes for å redusere risiko (f.eks. ved 1R)

---

## Nyheter (hard regel)

Nyheter kan:
- redusere confidence
- flagge risiko (earnings, regulatorisk)
- foreslå HOLD / vent

Nyheter kan ikke alene trigge ENTER eller EXIT.

---

## Forhold til øvrige strategier

Andre strategier kan:
- ha egne scorer
- egne porteføljer
- egne rapporter

Men:
- kan ikke påvirke Core-slots automatisk
- kan ikke overstyre Core-regler
- Core Engine er motoren, resten er biblioteket

---

## Daglig Core Brief

1. Active Core Trades (3–5)
   - ACTION per trade
   - stop / target-status
   - tydelig neste steg

2. Top Candidates (TOP 5)
   - nær ENTER
   - hva som mangler (RR, trend, timing)

3. Risk Summary
   - total risiko (%)
   - konsentrasjon (sektor/korrelasjon hvis tilgjengelig)

---

## Suksesskriterier

Core Engine er korrekt når:
- den aldri foreslår ENTER hvis Core er full
- den aldri foreslår trade uten stop/target
- den skiller CORE tydelig fra ikke-CORE
- den gir stabile beslutninger uten støy
- rapporter slutter å mase på utbytte/long som swing

---

## Implementasjonsnote

Core Engine bygges som eget lag:
- CoreProfile scoring (TREND / ASYM)
- Slot Manager (3–5)
- Action Engine (ENTER / HOLD / MOVE_STOP / EXIT)
- Core Brief generator
