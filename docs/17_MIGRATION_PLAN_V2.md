# 17_MIGRATION_PLAN_V2

## Formål
Migrere dagens kodebase til V2-arkitekturen **uten rewrite**, slik at CORE-motoren kan gå live tidlig,
mens resten av systemet fortsetter å fungere som Strategy Packs / Trackers.

Målet med denne planen er å:
- isolere CORE korrekt
- bevare eksisterende funksjonalitet underveis
- gi en konkret, trygg rekkefølge på endringer

---

## Viktige føringer (må ikke brytes)
- Docs **11–16 er kontrakt og sannhet**
- CORE og Strategy Packs skal **aldri** blandes
- Ingen nye strategier
- Ingen optimalisering eller ML
- Små, kontrollerte steg med synlig effekt

---

## 0. Dagens situasjon (AS-IS – kort)
I dag er følgende logikk blandet:

- `calculateTechnicalIndicators`
  - RSI, SMA, target, stop, RR
  - BUY / HOLD / SELL
- `calculateStrategyScores`
- `calculateCompositeScore` brukes til:
  - dashboard-sortering
  - “beste aksjer”-logikk

Konsekvens:
- CORE-logikk og øvrige strategier er blandet
- Ingen tydelig separasjon mellom:
  - CORE trades (3–5 slots)
  - income / long
  - trackers / eksterne porteføljer

---

## 1. Overordnet migreringsstrategi
Migreringen skjer i **parallell drift**, ikke ved å erstatte alt.

### Spor A — CORE-motor (først)
- Implementer V2 CORE som **egen, isolert pipeline**
- Kjør parallelt med eksisterende system
- Ingen UI-avhengighet i starten

### Spor B — UI-separasjon (etter stabil CORE)
- CORE-board + CORE Brief blir default
- Øvrige views blir Strategy Packs / Trackers

### Spor C — Portfolio & rapporter (sist)
- CORE trades skilles tydelig fra:
  - income
  - long
  - trackers

---

## 2. Prinsipp: Parallell drift før fjerning
Regel:
- Ingenting fjernes før CORE V2 faktisk produserer:
  - CORE-engine output (TREND / ASYM)
  - gyldige actions
  - daglig CORE Brief

Først **verifisere**, deretter **bytte default**.

---

## 3. Arbeidsrekkefølge (konkret)

### Steg 1 — Etabler V2-namespace (ingen logikkendring)
**Mål:** Struktur og harde grenser.

Opprett:
- `src/v2/core/`
- `src/v2/adapters/`
- `src/strategy-packs/legacy/`

CORE-kode skal **kun** leve i `src/v2/core`.

**Akseptanse**
- Appen oppfører seg likt
- Ingen runtime-endring

---

### Steg 2 — Adapter: AS-IS → CORE-input
**Mål:** CORE skal aldri lese legacy-modeller direkte.

Leveranse:
- Adapter som mapper eksisterende data til CORE-input
- Eks:
  - eksisterende `Stock` / analysis → CORE input DTO

**Akseptanse**
- For en aksje kan CORE-input logges eksplisitt
- CORE er blind for hvor data kommer fra

---

### Steg 3 — Isoler CORE signalberegning
**Mål:** Slutt på “composite score”-suppe.

Leveranse:
- CORE_ENGINE kjøres isolert
- Produserer:
  - TREND / ASYM state
  - hard filters (pass/fail)
  - forklaringer (reasons)

**Akseptanse**
- Kan kjøres på watchlist uten UI
- Samme input → samme output

---

### Steg 4 — Slot Manager (3–5 CORE trades)
**Mål:** CORE styrer alltid eksponering.

Leveranse:
- Slot-logikk iht. V2-kontrakt
- Returnerer:
  - aktive CORE trades
  - kandidater blokkert av fulle slots
  - exit-kandidater ved konflikt

**Akseptanse**
- Ingen scenario kan gi >5 CORE trades

---

### Steg 5 — Action Engine (beslutninger)
**Mål:** CORE tar beslutninger, ikke UI.

Leveranse:
- ENTER / HOLD / MOVE_STOP / EXIT
- Én beslutning per trade per dag
- Ingen eksekvering, kun beslutning

**Akseptanse**
- Stop/target → alltid EXIT
- Ingen ENTER hvis slots er fulle uten exit

---

### Steg 6 — CORE Brief (daglig plan)
**Mål:** Én kilde til sannhet: “Hva gjør jeg i dag?”

Leveranse:
- Tekstlig CORE Brief
- Tydelig prioritet på handlinger
- Skiller CORE fra ikke-CORE

**Akseptanse**
- Lesbar på 30–60 sek
- Kan genereres daglig uten UI

---

### Steg 7 — Backend API for CORE (read-only)
**Mål:** Kjør CORE V2 end-to-end.

Leveranse:
- API-endepunkt som returnerer:
  - CORE-output
  - actions
  - CORE Brief
  - timestamp

**Akseptanse**
- Kan kalles fra devtools
- Ingen sideeffekter

---

### Steg 8 — UI: Board-separasjon
**Mål:** CORE blir default visning.

Leveranse:
- Eget CORE-board
- Strategy Packs som egne boards
- Ingen felles sortering

**Akseptanse**
- CORE board bruker kun CORE-output
- UI-filter trigget ikke reanalyse

---

### Steg 9 — Portfolio: CORE vs øvrige
**Mål:** Ikke ødelegge eksisterende flyt.

Leveranse:
- En enkel flag / type på trades:
  - CORE / INCOME / TRACKER / MISC
- CORE views bruker kun CORE trades

---

### Steg 10 — Rapportering
**Mål:** Slutt på strategistøy.

Leveranse:
- Daglig rapport delt i:
  - CORE (handlingsbar)
  - INCOME (monitoring)
  - TRACKERS
  - MISC

---

## 4. Gjenbruk vs isolering

### Gjenbruk
- Yahoo fetch + caching
- Historisk analysis / profiles
- Portfolio + bulk import
- UI-komponenter

### Isoler
- Dashboard sortering
- Strategy scores som global sannhet

---

## 5. Definisjon av DONE (for 17)
17 er ferdig når:
- CORE kan kjøres parallelt med legacy
- Reell rekkefølge for migrering er definert
- Grunnlaget for **18_CORE_CODE_MAPPING_V2** er klart

---

## 6. Neste dokument
**18_CORE_CODE_MAPPING_V2**
- eksakt mapping:
  - hvilke filer blir CORE
  - hvilke blir adapters
  - hva som er legacy / packs
