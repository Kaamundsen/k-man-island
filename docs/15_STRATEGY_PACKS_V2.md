# STRATEGY_PACKS_V2

## Formål
Strategy Packs er “valgfrie våpen” du kan bruke for:
- læring og sammenligning
- side-porteføljer
- ekstra idéflyt

Men:
> **CORE Engine (TREND/ASYM) er hovedmotoren og skal aldri blandes inn i alt.**

Strategy Packs kan eksistere parallelt uten å forstyrre CORE.

---

## Prinsipp: 3 lag i systemet
### 1) CORE (motoren)
- Maks 3–5 aktive trades
- Strenge regler
- Action Engine + Core Brief

### 2) SATELLITES (systematiske side-strategier)
- Swing, rebound, week-pick osv.
- Egen portefølje og egen rapport
- Kan være 0–N aktive trades

### 3) TRACKERS (følgeporteføljer / eksterne signaler)
- Tveitereid, Buffett, DNB, Delphi, Investtech, Tingvoll
- Helst automatisk import, evt. manuell
- Måles, men “styrer ikke” CORE direkte

---

## Pack 1: SWING_ENGINE (ikke CORE)
**Mål:** stabil swing trading 1–8 uker  
**Typisk gevinst:** 6–15%  
**Win-rate:** middels/høy  
**Stop:** 5–8%

**Kjerne-kriterier (forslag):**
- trend opp (over SMA50)
- positiv 1–3m0

**Output:**
- score 0–100
- ENTRY / STOP / TARGET
- HOLD / EXIT anbefaling

**Portefølje:** `SWING`

---

## Pack 2: DAYTRADER_SCANNER (lek/øv, høy risiko)
**Mål:** 0.5–3% intradag  
**Frekvens:** daglig watchlist (1–5 kandidater)  
**Krever:** volum + volatilitet + stram risiko

**Kjerne-kriterier (forslag):**
- høy relative volume (RVOL)
- tydelig intradag-range / breakout-setup
- spread/liquidity OK
- definert stop (tight)

**Output:**
- “Dagens kandidater”
- 1–2 setups per aksje (breakout / pullback)
- hard stop og invalidation

**Portefølje:** `DAYTRADE (paper først)`

---

## Pack 3: REBOUND (mean reversion)
**Måer  
**Risiko:** høy (dead cat risk)

**Kjerne-kriterier (forslag):**
- RSI lav (men ikke kollaps)
- nylig dump men tegn til stabilisering
- R/R >= 2.5
- helst støtte / volum-mønster

**Output:**
- score 0–100
- “Bounce probability”
- STOP under lows

**Portefølje:** `REBOUND`

---

## Pack 4: WEEK_PICK (Ukens aksje / “ukentlig play”)
**Mål:** 5–15% på 1–3 uker  
**Kilder:** Tingvoll, Investornytt, Investtech, egne notater

**Variant A: manual feed (gratis, raskt)**
- du legger inn ticker + dato + forventning + evt stop/target

**Variant B: semi-auto**
- RSS/nyhetskilder + “manual confirmation”
- loggfør pick og mål

**Output:**
- uke-picks logg
- ytelse vs CORE / SWING

**Portefølje:** `WEEK_PICK`

---

## Pack 5: FOLLOW_PORTFOLIOS (TRACKERS)
### Tveitereid Tracker
**Mål:** speile og lære  
**Input:**
- bjel import
- posisjonsliste over tid

**Output:**
- “nye kjøp / salg”
- performance pr posisjon
- hit-rate og snittretur

### Buffett Tracker
**Mål:** langsiktige quality/holdings  
**Input:** kvartalsvis / sjeldnere
**Output:** langsiktig performance, drawdown, sektoreksponering

### DNB/Delphi/Investtech Tracker
**Mål:** sammenligning, konsensus, læring  
**Input:** månedlig portefølje (evt manuell i starten)
**Output:** ytelse, konsensus-score, “overlapp med CORE”

**Portefølje:** `TRACKERS` (egen seksjon)

---

## Hvordan packs vises i UI (viktig)
### 1) Dashboard viser kun ett “Scoreboard” om gangen
- CORE Board (default)
- SWING Board
- DAYTRADE Board
- REBOUND Board
- TRACKERS Board

Ingen “alt i en suppe”.

### 2) Filtrering endrer ikke motoren
- Filter er visning, ikke logikk

### 3) “ALLE” betyr:
- “vis alt i valgt pack”
- ikke “bland alle packs”

---

## Hva som må være sant (for at dette ikk tab/side og egen rapport
- Satellites har egne boards + egne porteføljer
- Trackers har egen tracker-side + egne imports

---

## Minimum vi bør ha nå
- CORE (TREND/ASYM) ferdig
- SWING pack
- DAYTRADER scanner (paper)
- REBOUND pack
- TRACKERS: Tveitereid + Tingvoll (manual først)

---

## Suksesskriterier
- Du kan sammenligne strategier uten å ødelegge CORE
- Du kan flytte trades mellom strategier/porteføljer uten datatap
- Du får “dagens én ting å gjøre” (Core Brief)
- Du kan utvide med nye packs uten å endre hele systemet

