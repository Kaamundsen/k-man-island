# 00_SOURCE_OF_TRUTH.md — K-man Island

Dato: 2026-01-19 (oppdatert)  
Formål: Hindre dobbelt-system og sikre kontrollert restrukturering.

---

## A) Canonical kodebase

| Mappe | Rolle | Bruk |
|-------|-------|------|
| `src/` | **CANONICAL** | All produksjonskode |
| `k-man-island-inner/` | **LEGACY** | Kun referanse, IKKE import |

**Regel:** Ingen import fra `k-man-island-inner/` i produksjonskode.

---

## B) Dokumentprioritet (fasit)

- **AS-IS docs (00–04):** Beskriver eksisterende struktur
- **V2 docs (11–17):** Beskriver målet og restruktureringsplanen
- **Implementation docs (18–22):** Beskriver faktisk implementasjon

Ved konflikt:
- Struktur/pipeline: følg AS-IS
- Strategilogikk/score/brief/slots/actions: følg V2

---

## C) Design er låst

- Følg alle dokumenter i `/docs/design`
- Ikke lag nye farger, spacing, radius, shadows eller layout uten å oppdatere kontrakt
- Ikke lag nye komponent-varianter hvis eksisterende kan brukes

---

## D) Single Source of Truth for live data

### Data-henting
| Fil | Ansvar |
|-----|--------|
| `src/lib/api/stock-data.ts` | **CANONICAL** for aksjelist-henting |
| `src/lib/api/historical-data.ts` | 2 års historikk for analyse |
| `src/lib/api/stock-data-v2.ts` | Enkelt-aksje quotes |

### Strategi-scoring
| Fil | Ansvar |
|-----|--------|
| `src/lib/strategies/registry.ts` | **V2** Scoring + Filtering |
| `src/lib/strategies/index.ts` | Strategi-definisjoner |

Navnekollisjoner på funksjoner er forbudt.

---

## E) Refresh-mekanismer

| Type | Trigger | Hva skjer |
|------|---------|-----------|
| **Manuell** | "Oppdater nå"-knapp | Full re-fetch → re-analyse → re-render |
| **Cron** | Planlagt (ikke impl.) | Vil generere rapport + varsler |

Se `docs/22_SYSTEM_ARCHITECTURE_V2.md` for detaljer.

---

## F) Minimum suksesskriterier

| # | Krav | Status |
|---|------|--------|
| 1 | `/api/stocks` returnerer korrekt antall + timestamp | ✅ |
| 2 | "Oppdater nå" regenererer data, analyser og rapport | ✅ |
| 3 | Dagsrapport fungerer med porteføljeanalyse | ✅ |
| 4 | Strategier bruker riktig score per strategi/pack | ✅ |
| 5 | Graf bruker ekte historiske candles | ✅ |
| 6 | Guardrail blokkerer signal uten historikk | ✅ |

---

## G) Viktige dokumenter

| Dokument | Innhold |
|----------|---------|
| `docs/22_SYSTEM_ARCHITECTURE_V2.md` | System-arkitektur, dataflyt, refresh |
| `docs/15_STRATEGY_PACKS_V2.md` | Strategi-definisjoner |
| `docs/design/*` | UI-kontrakter |
