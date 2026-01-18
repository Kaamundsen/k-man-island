# 05_LAYOUTS_MOBILE_CONTRACT.md - Mobil Layout Kontrakt

> Kontrakt for mobil-visning (IKKE implementert ennå).
> **Mobil er primært for OVERVÅKING, ikke administrasjon.**

---

## Mobil-filosofi

### Primære Use Cases
1. **Sjekke status** - Rask oversikt over portefølje
2. **Alerts** - Se kritiske varsler
3. **Pris-sjekk** - Sjekke enkeltaksjer
4. **Signal-sjekk** - Se BUY/SELL signaler

### IKKE primære use cases
- Trade-registrering (bruk desktop)
- Bulk-import (bruk desktop)
- Detaljert analyse (bruk desktop)
- Konfigurasjon (bruk desktop)

---

## Nåværende Tilstand

**Mobil er IKKE optimalisert per januar 2026.**

Kjente problemer:
- Sidebar tar hele skjermen
- Ingen responsive breakpoints under 768px
- Modaler er for brede
- Tabeller er ikke scrollbare

---

## Planlagt Mobil-layout

### Global Struktur

```
┌─────────────────┐
│  HEADER         │
│  Logo + ☰ Menu  │
├─────────────────┤
│                 │
│  MAIN CONTENT   │
│  (single column)│
│                 │
│                 │
│                 │
├─────────────────┤
│  BOTTOM NAV     │
│  🏠 📊 📋 ⚙️    │
└─────────────────┘
```

### Navigasjon

**Bottom Navigation (maks 4 items):**
1. 🏠 Dashboard
2. 📊 Portefølje
3. 📋 Rapport
4. ⚙️ Mer (åpner meny)

**Hamburger-meny (☰):**
- Alle andre sider
- Innstillinger
- Theme toggle

---

## Mobil Dashboard

```
┌─────────────────┐
│ K-man Island ☰  │
├─────────────────┤
│ 🟢 Børsen Åpen  │
├─────────────────┤
│ ┌─────────────┐ │
│ │ P/L Oversikt │ │
│ │ +12,500 kr   │ │
│ └─────────────┘ │
├─────────────────┤
│ 🔴 2 Alerts     │
│ → Se detaljer   │
├─────────────────┤
│ Topp 3 Aksjer   │
│ ┌─────────────┐ │
│ │ #1 NHY  BUY │ │
│ │ 85.50 +2.3% │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ #2 EQNR    │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ #3 DNB     │ │
│ └─────────────┘ │
├─────────────────┤
│ 🏠 📊 📋 ⚙️    │
└─────────────────┘
```

### Mobil-spesifikke Regler

1. **Én kolonne** - Aldri side-by-side på mobil
2. **Kort først** - Viktigst øverst
3. **Touch-targets** - Minimum 44x44px
4. **Swipe** - Ikke bruk swipe-actions (forvirrende)
5. **Scroll** - Infinite scroll er OK, pagination er IKKE OK

---

## Mobil Portefølje

```
┌─────────────────┐
│ Portefølje    ☰ │
├─────────────────┤
│ Total: 162,500  │
│ P/L: +8.3%      │
├─────────────────┤
│ [Aktive] [Hist] │
├─────────────────┤
│ ┌─────────────┐ │
│ │ NHY.OL      │ │
│ │ 120 @ 81.88 │ │
│ │ +5.2%  📈   │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ EQNR.OL     │ │
│ │ 50 @ 280.00 │ │
│ │ -2.1%  📉   │ │
│ └─────────────┘ │
├─────────────────┤
│ 🏠 📊 📋 ⚙️    │
└─────────────────┘
```

---

## Mobil Rapport

```
┌─────────────────┐
│ Rapport       ☰ │
├─────────────────┤
│ 13. jan 2026    │
├─────────────────┤
│ ⚠️ 2 Krever     │
│    handling     │
│ [Se detaljer →] │
├─────────────────┤
│ Oppsummering    │
│ • Active: 5     │
│ • P/L: +8.3%    │
│ • Win: 67%      │
├─────────────────┤
│ [Expand rapport]│
├─────────────────┤
│ 🏠 📊 📋 ⚙️    │
└─────────────────┘
```

---

## Forbudt på Mobil

### 1. Komplekse Handlinger
❌ Trade-registrering med alle felt
❌ Bulk-import
❌ Strategi-konfigurasjon

### 2. Layout
❌ Multi-kolonne grids
❌ Side-by-side sammenligning
❌ Modale dialoger > 80vh
❌ Horizontale scroll-tabeller

### 3. Interaksjon
❌ Hover-baserte tooltips
❌ Drag-and-drop
❌ Context-menyer (høyreklikk)
❌ Double-tap for action

---

## Tillatt på Mobil

### 1. Visning
✅ P/L oversikt
✅ Aktive trades (liste)
✅ Alerts og varsler
✅ Signal-status per aksje
✅ K-Score (forenklet)

### 2. Enkel Interaksjon
✅ Tap for detaljer
✅ Pull-to-refresh
✅ Collapse/expand seksjoner
✅ Bottom sheet for valg

### 3. Navigasjon
✅ Bottom navigation
✅ Hamburger-meny
✅ Back-knapp

---

## Breakpoints

| Breakpoint | Verdi | Handling |
|------------|-------|----------|
| < 640px | Mobil | Én kolonne, bottom nav |
| 640-767px | Tablet-portrait | Én kolonne, sidebar collapse |
| 768-1023px | Tablet-landscape | 2 kolonner, sidebar visible |
| ≥ 1024px | Desktop | Full layout |

---

## Viewport Meta

Allerede konfigurert i `layout.tsx`:

```typescript
export const viewport: Viewport = {
  themeColor: '#10B981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
```

---

## PWA-støtte

Manifest er konfigurert i `/public/manifest.json`.

### Mobil-app atferd:
- Standalone modus (ingen browser chrome)
- Theme-farge: `#10B981` (emerald)
- Ikon: 192x192 og 512x512

---

## Implementasjons-prioritet

Når mobil skal implementeres:

1. **Fase 1:** Bottom navigation + hamburger
2. **Fase 2:** Dashboard mobil-view
3. **Fase 3:** Portefølje mobil-view
4. **Fase 4:** Rapport mobil-view
5. **Fase 5:** Aksje-detalj forenklet

---

**Sist oppdatert:** Januar 2026
**Status:** KONTRAKT (ikke implementert)
