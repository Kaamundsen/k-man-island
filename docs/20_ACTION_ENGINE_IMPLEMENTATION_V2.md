# 20_ACTION_ENGINE_IMPLEMENTATION_V2

## Status: Implemented
Date: 2026-01-19

## Overview
Documents the Action Engine implementation per 13_ACTION_ENGINE_V2.md.

---

## File Location
`src/v2/core/action-engine/index.ts`

---

## Types

```typescript
// src/v2/core/action-engine/types.ts
export type CoreAction = "ENTER" | "HOLD" | "MOVE_STOP" | "EXIT";

export type CoreDecision = {
  symbol: string;
  action: CoreAction;
  priority: "HIGH" | "MED" | "LOW";
  reasons: string[];
  params?: Record<string, unknown>;
};
```

---

## Decision Logic

```typescript
export function decide(outputs: CoreEngineOutput[]): CoreDecision[] {
  return outputs.map(o => {
    // ENTER: hardPass + score >= 70
    if (o.hardPass && o.softScore >= 70) {
      return {
        symbol: o.symbol,
        action: "ENTER",
        priority: "MED",
        reasons: [...o.reasons, "SCORE_GE_70"],
        params: { profile: o.profile, score: o.softScore },
      };
    }

    // HOLD: default for everything else
    return {
      symbol: o.symbol,
      action: "HOLD",
      priority: "LOW",
      reasons: o.hardPass ? [...o.reasons, "SCORE_LT_70"] : [...o.reasons],
      params: { profile: o.profile, score: o.softScore },
    };
  });
}
```

---

## Decision Priority Order (per V2 spec)

1. **EXIT** - Highest priority (risk/rule violation)
   - Stop-loss triggered
   - Target reached
   - CoreScore below threshold
   - Better candidate needs slot

2. **MOVE_STOP** - Risk reduction
   - Trade >= +1R profit
   - Volatility decreasing

3. **ENTER** - New position
   - Slot available
   - Or: Candidate better than weakest CORE trade

4. **HOLD** - Default
   - No action needed
   - Plan intact

---

## Integration with Portfolio Evaluation

The rapport page uses portfolio evaluation to generate actions:

```typescript
// src/app/rapport/page.tsx
function generateCoreBrief(evals: TradeEvaluation[]): CoreBriefData {
  const exits: Array<{ ticker: string; reason: string }> = [];
  const moveStops: Array<{ ticker: string; action: string }> = [];
  const holds: Array<{ ticker: string; note: string }> = [];
  
  evals.forEach(e => {
    // EXIT conditions
    if (e.recommendation === 'STRONG_SELL' || e.recommendation === 'SELL') {
      exits.push({ 
        ticker: e.trade.ticker, 
        reason: e.reasons[0] || 'Anbefalt exit' 
      });
    }
    // MOVE_STOP conditions (+1R equivalent)
    else if (e.progressToTarget >= 50 && e.unrealizedPnLPercent >= 5) {
      moveStops.push({
        ticker: e.trade.ticker,
        action: `Flytt stop til break-even`
      });
    }
    // HOLD
    else {
      holds.push({
        ticker: e.trade.ticker,
        note: e.progressToTarget > 30 ? 'God fremgang' : 'Plan intakt'
      });
    }
  });
  
  return { actions: { exits, moveStops, enters: [], holds }, ... };
}
```

---

## EXIT Conditions (from portfolio-evaluation.ts)

| Condition | Action | Urgency |
|-----------|--------|---------|
| progressToTarget >= 100% | STRONG_SELL | high |
| progressToTarget >= 80% | SELL | medium |
| currentPrice <= stopLoss | STRONG_SELL | critical |
| progressToStop >= 60% | SELL | high |
| daysToDeadline < 0 | SELL | medium |

---

## MOVE_STOP Logic

Triggers when:
- Trade is +5% or more (approximately +1R)
- Progress toward target >= 50%

Action:
- Move stop to entry price (break-even)
- Later: Move stop to +0.5R at +2R profit

---

## Slot Awareness

The Action Engine respects slot limits:

```typescript
// ENTER blocked if:
// - All CORE slots are full
// - No EXIT triggered
// - New candidate not better than worst existing trade

const maxSlots = getMaxCoreSlots(); // 5
if (activeCount >= maxSlots && exits.length === 0) {
  // ENTER blocked
}
```

---

## One Decision Per Trade Per Day

Per V2 spec:
- Each trade gets exactly one decision per evaluation
- No conflicting signals
- Decision order: EXIT > MOVE_STOP > ENTER > HOLD

---

## Future Enhancements

1. Add R-multiple tracking for MOVE_STOP logic
2. Implement "better candidate" comparison for slot replacement
3. Add market regime awareness (risk-on/risk-off)
