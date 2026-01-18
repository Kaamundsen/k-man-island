# 21_CORE_BRIEF_IMPLEMENTATION_V2

## Formål
Generere en daglig **CORE Brief** som er:
- tekstlig
- kort (30–60 sek)
- én kilde til sannhet for CORE
- tydelig prioritert rekkefølge på handlinger

Input er kun CORE pipeline (CORE_ENGINE + SLOT_MANAGER + ACTION_ENGINE).
Ingen UI-regler. Ingen strategi-miks.

---

## 1) Inputs
CORE Brief bygges av:

- `asOfDate`
- `slotSummary`
  - `maxSlots`
  - `activeCount`
  - `openSlots`
- `activeTrades[]` (CORE only)
  - symbol, profile, entry, stop (nåværende), status
- `decisions[]` (fra Action Engine, CORE only)
  - ENTER / HOLD / MOVE_STOP / EXIT
  - priority
  - reasons[]
  - params (newStop, entryPlan)

**Regel:** Hvis CORE ikke kan kjøres (datafeil), må brief fortsatt returneres med tydelig status.

---

## 2) Output format (markdown string)
Brief skal alltid produseres i samme struktur:

1) Header (dato + status)
2) Slots (kapasitet)
3) ACTIONS (prioritert)
4) Active CORE trades (kort status)
5) Blocked / Watch (kun hvis relevant)
6) Notes (maks 3 linje# 3) Header
Format:
- `# CORE BRIEF — YYYY-MM-DD`
- `Status: OK | PARTIAL_DATA | NO_DATA`

Regler:
- `OK` når alle nødvendige symboler/trades ble evaluert
- `PARTIAL_DATA` når noen mangler data (list hvilke)
- `NO_DATA` når pipeline ikke kunne kjøres

---

## 4) Slots-seksjon
Kort og alltid med:

- `Slots: X/Y active (Z open)`
- Hvis `openSlots == 0`: skriv `CORE FULL`

Eksempel:
- `Slots: 4/5 active (1 open)`
- `Slots: 5/5 active (0 open) — CORE FULL`

---

## 5) ACTIONS (prioritert rekkefølge)
Brief skal gruppere actions i denne rekkefølgen:

1) **EXIT** (HIGH → MED)
2) **MOVE_STOP** (HIGH → MED)
3) **ENTER** (HIGH → MED) (maks 1–2)
4) **HOLD** (valgfritt å liste alle; kan oppsummeres)

### 5.1 Presentasjon per action-linje
Format pr linje:
- `- [ACTION] SYMBOL (PROFILE) — short reason(s)`

MOVE_STOP inkluderer ny stop:
- `- [MOVE_STOP] EQNR (TREND) — newS, TREND_STRONG`

ENTER inkluderer entryPlan (minimalt):
- `- [ENTER] NHY (ASYM) — entry: NEXT_OPEN — stop: 92.4 — ASYM_SETUP, RISK_GOOD`

EXIT inkluderer exitReason:
- `- [EXIT] VAR (TREND) — STOP_HIT`

**Regel:** maks 6 reasons total per linje (helst 2–3).

---

## 6) Active CORE trades (kort statusliste)
Denne seksjonen skal gi deg rask oversikt uten støy.

Format:
- `## Active CORE Trades`
- `- SYMBOL (PROFILE) — entry: X — stop: Y — status: HOLD|PROTECT|WEAK`

Status kan avledes fra beslutning:
- EXIT → `WEAK`
- MOVE_STOP → `PROTECT`
- HOLD → `HOLD`

---

## 7) Blocked / Watch (kun ved behov)
Vis kun hvis:
- `openSlots == 0` og det finnes sterke ENTER-kandidater
- eller hvis Action Engine har “blocked candidates”

Format:
- `## Blocked (CORE FULL)`
- `- SYMBOL (TREND) — score: 84 — waiting for slot`

---

## 8) Error/partial-data håndtering
Hvis `PARTIAL_DATA`:
- list symbols som manglet data i en egen linje:
  Hvis `NO_DATA`:
- brief skal fortsatt gi:
  - dato
  - status
  - kort “no actions generated”
  - og en enkel anbefaling: “rerun later”

Ingen lange feilmeldinger i brief.

---

## 9) Determinisme
Regler:
- Samme inputs → samme brief
- Brief rekkefølge er stabil:
  - sortér per action group på `priority desc`, deretter `softScore desc` (hvis tilgjengelig), deretter symbol

---

## 10) Done-kriterier for 21
21 er ferdig når:
- Brief format er fast og konsekvent
- Prioritet og grouping følger Action Engine
- Brief er lesbar på 30–60 sek
- Den tåler partial/no data uten å knekke

---

## Neste dokument (22)
**22_UI_SEPARATION_AND_SCOREBOARDS_V2**
- CORE-board (default)
- SWING/DAYTRADE/TRACKERS boards
- null strategimiks

