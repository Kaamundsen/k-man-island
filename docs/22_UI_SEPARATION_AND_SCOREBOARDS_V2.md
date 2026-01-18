# 22_UI_SEPARATION_AND_SCOREBOARDS_V2

## Formål
Rydde UI slik at:
- CORE er **default og isolert**
- Ingen strategimiks i lister, sortering eller handlinger
- Hver strategi vises i **eget board** med egen logikk

Dette er **UI- og presentasjonslag**, ikke strategi eller scoring.

---

## 1) Overordnet UI-prinsipp
UI deles i **boards**, ikke “én stor dashboard”.

Hvert board:
- har én motor
- én score/ordering
- én type handlinger

Boards deler **komponenter**, men aldri **logikk**.

---

## 2) Boards som skal finnes

### 2.1 CORE Board (default)
**Motor:** CORE V2  
**Data:** CORE pipeline (ENGINE → SLOTS → ACTIONS → BRIEF)

Viser:
- CORE Brief (øverst)
- Ranked CORE candidates
- Active CORE trades (3–5 slots)

Bruker:
- CORE output (ikke `calculateCompositeScore`)
- CORE actions (ENTER / HOLD / MOVE_STOP / EXIT)

**Regel**
- CORE board viser **kun CORE**
- Ingen strategy labels
- Ingen K-score
- Ingen fallback til legacy

---

### 2.2 SWING Board (Strategy Pack)
**Motor:** Legacy / Strat** `calculateStrategyScores`, K-score, osv.

Viser:
- Swing-kandidater
- Egen sortering og labels

**Regel**
- Påvirker aldri CORE
- Kan ikke trigge CORE actions

---

### 2.3 DAYTRADE Board (Strategy Pack / opt-in)
**Motor:** Daytrade pack (legacy / manual / paper)

Viser:
- Intraday setup
- Paper/live status (senere)

**Regel**
- Alltid opt-in
- Aldri default
- Aldri input til CORE

---

### 2.4 TRACKERS Board
**Motor:** Tracker logic  
**Data:** Eksterne porteføljer / indekser / watch-only

Viser:
- Performance
- Endringer
- Ingen BUY/SELL

**Regel**
- TRACKERS er **observasjon**, ikke trading

---

## 3) Navigasjon
UI må gjøre det umulig å blande boards ved uhell.

Forslag:
- Topp-nivå tabs:
  - CORE
  - SWING
 TRADE
  - TRACKERS

Eller:
- `/core`
- `/swing`
- `/daytrade`
- `/trackers`

---

## 4) Sortering og filtering (viktig guardrail)

### 4.1 CORE Board
- Sortering: CORE-prioritet / CORE score
- Filtering: kun CORE-relevante felt
- Filterbytte:
  - **trigger ikke ny analyse**
  - bruker allerede generert CORE-output

### 4.2 Strategy Boards
- Bruker egen sortering
- Kan ha egne filtre

**Regel**
- `calculateCompositeScore` brukes aldri i CORE Board

---

## 5) UI-komponenter (gjenbruk uten miks)
Tillatt gjenbruk:
- Card
- List
- Badge
- Table
- Modal

Ikke tillatt:
- Delte “smart components” som inneholder:
  - strategy logic
  - scoring
  - decision rules

---

## 6) Handlinger i UI

### 6.1 CORE Board handlinger
Tillatt:
- “Apply action” (ENTER / MOVE_STOP / EXIT)
- “Acknowledge” (logg at du har sett beslutning)

Ikke tillatt:
- Manuell BUY/SELL-knapp
- Overstyring av CORE-logikk

---

### 6.2 Strategy Boards handlinger
Tillatt:
- ger per pack
- Manuell trading / paper

---

## 7) Default behavior
Ved app-start:
- CORE Board åpnes
- CORE Brief vises først
- Andre boards er sekundære

---

## 8) Done-kriterier for 22
22 er ferdig når:
- CORE board er default
- CORE output vises isolert
- Ingen strategimiks i UI
- Strategy Packs lever i egne boards
- Filter/sortering ikke trigger reanalyse

---

## Neste dokument (23)
**23_PERFORMANCE_AND_COST_HARDENING_V2**
- caching
- API-kall
- latency
- kostkontroll

