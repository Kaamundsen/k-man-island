# 00_SOURCE_OF_TRUTH.md — K-man Island

Dato: 2026-01-19  
Formål: Hindre dobbelt-system og sikre kontrollert restrukturering.

## A) Canonical kodebase
- `src/` er CANONICAL og er det som skal kjøre i Next appen.
- `k-man-island-inner/` regnes som midlertidig migreringskilde / legacy-kopi og skal ikke være en parallell “app”.
- Nye endringer skal implementeres i `src/`.

## B) Dokumentprioritet (fasit)
- AS-IS docs (00–04) beskriver eksisterende struktur og dagens virkemåte.
- V2 docs (11–17) beskriver målet og restruktureringsplanen.
- Ved konflikt:
  - Struktur/pipeline: følg AS-IS
  - Strategilogikk/score/brief/slots/actions: følg V2

## C) Design er låst
- Følg alle dokumenter i /docs/design.
- Ikke lag nye farger, spacing, radius, shadows eller layout uten å oppdatere kontrakt.
- Ikke lag nye komponent-varianter hvis eksisterende kan brukes.
- Ikke jobb med dark mode nå.

## D) Single Source of Truth for live data
- Det skal finnes ÉN tydelig datapipeline (API → analyse → scodt i aktiv kodepath.
- Navnekollisjoner på funksjoner er forbudt.

## E) Migrering uten kræsj
- Følg 17_MIGRATION_PLAN_V2.md steg-for-steg.
- Dokumentene 18–21 fylles ETTER implementasjon.
- Hvis noe er uklart: velg minste endring som bringer systemet nærmere V2 og fortsett.

## F) Minimum suksesskriterier
1) `/api/stocks` returnerer korrekt antall aksjer (ikke “7”) og har timestamp.
2) “Oppdater nå” regenererer data, analyser og rapport.
3) Dagsrapport fungerer og inkluderer porteføljeanalyse med tips.
4) Strategier bruker riktig score per strategi/pack.

