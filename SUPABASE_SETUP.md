# Supabase Setup Guide

Denne guiden vil hjelpe deg med å sette opp Supabase for K-man Island.

## Steg 1: Opprett Supabase Prosjekt

1. Gå til [Supabase](https://supabase.com)
2. Logg inn eller opprett en konto
3. Klikk på "New Project"
4. Velg organisasjon og gi prosjektet et navn (f.eks. "k-man-island")
5. Velg et sterkt passord for databasen
6. Velg region (velg nærmeste, f.eks. "Europe West (London)")
7. Klikk "Create new project"

## Steg 2: Kjør Database Schema

1. I Supabase dashboard, gå til "SQL Editor" (i venstre meny)
2. Klikk "+ New query"
3. Kopier innholdet fra `src/lib/supabase/schema.sql`
4. Lim inn i SQL editoren
5. Klikk "Run" eller trykk `Ctrl/Cmd + Enter`
6. Bekreft at tabellene er opprettet ved å gå til "Table Editor"

Du skal nå se følgende tabeller:
- `portfolios` - For å lagre ulike porteføljer
- `trades` - For å lagre trades/handler

## Steg 3: Konfigurer Environment Variables

1. I Supabase dashboard, gå til "Settings" > "API"
2. Kopier "Project URL" og "anon public" API key
3. I prosjektroten, opprett en fil kalt `.env.local`
4. Lim inn følgende (erstatt med dine verdier):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

5. Restart dev serveren (`npm run dev`)

## Steg 4: Test Tilkoblingen

Når serveren kjører, prøv å legge til en trade via applikasjonen. 
Gå til Supabase Table Editor og sjekk at dataen ble lagret korrekt.

## Steg 5: (Valgfritt) Sett opp Row Level Security

Hvis du vil legge til autentisering senere:

1. I SQL Editor, kjør:
```sql
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Lag policies basert på dine behov
CREATE POLICY "Enable read access for authenticated users" 
ON portfolios FOR SELECT 
TO authenticated 
USING (true);

-- Gjenta for trades-tabellen
```

## Feilsøking

### "Failed to fetch" feil
- Sjekk at `.env.local` filen er opprettet korrekt
- Bekreft at du har restartet dev serveren
- Sjekk at Supabase project URL og API key er korrekte

### "Permission denied" feil
- Sjekk RLS policies i Supabase
- For utvikling, kan du midlertidig disable RLS eller lage en åpen policy

## Neste Steg

Når Supabase er satt opp, kan du:
- Legge til trades via AddTradeModal
- Se portfolios i Dashboard
- Tracke Dead Money warnings automatisk
