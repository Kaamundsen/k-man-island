# K-man Island - Aero v1 MVP 🚀

Et moderne investment dashboard for Oslo Børs og US Markets med avansert analyse, trade tracking og Dead Money detection.

![K-man Island](https://img.shields.io/badge/Status-MVP-success)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4+-38bdf8)

## ✨ Funksjoner

### 🎯 Dashboard
- **Beste Muligheter**: Rangert liste av aksjer basert på K-Score
- **Filtrer etter marked**: Oslo Børs eller US Markets
- **Strategi-filter**: Momentum, Buffett, eller Tveitereid
- **Live markedsstatus**: Se når børsen er åpen
- **Sanntids oppdateringer**: K-Score, signaler (BUY/HOLD/SELL)

### 📊 Dyp Analyse
- **Interaktiv priskart**: Med target og stop loss markers
- **Profesjonell handelsplan**: Risk/Reward analyse
- **K-Score tracking**: Visuell fremstilling av score
- **Innsidehandel-sjekk**: Varsler om meldepliktige handler
- **Newsweb integrasjon**: Direkte lenker til nyheter

### 💼 Trade Tracking
- **Legg til trades**: Full logging med alle detaljer
- **Portfolio management**: K-Momentum og Legacy porteføljer
- **Execution tracking**: Stop Loss, Target, Tidshorisont
- **Dead Money detection**: Automatisk varsling

### ⚠️ Dead Money Logic
Systemet identifiserer "dead money" - posisjoner som har brukt >50% av tiden men <50% progresjon til target:
- **Automatisk analyse**: Kjøres på alle aktive trades
- **Visuelle varsler**: Tydelig fargekoding
- **Anbefalinger**: Konkrete forslag til handling
- **Portfolio overview**: Samlet oversikt over alle posisjoner

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **State**: React Server Components + Client Components
- **Deployment**: Vercel (anbefalt)

## 📦 Installasjon

### 1. Klon Repository

```bash
git clone <your-repo-url>
cd k-man-island
```

### 2. Installer Dependencies

```bash
npm install
```

### 3. Sett opp Supabase

Følg instruksjonene i [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

1. Opprett et Supabase prosjekt
2. Kjør SQL schema fra `src/lib/supabase/schema.sql`
3. Kopier API credentials

### 4. Konfigurer Environment Variables

Opprett `.env.local` i root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Start Development Server

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## 📁 Prosjektstruktur

```
k-man-island/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout med Sidebar
│   │   ├── page.tsx                 # Dashboard (hovedside)
│   │   ├── globals.css              # Global styles
│   │   └── analyse/
│   │       └── [ticker]/
│   │           └── page.tsx         # Dyp analyse per aksje
│   │
│   ├── components/                   # React komponenter
│   │   ├── layout/
│   │   │   └── Sidebar.tsx          # Navigasjon
│   │   ├── StockCard.tsx            # Aksje-kort
│   │   ├── FilterBar.tsx            # Market/Strategy filter
│   │   ├── MarketStatus.tsx         # Børsen åpen/stengt
│   │   ├── PriceChart.tsx           # Recharts graf
│   │   ├── TradePlanCard.tsx        # Handelsplan
│   │   ├── NewsWidget.tsx           # Nyheter
│   │   ├── InsiderAlert.tsx         # Innsidehandel
│   │   ├── AddTradeModal.tsx        # Legg til trade
│   │   └── DeadMoneyIndicator.tsx   # Dead Money visning
│   │
│   └── lib/                          # Utilities & Logic
│       ├── types.ts                 # TypeScript interfaces
│       ├── mock-data.ts             # Mock aksjedata
│       ├── supabase/
│       │   ├── client.ts            # Supabase client
│       │   └── schema.sql           # Database schema
│       └── analysis/
│           └── dead-money.ts        # Dead Money algoritme
│
├── public/                           # Statiske filer
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── SUPABASE_SETUP.md
```

## 🎨 Design System

### Fargepalett

```css
/* Primære farger */
--brand-emerald: #10B981     /* Grønn - BUY signal, positive */
--brand-rose: #F43F5E        /* Rød - SELL signal, risiko */
--brand-slate: #1E293B       /* Mørk - Tekst, UI elementer */

/* Overflater */
--surface: #FFFFFF           /* Hvit - Kort, bakgrunn */
--surface-muted: #F8FAFC     /* Lys grå - Body bakgrunn */
--surface-border: #E2E8F0    /* Border - Kort borders */
```

### Typografi

- **Font**: Inter (Google Fonts)
- **Størrelser**: Ekstrabold (800) for headings, Bold (700) for UI

### Komponenter

- **Border Radius**: xl (12px), 2xl (16px), 3xl (24px)
- **Shadows**: Subtile skygger for depth
- **Transitions**: 200ms ease for hover effects

## 📊 Mock Data

Systemet kommer med pre-populated mock data for testing:

- **8 aksjer**: OKEA.OL, VAR.OL, AAPL, SALM.OL, MOWI.OL, EQNR.OL, DNB.OL, NEL.OL
- **K-Scores**: 45-84 (rangert)
- **Signaler**: BUY, HOLD, SELL
- **Strategier**: Momentum, Buffett, Tveitereid

## 🔐 Sikkerhet

### Environment Variables
- **ALDRI** commit `.env.local` til git
- Bruk `.env.local.example` som template
- Hold Supabase API keys private

### Supabase RLS (Row Level Security)
- Implementer RLS policies for produksjon
- Se `schema.sql` for eksempler
- Test grundig før deployment

## 🚀 Deployment

### Vercel (Anbefalt)

1. Push koden til GitHub
2. Importer prosjektet i Vercel
3. Legg til environment variables i Vercel settings
4. Deploy!

```bash
# Eller via CLI
npm install -g vercel
vercel --prod
```

### Andre Platforms

Fungerer på alle plattformer som støtter Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 📈 Fremtidige Forbedringer

### Phase 2 (Post-MVP)
- [ ] **Autentisering**: Supabase Auth for multi-bruker
- [ ] **Push Varslinger**: Browser notifications for price alerts
- [ ] **Real-time Data**: Live aksjekurser via API
- [ ] **Performance Tracking**: Historisk avkastning per strategi
- [ ] **Export**: PDF/CSV eksport av rapporter
- [ ] **Dark Mode**: Mørkt tema
- [ ] **Mobile App**: React Native wrapper

### Phase 3 (Advanced)
- [ ] **AI Analysis**: ML-baserte prediksjoner
- [ ] **Backtesting**: Test strategier historisk
- [ ] **Social**: Del analyser med andre brukere
- [ ] **Webhooks**: Automatiske varsler til Discord/Slack
- [ ] **API**: REST API for eksterne integrasjoner

## 🐛 Feilsøking

### "Failed to fetch" fra Supabase
- Sjekk at `.env.local` er opprettet korrekt
- Restart dev serveren
- Verifiser Supabase credentials

### Typescript errors
```bash
npm run type-check
```

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📝 Lisens

Private - K-man Island © 2026

## 🤝 Bidrag

Dette er et privat MVP-prosjekt. Kontakt eier for tilgang.

## 📞 Support

For spørsmål eller problemer, opprett en issue i repository.

---

**Bygget med ❤️ for norske investorer**
