# DATA_AND_API_REQUIREMENTS_V2

## Formål
Låse hvilke data systemet trenger for å:
- kjøre CORE-motoren (TREND/ASYM) stabilt og raskt
- støtte Strategy Packs (swing/daytrade/rebound/trackers) uten å blande alt
- minimere kostnad, latency og kompleksitet

Dette dokumentet definerer:
1) Datakrav per modul
2) Datakilder (gratis først)
3) Automatisering vs manuell input
4) Caching, oppdateringsfrekvens og ytelse
5) “Cost guardrails” (anti-token / anti-slow)

---

## 1. Datakategorier

### A) Markedsdata (pris/volum)
- OHLC (Open, High, Low, Close)
- Volume
- Return-beregninger (1d, 1w, 1m, 3m, 6m, 12m)
- 52w high/low
- (Valgfritt) intradag: 1m/5m candles

### B) Tekniske derived metrics
- SMA20 / SMA50 / SMA200
- RSI(14) (helst ekte fra historikk, ikke “estimert fra endring”)
- ATR(14) eller “avg daily move” som proxy
- RVOL (relative volume) for daytrade

### C) Fundamental data (valgfritt for CORE, nyttig for packs)
- Market cap
- P/E, P/B
- Dividend yield
- Sector / industry

### D) Eventst i v1, nyttig etterpå)
- Earnings dates
- Insider buys (Newsweb / Euronext / etc)
- Corporate actions (utbytte/ split)

### E) Nyheter (kun metadata)
- Headline + timestamp + source + ticker mapping
- (IKKE fulltekst / paywall scraping)

### F) Eksterne signaler / picks (trackers)
- Tveitereid holdings (bjellesauer → manuell/semiauto)
- Buffett holdings (periodisk)
- DNB/Delphi/Pareto (månedlig)
- Investtech picks (ukentlig/daglig) – ofte manuell input i starten
- Tingvoll / “Ukens aksje” (manuell input)

### G) Portefølje- og trade-data (din sannhet)
- Trades: ticker, entry, size, date, stop, target, strategyId, portfolioId
- Status: open/closed, pnl, notes, tags
- Historikk: actions fra Action Engine (ENTER/HOLD/MOVE_STOP/EXIT)

---

## 2. Datakrav per modul

### CORE Engine (TREND/ASYM) – MUST HAVE
Minimum for at CORE skal værily OHLC + volume (min 1 år, helst 2 år for robust)
- SMA50 og SMA200 (for trend filter)
- Return 1m/3m/6m (momentum)
- RSI(14) fra historikk
- ATR(14) eller avg daily move (stop/target og risk)
- 52w high/low (for range/position)
- Market hours / market open-close logic (for caching)

CORE skal IKKE kreve:
- nyheter
- fundamentals
- insider data
- earnings
- trackers

Disse kan komme senere uten å endre motorens grunnlogikk.

---

### Action Engine / Core Brief – MUST HAVE
- trade snapshot (entry/stop/target/current price)
- CoreScore + ΔCoreScore
- R-multiple (unrealized)
- signal “breach events” (stop hit, target hit)

---

### Strategy Packs – NICE TO HAVE (kan starte enkelt)

#### SWING Pack
- Daily OHLC + SMA50 + RSI + ATR
- Enkle patterns kan komme senere

#### REBOUND Pack
- RSI + range position + recent drawdown
- (Valgfritt) volume spike / capitulation proxy

#### DAYTRADER Pack (paper først)
- Intraday candles (1m/5m) + volume
- RVOL (relative volume) baseline
- Spread/liquidity proxengelig)
NB: Dette er den dyreste datatypen. Hold det som “sandbox” først.

#### TRACKERS
- Kun holdings/picks + timestamps
- Ikke krav om live pris for å “få inn i systemet”
- Performance kan beregnes med daily close når du vil

---

## 3. Datakilder (gratis først)

### Primary (gratis / lav friksjon)
- Yahoo Finance (quote + chart) for:
  - daily price/volume
  - 52w high/low
  - noen fundamentals (varierer)
Fordeler: gratis, raskt
Ulemper: kan rate-limites, varierer på fundamentals/sector

- RSS (E24/DN/Finansavisen/Newsweb lenker)
Fordeler: gratis headlines
Ulemper: paywall fulltekst

### Optional (betalt / mer robust)traday/quotes) – kun hvis nødvendig
- Andre dataleverandører senere

### Manuell (bevisst, i v1)
- Investtech picks (fra E24/Investtech) – logg i systemet
- Tingvoll / Ukens aksje – logg i systemet
- DNB/Delphi/Pareto – månedlig import (JSON/CSV)
- Tveitereid – holdings via bjellesauer (delay ok)

---

## 4. Automatisering vs manuell input

### MUST be automatic (for CORE)
- Daily prices/volume
- SMA/RSI/ATR/returns
- CoreScore + Action Engine

### OK å være manuell i starten (lav frekvens, høy verdi)
- Trackers holdings/picks
- Week picks
- Investtech “dagens/ukens” tips
- Analysthus portfolios (månedlig)

Designregel:
> Manuelle inputs skal være 5–60 sek arbeid, ikke en prosess.

---

## 5. Oppdateringsfrekvens

### CORE (daily)
- Oppdater 1 gang per dag (før børs), pluss valgfritt “refresh” i åpningstid
- CORE trenger ikke tick-by-tick

### Dashboard
- UI skal ikke trigge “full recalc”
- Filter/sortering skal være client-side på allerede lastet data

### Daytrade pack data når du faktisk åpner Daytrade-view

---

## 6. Caching & ytelse (hard rules)

### Server-side caching
- Daily quotes: TTL 5–15 min i market hours
- Outside market: TTL 1–6 timer (eller “til neste børsåpning”)
- Historical analysis per ticker: TTL 6–24 timer

### Precompute vs on-demand
- Precompute CORE metrics (korte watchlists)
- On-demand for deep pages (single ticker analysis)

### UI-performance rules
- Bytte filter = 0 API calls
- Sidebytte skal ikke gjøre full reload av alt
- Inkrementell loading (Suspense) OK, men unngå tung refetch

---

## 7. Minimum Viable Data (MVD) – startpakke

For å trade CORE med ekte disiplin trenger vi kun:
- Watchlist tickers (20–40)
- Daily OHLC + volume (min 1–2 år historikk)
- RSI/SMA/ATR/returns
- CoreScore og Action Engine output
- Portfolio/trade logging

Alt annet (nyheter, trackers, analysthus, ML) er sekundært.

---

## 8. Cost guardrails (anti-Opus / anti-token)

Regler for utviklingsflyt:
- Bruk AI til: logikk/kontrakter/design aveditor til: filer, flytting, struktur
- Ingen “analyser hele prosjektet på nytt”-prompter
- Små endringer: send kun relevante filer/snutter, ikke hele repo
- Ikke la agent “refaktorere alt” uten et diff-budsjett og stoppunkt

---

## 9. Konsekvens for dagens kodebase (kort)
- Hold CORE dataflyt minimal og cached
- Daytrade og Trackers må være “opt-in” for å unngå treghet/kost
- Ikke bland CORE ranking med “alle strategier samlet”

---

## Sign-off
Når dette dokumentet er godkjent, skal all videre kodeendring følge:
- CORE-motorens kontrakter (11–14)
- Strategy pack strukturen (15)
- Datakrav og caching-reglene (16)

