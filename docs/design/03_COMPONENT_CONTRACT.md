# 03_COMPONENT_CONTRACT.md - Komponentkontrakt

> Definerer formål, tillatte props og states for hver komponent.
> **Forbyr komponent-eksplosjon og CSS-hacking.**

---

## Komponent-prinsipper

1. **Single Responsibility**: Én komponent = én oppgave
2. **Props over State**: Foretrekk props for data, state for UI
3. **Konsekvent navngivning**: `<ComponentName>` i PascalCase
4. **Max 200 linjer**: Del opp større komponenter
5. **Ingen inline styles**: Bruk Tailwind eller `clsx`

---

## Layout-komponenter

### `Sidebar`
**Fil:** `src/components/layout/Sidebar.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Fast sidebar-navigasjon for hele applikasjonen |
| **Props** | Ingen |
| **State** | `goalExpanded`, `isDark` (via useTheme) |
| **Bredde** | Fast `w-72` (288px) |
| **Posisjon** | `fixed left-0 top-0 h-screen` |

**IKKE bruk til:**
- Dynamisk innhold
- Kontekstuell navigasjon
- Modale elementer

---

## Kort-komponenter

### `StockCard`
**Fil:** `src/components/StockCard.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Vise aksje-sammendrag med signal og K-Score |
| **Props** | `stock: Stock`, `rank?: number` |
| **States** | Ingen (stateless) |
| **Link** | Hele kortet er klikkbart → `/analyse/[ticker]` |

**Tillatte props:**
```typescript
interface StockCardProps {
  stock: Stock;     // Påkrevd
  rank?: number;    // Valgfri rangeringstall
}
```

**IKKE bruk til:**
- Detaljert analyse
- Interaktive handlinger (kjøp/selg)
- Redigerbare felt

---

### `StockCardOriginal`
**Fil:** `src/components/StockCardOriginal.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Alternativt kort-design (hvit header) |
| **Props** | Identisk med `StockCard` |
| **Bruk** | Toggle via design-switch i Dashboard |

---

## Filter-komponenter

### `FilterBar`
**Fil:** `src/components/FilterBar.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Marked- og strategifiltrering |
| **Props** | `onMarketChange`, `onStrategyChange` (callbacks) |
| **State** | `selectedMarket`, `selectedStrategy` |

**Tillatte props:**
```typescript
interface FilterBarProps {
  onMarketChange: (market: MarketFilter) => void;
  onStrategyChange: (strategy: StrategyFilter) => void;
}
```

**IKKE bruk til:**
- Søkefelt (bruk dedikert SearchInput)
- Sorteringsvalg
- Flere enn 2 filterdimensjoner

---

## Widget-komponenter

### `MarketStatus`
**Fil:** `src/components/MarketStatus.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Vise om Oslo Børs er åpen/stengt |
| **Props** | Ingen |
| **State** | `isOpen` (beregnes fra tid) |
| **Auto-update** | Hvert minutt |

**Tillatte brukssteder:**
- Dashboard header
- Rapport header

**IKKE bruk til:**
- Andre markeder (US, etc.)
- Detaljert børsinformasjon

---

### `NewsWidget`
**Fil:** `src/components/NewsWidget.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Vise nyheter for én aksje |
| **Props** | `ticker: string` |
| **State** | `news[]`, `loading`, `error` |
| **API** | Henter fra `/api/news/[ticker]` |

**Tillatte props:**
```typescript
interface NewsWidgetProps {
  ticker: string;  // F.eks. "NHY.OL"
}
```

**IKKE bruk til:**
- Aggregerte nyheter (flere aksjer)
- Markedsoppsummeringer

---

### `NewsAggregator`
**Fil:** `src/components/NewsAggregator.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Aggregerte nyheter på tvers av kilder |
| **Props** | `compact?: boolean`, `maxItems?: number`, `showLinks?: boolean` |

---

### `EarningsCalendar`
**Fil:** `src/components/EarningsCalendar.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Kommende kvartalsrapporter |
| **Props** | Ingen |

---

### `AnalystConsensusWidget`
**Fil:** `src/components/AnalystConsensusWidget.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Vise analytiker-konsensus |
| **Props** | Ingen |

---

## Modal-komponenter

### `AddTradeModal`
**Fil:** `src/components/AddTradeModal.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Legge til / redigere en trade |
| **Props** | `isOpen`, `onClose`, `onSuccess?`, `editTrade?`, `prefilledData?` |
| **State** | Kompleks form-state |
| **Bredde** | `max-w-2xl` |

**Tillatte props:**
```typescript
interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editTrade?: Trade | null;
  prefilledData?: PrefilledTradeData | null;
}
```

**IKKE bruk til:**
- Bulk-operasjoner (bruk BulkImportModal)
- Visning av trade-detaljer (bruk egen side)

---

### `BulkImportModal`
**Fil:** `src/components/BulkImportModal.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Masseimport av trades/utbytte fra Nordnet |
| **Props** | `isOpen`, `onClose`, `onSuccess?` |
| **Bredde** | `max-w-4xl` |

**IKKE bruk til:**
- Enkelttransaksjoner
- Andre formater enn Nordnet

---

## Content-komponenter

### `DashboardContent`
**Fil:** `src/components/DashboardContent.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Hovedinnholdet på dashboard-siden |
| **Props** | `initialStocks: Stock[]` |
| **State** | Filtre, view mode, refresh |

**IKKE bruk til:**
- Gjenbruk i andre sider
- Embedding i modaler

---

### `MarkedsskannerContent`
**Fil:** `src/components/MarkedsskannerContent.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Hovedinnholdet i markedsskanner |
| **Props** | `stocks: Stock[]` |
| **State** | Tab-valg, sortering, søk |

---

### `StockAnalyseContent`
**Fil:** `src/components/StockAnalyseContent.tsx`

| Aspekt | Beskrivelse |
|--------|-------------|
| **Formål** | Detaljert aksjeanalyse |
| **Props** | Aksjedata fra page |

---

## Forbudt

### 1. Komponent-eksplosjon
❌ Ikke lag nye komponenter for:
- Enkel layout-variasjon
- Én-gangs bruk
- "Wrapper" uten logikk

### 2. CSS-hacking
❌ Ikke bruk:
- `!important` i komponenter
- Inline `style={{ }}` for layout
- Overskrivende CSS i komponent-filer

### 3. Prop-drilling > 2 nivåer
❌ Hvis data må gjennom 3+ komponenter, refaktorer til:
- Context
- Store
- Page-level fetching

### 4. State i presentasjons-komponenter
❌ Komponenter som kun viser data skal være stateless:
- `StockCard` ✅ Stateless
- `FilterBar` ❌ Har state (OK fordi interaktiv)

---

## Lage Nye Komponenter

Før du lager en ny komponent, sjekk:

1. [ ] Finnes lignende komponent allerede?
2. [ ] Kan eksisterende komponent utvides med props?
3. [ ] Er komponenten gjenbrukbar (brukes 2+ steder)?
4. [ ] Følger den Single Responsibility prinsippet?
5. [ ] Er den under 200 linjer?

Hvis ja på alle → lag komponenten med dokumentasjon i dette dokumentet.

---

**Sist oppdatert:** Januar 2026
