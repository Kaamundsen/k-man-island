# 24_LIVE_MODE_AND_PAPER_TO_REAL_V2

## Formål
Definere hvordan CORE går fra:
- READONLY → PAPER → LIVE  
på en **kontrollert, reverserbar og trygg** måte.

Dette dokumentet handler kun om **operasjonsmodus**, ikke strategi eller UI.

---

## 1) Operasjonsmoduser (global)
CORE kan kun være i én modus om gangen:

- `READONLY`
- `PAPER`
- `LIVE`

Modus er:
- eksplisitt satt
- logget
- enkel å rulle tilbake

---

## 2) READONLY (første fase)
**Brukes til verifisering**

Kjennetegn:
- CORE kjører daglig pipeline
- Decisions genereres
- **Ingen state endres**
- Ingen trades åpnes/lukkes

Bruk:
- Sammenligne CORE mot faktisk handling
- Avdekke logiske feil
- Validere CORE Brief

**Exit-kriterier READONLY → PAPER**
- CORE Brief stabil ≥ X dager
- Ingen uventede ENTER/EXIT
- Slot-logikk oppfører seg korrekt

---

## 3) PAPER (simulert trading)
**Brukes til trygg testing**

Kjennetegn:
- CORE decisions **oppdaterer paper-state**
- Eget paper-ledger
- Samme logikk som LIVE
- Ingen ekte penger

Reglmerkes tydelig
- Ingen sammenblanding med ekte portefølje
- Paper performance spores separat

**Exit-kriterier PAPER → LIVE**
- Paper performance innen forventet risikobilde
- Ingen regelbrudd (slots, exits)
- Du stoler på CORE Brief

---

## 4) LIVE (ekte CORE)
**Kun CORE trades**

Kjennetegn:
- CORE decisions oppdaterer ekte CORE trades
- Manuell eksekvering eller enkel “apply action”
- Ingen auto-trading i første iterasjon

Regler:
- LIVE gjelder kun CORE
- Strategy Packs forblir READONLY/PAPER
- Maks 3–5 aktive CORE trades alltid

---

## 5) Overgangsregler (kritisk)

### 5.1 READONLY → PAPER
- Ingen kodeendring
- Kun config/flag
- Kan gjøres umiddelbart

### 5.2 PAPER → LIVE
- Krever eksplisitt bekreftelse
- Helst to-stegs:
  - enable LIVE
  - confirm first ENTER

---

## 6) Rollback-strategi
Hvis noe går galt i LIVE:

- Sett modus tilbake til `READONLY`
- Behold siste gyldige CORE  ENTER
- EXIT/MOVE_STOP kun manuelt bekreftet

Rollback skal kunne gjøres:
- uten deploy
- uten kodeendring

---

## 7) Logging & audit
For hver modusendring:
- timestamp
- fra → til
- bruker/system

For hver LIVE-beslutning:
- symbol
- action
- reasons
- score snapshot

---

## 8) Sikkerhetsregler (må aldri brytes)
- CORE i LIVE:
  - aldri mer enn 5 trades
  - aldri ENTER uten hardPass
- Hvis datafeil:
  - fallback til READONLY
- Ingen strategi utenfor CORE kan gå LIVE samtidig

---

## 9) Done-kriterier for 24
24 er ferdig når:
- Alle tre moduser er definert
- Overgangsregler er klare
- Rollback er mulig uten friksjon
- CORE kan brukes trygt i LIVE

---

## SLUTTSTATUS
🎯 **K-man Island V2 veikart komplett (17–24)**  
Systemet er klart for disiplinert bruk, videre iterasjon og produksjon.

