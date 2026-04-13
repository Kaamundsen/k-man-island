# 21_CORE_BRIEF_IMPLEMENTATION_V2

## Status: Implemented
Date: 2026-01-19

## Overview
Documents Core Brief implementation per 14_CORE_BRIEF_V2.md.

---

## File Locations

### V2 Core Brief Renderer
`src/v2/core/core-brief/index.ts`

### Rapport Page (UI)
`src/app/rapport/page.tsx`

---

## V2 Text Renderer

```typescript
export function renderCoreBrief(asOfDate: string, decisions: CoreDecision[]): string {
  const lines: string[] = [];
  lines.push(`# CORE BRIEF — ${asOfDate}`);
  lines.push("");

  const groups: Record<string, CoreDecision[]> = {
    EXIT: [],
    MOVE_STOP: [],
    ENTER: [],
    HOLD: [],
  };

  for (const d of decisions) groups[d.action].push(d);

  const order: Array<keyof typeof groups> = ["EXIT", "MOVE_STOP", "ENTER", "HOLD"];

  for (const key of order) {
    const arr = groups[key];
    if (!arr.length) continue;
    lines.push(`## ${key}`);
    for (const d of arr) {
      const reasons = d.reasons?.length ? ` — ${d.reasons.slice(0, 3).join(", ")}` : "";
      lines.push(`- [${d.action}] ${d.symbol}${reasons}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
```

---

## UI Implementation

### Data Structure

```typescript
interface CoreBriefData {
  asOfDate: string;
  coreStatus: {
    slotsUsed: number;
    maxSlots: number;
    trendCount: number;
    asymCount: number;
    openSlots: number;
  };
  actions: {
    exits: Array<{ ticker: string; reason: string }>;
    moveStops: Array<{ ticker: string; action: string }>;
    enters: Array<{ ticker: string; profile: string; rr: number }>;
    holds: Array<{ ticker: string; note: string }>;
  };
  candidates: Array<{ 
    ticker: string; 
    profile: string; 
    score: number; 
    blockedReason?: string 
  }>;
  riskCheck: {
    maxRiskPerTrade: boolean;
    totalExposure: boolean;
    overtrading: boolean;
  };
}
```

---

## Brief Structure (per V2 spec)

### 1. CORE STATUS
- Slots used / max (e.g., "3 / 5")
- Profile mix (TREND: 2, ASYM: 1)
- Open slots
- New qualified candidates today

### 2. TODAY'S ACTIONS (most important)
Actions in priority order:
- **EXIT** (red) - Stop triggered, target hit
- **MOVE_STOP** (amber) - Risk reduction
- **ENTER** (green) - New positions

If no actions: "Ingen aktive handlinger i dag."

### 3. HOLD OVERVIEW
Trades with no action needed:
- Ticker + note ("God fremgang" / "Plan intakt")

### 4. NEW CANDIDATES
Stocks that qualify for CORE but can't enter:
- Blocked reason if slots full

### 5. RISK & DISCIPLINE CHECK
Three checkmarks:
- Max risk per trade: OK/Warning
- Total exposure: OK/Warning  
- Overtrading: OK/Warning

### 6. DAILY MANTRA
> "I dag skal jeg kun gjøre det Core Brief sier."

---

## Visual Design

```jsx
// Core Brief Section (emerald theme)
<div className="bg-gradient-to-br from-emerald-900 to-emerald-950">
  {/* Header with slot indicator */}
  <span className="bg-emerald-800 text-emerald-200 rounded-full">
    {slotsUsed} / {maxSlots} slots
  </span>
  
  {/* Status grid */}
  <div className="grid grid-cols-4 gap-4">
    <div>Aktive slots</div>
    <div className="text-emerald-400">TREND</div>
    <div className="text-amber-400">ASYM</div>
    <div>Ledige</div>
  </div>
  
  {/* Actions with color coding */}
  <div className="bg-red-900/30">EXIT</div>
  <div className="bg-amber-900/30">MOVE STOP</div>
  <div className="bg-emerald-900/30">ENTER</div>
</div>
```

---

## Action Labels (V2 compliant)

| Old Label | New Label | Color |
|-----------|-----------|-------|
| STRONG_SELL | EXIT | Red |
| SELL | EXIT | Red |
| - | MOVE_STOP | Amber |
| BUY, STRONG_BUY | ENTER | Green |
| HOLD | HOLD | Yellow |

---

## Slot Manager Integration

```typescript
const maxSlots = getMaxCoreSlots(); // 5

// Over-slot warning
{summary.totalTrades > maxSlots && (
  <div className="bg-amber-50 border border-amber-200">
    Over CORE-grense: {totalTrades} trades aktive, 
    maks {maxSlots} anbefalt
  </div>
)}
```

---

## Key Principles (from 14_CORE_BRIEF_V2.md)

1. **Readable in 30-60 seconds**
2. **Actions only, no analysis**
3. **Never contradicts Action Engine**
4. **Max 1-2 ENTER per day**
5. **No news, graphs, or "maybe"**

---

## Portfolio Review Section

Below Core Brief, the rapport shows:
- Quick summary cards (trades, P/L, action count, win rate)
- Slot warning if over limit
- Recommendation breakdown

Actions are labeled with V2 terminology:
- EXIT (was SELL)
- ENTER (was BUY)
- HOLD (unchanged)
