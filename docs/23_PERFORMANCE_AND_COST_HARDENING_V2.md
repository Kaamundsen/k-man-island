# 23_PERFORMANCE_AND_COST_HARDENING_V2

## Formål
Sikre at V2-systemet er:
- raskt
- billig i drift
- deterministisk
- skalerbart nok for daglig bruk (web + mobil)

Ingen nye features. Kun hardening av det som allerede finnes.

---

## 1) Overordnede prinsipper
- CORE kjører **kun daily**
- Samme input → samme output (cachebar)
- UI skal aldri trigge full reanalyse unødvendig
- Kost skal være forutsigbar

---

## 2) Caching-strategi (kritisk)

### 2.1 Market data (daily)
Cache:
- per `(symbol, date)`
- TTL: 24t eller “market close + 1”

Regel:
- CORE_ENGINE leser **kun cache**
- Ingen live-fetch under CORE-run

---

### 2.2 CORE pipeline cache
Cache nivåer:
- CORE_ENGINE output
- SLOT_MANAGER state
- ACTION_ENGINE decisions
- CORE_BRIEF string

Cache key:
- `(asOfDate, coreVersion, universeHash)`

Regel:
- Hvis cache finnes → returner direkte
- Recompute kun ved ny dag eller eksplisitt refresh

---

## 3) API-kall og latency

### 3.1 Backend
- Ett API-kall per CORE-run
- Ett API-kall per board-per-row/per-card kall

### 3.2 UI
- Board-bytt = 0 reanalyse
- Filter/sort = client-side

---

## 4) Kostkontroll (datakilder / infra)
- Yahoo daily data kun én gang per symbol per dag
- Ingen intraday polling
- Ingen “best effort” retries i loop

Fallback:
- Hvis data mangler → PARTIAL_DATA i CORE Brief

---

## 5) Runtime-beskyttelse

### 5.1 Timeouts
- CORE run hard timeout (f.eks. 5–10s)
- Hvis timeout:
  - bruk forrige gyldige CORE state
  - logg event

### 5.2 Fail-safe
- CORE crash → ingen ENTER
- EXIT/MOVE_STOP tillatt kun hvis eksplisitt gyldig

---

## 6) Logging (minimalt, nyttig)
Logg kun:
- CORE run start/stop
- antall symbols
- cache hit/miss
- actions count (ENTER/EXIT)

Ikke:
- per-indikator
- per-can---

## 7) Mobil og UX-hensyn
- CORE Brief skal lastes < 1s
- CORE Board < 2s cold load
- Ingen tunge grafer i CORE default view

---

## 8) Done-kriterier for 23
23 er ferdig når:
- CORE kjører på cached data
- API-kall er forutsigbare og få
- UI er responsivt uten reanalyse
- Kost er lineær og lav

---

## Neste dokument (24)
**24_LIVE_MODE_AND_PAPER_TO_REAL_V2**
- READONLY → PAPER → LIVE
- sikker overgang
- rollback-strategi


