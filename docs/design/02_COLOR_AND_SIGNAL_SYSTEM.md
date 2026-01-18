# 02_COLOR_AND_SIGNAL_SYSTEM.md - Farge- og Signalkontrakt

> Definerer alle farger brukt i systemet og regler for konsekvent bruk.
> **Ingen nye farger uten å oppdatere dette dokumentet.**

---

## Brand-farger (Primære)

| Navn | Hex | Tailwind | Bruk |
|------|-----|----------|------|
| **Emerald** | `#10B981` | `brand-emerald` | Primær action, positiv, BUY |
| **Emerald Light** | `#D1FAE5` | `brand-emerald-light` | Bakgrunn for positive elementer |
| **Rose** | `#F43F5E` | `brand-rose` | Negativ, tap, SELL |
| **Rose Light** | `#FFE4E6` | `brand-rose-light` | Bakgrunn for negative elementer |
| **Slate** | `#1E293B` | `brand-slate` | Primær tekst, headers |

---

## Surface-farger (Light Mode)

| Navn | Hex | Tailwind | Bruk |
|------|-----|----------|------|
| **Surface** | `#FFFFFF` | `surface` / `bg-surface` | Kort, paneler |
| **Surface Muted** | `#F8FAFC` | `surface-muted` | Hovedbakgrunn |
| **Surface Border** | `#E2E8F0` | `surface-border` | Borders |

---

## Dark Mode-farger

| Navn | Hex | Tailwind | Bruk |
|------|-----|----------|------|
| **Dark BG** | `#0F172A` | `dark-bg` | Hovedbakgrunn |
| **Dark Surface** | `#1E293B` | `dark-surface` | Kort, paneler |
| **Dark Border** | `#334155` | `dark-border` | Borders |
| **Dark Text** | `#E2E8F0` | `dark-text` | Primær tekst |
| **Dark Muted** | `#94A3B8` | `dark-muted` | Sekundær tekst |

---

## Signal-farger

### Trading-signaler

| Signal | Header BG | Badge BG | Tekst | Bruk |
|--------|-----------|----------|-------|------|
| **BUY** | `bg-brand-emerald` | `bg-white/20` | Hvit | Kjøpssignal |
| **HOLD** | `bg-gray-500` | `bg-white/20` | Hvit | Hold/Vent |
| **SELL** | `bg-brand-rose` | `bg-white/20` | Hvit | Salgssignal |

### Eksempel-implementasjon (fra StockCard.tsx):
```typescript
const signalConfig = {
  BUY: { bg: 'bg-brand-emerald', text: 'KJØP', badgeBg: 'bg-white/20' },
  SELL: { bg: 'bg-brand-rose', text: 'SELG', badgeBg: 'bg-white/20' },
  HOLD: { bg: 'bg-gray-500', text: 'HOLD', badgeBg: 'bg-white/20' },
};
```

---

## Rapport-anbefalinger

| Anbefaling | Farge | Emoji | Tekst |
|------------|-------|-------|-------|
| **STRONG_SELL** | `bg-red-600` | 🔴 | SELG NÅ |
| **SELL** | `bg-orange-500` | 🟠 | Selg |
| **HOLD** | `bg-yellow-500` | 🟡 | Hold |
| **BUY** | `bg-green-500` | 🟢 | Kjøp mer |
| **STRONG_BUY** | `bg-green-600` | 🟢 | Kjøp mer |

### Alert-bakgrunner (Rapport)
| Type | Light Mode | Dark Mode |
|------|------------|-----------|
| Critical | `bg-red-50 border-red-200` | `bg-red-900/30 border-red-900` |
| Warning | `bg-orange-50 border-orange-200` | `bg-orange-900/30 border-orange-900` |
| Hold | `bg-yellow-50 border-yellow-200` | `bg-yellow-900/30 border-yellow-900` |
| Positive | `bg-green-50 border-green-200` | `bg-green-900/30 border-green-900` |

---

## K-Score Farger

| Score Range | Farge | Tailwind |
|-------------|-------|----------|
| 75-100 | Grønn | `bg-brand-emerald` |
| 60-74 | Gul | `bg-yellow-500` |
| 0-59 | Grå | `bg-gray-400` |

### Implementasjon:
```typescript
const kScoreColor = stock.kScore >= 75 
  ? 'bg-brand-emerald' 
  : stock.kScore >= 60 
    ? 'bg-yellow-500' 
    : 'bg-gray-400';
```

---

## RSI Indikator-farger

| Tilstand | Farge | Tailwind |
|----------|-------|----------|
| 30-70 (OK) | Grønn | `bg-green-100 text-green-700` |
| <30 eller >70 | Rød | `bg-red-100 text-red-700` |

---

## Pris-endring farger

| Retning | Farge | Tailwind |
|---------|-------|----------|
| Positiv (+) | Emerald | `text-brand-emerald` |
| Negativ (-) | Rose | `text-brand-rose` |

---

## Strategi-farger

Hver strategi har en definert farge i `strategies/index.ts`:

| Strategi | Farge | Hex |
|----------|-------|-----|
| MOMENTUM_TREND | Grønn | `#10B981` |
| MOMENTUM_ASYM | Oransje | `#F59E0B` |
| BUFFETT | Blå | `#3B82F6` |
| TVEITEREID | Lilla | `#8B5CF6` |
| INSIDER | Rosa | `#EC4899` |
| REBOUND | Rød | `#EF4444` |
| DAYTRADER | Oransje | `#F97316` |
| SWING_SHORT | Cyan | `#06B6D4` |
| YOLO | Rød | `#E11D48` |
| FOMO | Gul | `#F59E0B` |
| TIPS | Lilla | `#7C3AED` |
| HODL | Cyan | `#0891B2` |
| DIVIDEND_HUNTER | Grønn | `#059669` |

---

## Breakout Scanner

| Setup | Farge | Gradient |
|-------|-------|----------|
| IMMINENT | Rød/Oransje | `from-red-500 to-orange-500` |
| BUILDING | Gul/Gul | `from-amber-500 to-yellow-500` |
| WATCHING | Blå/Cyan | `from-blue-500 to-cyan-500` |

---

## Info/Status farger

| Type | Light BG | Border | Text |
|------|----------|--------|------|
| Info | `bg-blue-50` | `border-blue-200` | `text-blue-800` |
| Success | `bg-green-50` | `border-green-200` | `text-green-800` |
| Warning | `bg-yellow-50` | `border-yellow-200` | `text-yellow-800` |
| Error | `bg-red-50` | `border-red-200` | `text-red-800` |

---

## Grå-skala (Tekst & Borders)

| Bruk | Light Mode | Dark Mode |
|------|------------|-----------|
| Primær tekst | `text-brand-slate` / `text-gray-900` | `text-dark-text` / `text-gray-100` |
| Sekundær tekst | `text-gray-600` / `text-gray-700` | `text-gray-300` / `text-gray-400` |
| Muted tekst | `text-gray-500` | `text-gray-500` |
| Svak tekst | `text-gray-400` | `text-gray-600` |
| Borders | `border-gray-200` | `border-gray-700` |
| Dividers | `border-gray-100` | `border-gray-700` |

---

## Regler for Fargebruk

### ✅ DO
1. Bruk `brand-emerald` for alle positive handlinger og verdier
2. Bruk `brand-rose` for alle negative handlinger og verdier
3. Bruk `brand-slate` for primær tekst i headers
4. Bruk konsekvent signal-farge på tvers av komponenter
5. Test alle farger i både light og dark mode

### ❌ DON'T
1. Introduser nye grønne/røde nyanser
2. Bruk `green-500` eller `red-500` direkte (bruk brand-varianter)
3. Bruk farger som ikke er definert i dette dokumentet
4. Bruk inline hex-verdier i komponenter

---

## Legge til Nye Farger

For å legge til en ny farge:

1. Dokumenter fargen i dette dokumentet først
2. Legg til i `tailwind.config.ts` under `colors`
3. Legg til dark mode variant hvis nødvendig
4. Oppdater globals.css for dark mode overrides
5. Test i begge modi

**Sist oppdatert:** Januar 2026
