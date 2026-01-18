# 18_CORE_CODE_MAPPING_V2

## Formål
Mappe V2-kontrakter (11–16) til dagens kodebase slik at vi vet **nøyaktig**:
- hva som blir CORE (V2)
- hva som blir adapters
- hva som blir legacy / Strategy Packs
- hvilke funksjoner som deprecates (men ikke fjernes ennå)

Ingen ny strategi. Ingen endring av kontrakter. Kun mapping og isolasjon.

---

## 1) V2-moduler (må opprettes / eies i V2-namespace)

### 1.1 CORE_ENGINE (11_CORE_ENGINE_V2)
**Blir til:**
- `src/v2/core/core-engine/index.ts`
- `src/v2/core/core-engine/trend.ts`
- `src/v2/core/core-engine/asym.ts`
- `src/v2/core/core-engine/types.ts` (kun CORE internt)

**Input kommer fra:**
- `src/v2/adapters/market-data/*`
- `src/v2/adapters/analysis/*` (hvis dere har ferdig “validated analysis”)

**IKKE lov å importere fra:**
- `src/strategy-packs/**`
- legacy `calculateCompositeScore`
- legacy `calculateStrategyScores`

---

### 1.2 CORE_SLOT_MANAGER (12_CORE_SLOT_MANAGER_V2)
**Blir til:**
- `src/v2/core/slot-manager/index.ts`
- `src/v2/core/slot-manag`
- `src/v2/core/slot-manager/types.ts`

**Input kommer fra:**
- `src/v2/adapters/portfolio/*` (holdings, trades, tags)
- `src/v2/adapters/storage/*` (persist CORE state)

---

### 1.3 ACTION_ENGINE (13_ACTION_ENGINE_V2)
**Blir til:**
- `src/v2/core/action-engine/index.ts`
- `src/v2/core/action-engine/decisions.ts`
- `src/v2/core/action-engine/types.ts`

**Input kommer fra:**
- CORE_ENGINE output
- SLOT_MANAGER state
- `src/v2/adapters/portfolio/*` (trade snapshots)

---

### 1.4 CORE_BRIEF (14_CORE_BRIEF_V2)
**Blir til:**
- `src/v2/core/core-brief/index.ts`
- `src/v2/core/core-brief/render.ts`
- `src/v2/core/core-brief/types.ts`

**Input kommer fra:**
- Action Engine decisions
- Slot Manager summary

---

## 2) Adapter-lag (kobler dagens system → V2)

### 2.1 Market Data Adapter (16_DATA_AND_API_REQUIREMENTS_V2)
**Blir til:**
- `src/v2/adapters/market-data/yahooDaily.ts`
- `src/v2/adapters/market-data/cache.ts`
- `src/v2/adapters/market-data/types.ts`

**Kobles til eksisterende:**
- dagens Yahoo fetch / caching / price history funksjoner  
  (behold implementasjon, men flytt “public API” inn bak adapter)

**Regel:**
- CORE bruker kun DAILY.

---

### 2.2 Analysis Adapter (AS-IS analysis → CORE input)
**Blir til:**
- `src/v2/adapters/analysis/from-validated-analysis.ts`
- `src/v2/adapters/analysis/types.ts`

**Kobles til eksisterende:**
- `getValidatedAnalysis` (hvis finnes)
- deler av `calculateTechnicalIndicators` (kun de som produserer grunnlagsfelt)

**Viktig:**
- `BUY/HOLD/SELL` fra legacy er ikke input til CORE.

---

### 2.3 Portfolio Adapter
**Blir til:**
- `src/v2/adapters/portfolio/from-portfolio.ts`
- `src/v2/adapters/portfolio/types.obles til eksisterende:**
- portfolio modeller (positions/trades)
- bulk import
- trade move/labels

---

### 2.4 Storage Adapter (CORE state)
**Blir til:**
- `src/v2/adapters/storage/coreStateStore.ts`

**Kobles til eksisterende:**
- det dere bruker i dag (db/local/json) for å lagre app-state
- minimum: `coreTrades[]`, `activeSlots`, `lastRunDate`

---

## 3) Legacy / Strategy Packs (behold, men isoler)

### 3.1 Strategy Packs (legacy)
**Flyttes/merkes som:**
- `src/strategy-packs/legacy/`

**Inneholder fortsatt:**
- `calculateStrategyScores`
- K-score
- daytrade, rebound, trackers (hvis de ligger i samme område)

**Regel:**
- De kan ha egen UI senere (22), men påvirker ikkORE.

---

### 3.2 Deprecate (men ikke fjern)
**Kandidater (eksempler):**
- `calculateCompositeScore` som “global dashboard ranking”
- `BUY/HOLD/SELL` output brukt som global sannhet

**Ny regel:**
- Dashboard “CORE board” bruker kun CORE pipeline (senere i 22)

---

## 4) Eksakt mapping: dagens funksjoner → V2 ansvar

### 4.1 `calculateTechnicalIndicators`
**Deler gjenbrukes via adapters:**
- pris/returns/avgDailyMove/sma/rsi/52w-range/volatility (hvis dere har)
**Deler blir legacy-only:**
- global BUY/HOLD/SELL
- target/stop som “global trading truth”

→ Output skal mappes til **CORE input DTO** via `AnalysisAdapter`.

---

### 4.2 `calculateStrategyScores`
**Blir:**
- `src/strategy-palateStrategyScores.ts`

→ Ikke brukt av CORE.

---

### 4.3 K-score
**Blir:**
- `src/strategy-packs/legacy/k-score/*`

→ Ikke brukt av CORE.

---

### 4.4 `calculateCompositeScore`
**Blir:**
- legacy dashboard-sortering for packs
**CORE får:**
- egen ranking basert på CORE-kontrakt-output

---

## 5) Første PR-plan (kun mapping + isolasjon)

### PR1 — Opprett mapper + flytt/alias legacy
- opprett `src/v2/**`
- opprett `src/strategy-packs/legacy/**`
- legg inn “barrel exports” så gammel import fortsatt virker internt

### PR2 — Adapters scaffolding
- `market-data` adapter peker på Yahoo funksjoner
- `analysis` adapter peker på validated analysis / tech indicators
- `portfolio` adapter peker på portfolio service

**Ingen CORE-logikk i disse PR-ene.**

---

## 6) Output fra 18 (Done-kriterier)
18 er ferdig når vi har:
- en eksplisitt filstruktur for V2 CORE og V2 adapters
- en eksplisitt liste over dagens filer/funksjoner som:
  - flyttes til `strategy-packs/legacy`
  - brukes kun via adaptmen beholdes)
- en PR-sekvens som kan merges uten runtime-endring

---

## 7) Neste dokument (19)
**19_CORE_SCORE_IMPLEMENTATION**
- definere endelig TREND + ASYM scoring
- hard filters vs soft score
- terskler for ENTER/EXIT/SLOT-priority

