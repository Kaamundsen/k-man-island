# 00_SYSTEM_AS_IS.md - Systemdokumentasjon

> Dokumentasjon av K-Man Island systemet slik det faktisk fungerer i dag.

## Overordnet Arkitektur

K-Man Island er en Next.js-applikasjon for aksjeanalyse og porteføljestyring. Systemet består av:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Dashboard  │  │  Markedsskanner │  │  Portefølje/Rapport │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API ROUTES (/api)                         │
│  /stocks  /quotes  /analysis  /breakout  /movers  /chart  /news │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ANALYSE ENGINE                              │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │  k-momentum.ts │  │ strategies/    │  │ portfolio-eval  │   │
│  │  (K-Score)     │  │ index.ts       │  │ uation.ts       │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │  Finnhub API   │  │  localStorage  │  │  (Supabase*)    │   │
│  │  (live data)   │  │  (trades/port) │  │  (ikke i bruk)  │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Dataflyt

### 1. API → Analyse → Score → UI

```
Finnhub API → fetchLiveStockData() → analyzeKMomentum() → evaluateAllStrategies()
                    │                       │                      │
                    ▼                       ▼                      ▼
              candle data              K-Score (0-100)       StrategyEvaluations[]
              + quote data           + entry/stop/target    + passed/score per strategi
                                                                   │
                                                                   ▼
                                                            Stock objekt med:
                                                            - kScore
                                                            - signal (BUY/HOLD/SELL)
                                                            - target, stopLoss
                                                            - strategies[]
                                                            - strategyEvaluations[]
```

### 2. Detaljert dataflyt

1. **`/api/stocks` (route.ts)**
   - Kaller `fetchLiveStockData()` fra `stock-data.ts`
   
2. **`stock-data.ts` → `fetchLiveStockData()`**
   - Henter liste over aksjer (hardkodet + fra NYSE/OSE)
   - For hver aksje: henter candle-data og quote fra Finnhub
   - Kaller `analyzeKMomentum()` for K-Score beregning
   - Kaller `evaluateAllStrategies()` for strategi-matching
   - Returnerer `Stock[]` med alle analyse-verdier

3. **Dashboard/UI mottar Stock-objekter**
   - Filterer på marked (OSLO/USA/ALLE)
   - Filterer på strategi
   - Sorterer på composite score (K-Score + RSI + R/R)

## Hva Systemet Gjør

### Gjør:
- ✅ Scanner Oslo Børs og utvalgte US-aksjer for momentum-signaler
- ✅ Beregner K-Score (0-100) basert på tekniske indikatorer
- ✅ Genererer BUY/HOLD/SELL signaler
- ✅ Beregner entry, stop-loss og target automatisk
- ✅ Matcher aksjer mot definerte strategier
- ✅ Lagrer trades lokalt i localStorage
- ✅ Tracker porteføljer med P/L-beregning
- ✅ Genererer daglig rapport med handlingsanbefalinger
- ✅ Bulk-import av trades fra Nordnet
- ✅ Breakout-scanner for mønstergjenkjennelse
- ✅ "Dagens Vinnere" - movers scanner

### Gjør IKKE:
- ❌ Automatisk trading/ordreeksekuering
- ❌ Push-varsler/notifikasjoner (webhook/email er implementert men ikke aktivt)
- ❌ Historisk backtesting av strategier
- ❌ AI/ML-basert prediksjon (kode finnes, men brukes ikke)
- ❌ Supabase-lagring (kun localStorage per nå)
- ❌ Realtids kursoppdatering (krever manuell refresh)
- ❌ Fundamental analyse (P/E, earnings, etc.)
- ❌ Multi-bruker støtte

## Teknisk Stack

| Komponent | Teknologi |
|-----------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| State | React useState/useMemo |
| Lagring | localStorage (via local-store.ts) |
| API | Finnhub (aksjedata) |
| Charts | (ikke implementert fullt ut) |

## Mappestruktur (Relevant)

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   ├── markedsskanner/    # Markedsskanner
│   ├── portefolje/        # Porteføljeoversikt
│   ├── rapport/           # Daglig rapport
│   ├── analyse/[ticker]/  # Aksjedetaljer
│   └── api/               # API routes
├── components/            # React komponenter
├── lib/
│   ├── api/               # API-klienter
│   │   ├── k-momentum.ts  # K-Score motor
│   │   ├── stock-data.ts  # Aksjedata fetching
│   │   └── finnhub.ts     # Finnhub API wrapper
│   ├── strategies/        # Strategidefinisjoner
│   │   └── index.ts       # Alle strategier + evaluatorer
│   ├── store/             # Lokal lagring
│   │   ├── local-store.ts # Trade/Portfolio CRUD
│   │   └── trade-journal.ts # Trade journal
│   ├── analysis/          # Analyse-moduler
│   │   └── portfolio-evaluation.ts
│   └── types.ts           # TypeScript types
```

## Miljøvariabler

```env
FINNHUB_API_KEY=           # Påkrevd for aksjedata
NEXT_PUBLIC_USE_LOCAL_STORE=true  # Alltid true per nå
```

## Kjente Begrensninger

1. **Finnhub Rate Limiting**: Gratis tier har begrensninger, kan feile ved mange aksjer
2. **localStorage**: Data er kun tilgjengelig på én enhet/nettleser
3. **Ingen auth**: Alle som har tilgang til nettleseren kan se/endre data
4. **Manuell refresh**: Kurser oppdateres ikke automatisk
5. **Hardkodede aksjelister**: Må oppdateres manuelt i koden
