# 01_DESIGN_RULES_CONTRACT.md - UI-kontrakt

> Kontrakt for videre UI-utvikling basert på eksisterende design.
> **ALLE nye UI-endringer MÅ følge denne kontrakten.**

---

## Felles UI-prinsipper

### 1. Rundhet & Mykhet
- Bruker avrundede hjørner gjennomgående
- Unngår skarpe kanter og harde linjer
- Kort og paneler har "soft" utseende

### 2. Hvit/Lys Bakgrunn (Light Mode)
- Hovedbakgrunn: `#F8FAFC` (surface-muted)
- Kort/paneler: `#FFFFFF` (surface)
- Ingen mørkegrå bakgrunner i light mode

### 3. Mørk Marineblå (Dark Mode)
- Hovedbakgrunn: `#0F172A` (slate-900)
- Kort/paneler: `#1E293B` (slate-800)
- Borders: `#334155` (slate-700)

### 4. Konsekvent Spacing
- Bruker Tailwind spacing scale (4, 6, 8, etc.)
- Standard padding i kort: `p-6`
- Standard gap mellom elementer: `gap-4` eller `gap-6`

### 5. Hierarki via Størrelse & Vekt
- Viktige tall: `text-2xl` eller `text-3xl`, `font-extrabold`
- Sekundær info: `text-sm`, `font-medium`
- Labels: `text-xs`, `uppercase`, `tracking-wide`

---

## Typografi-hierarki

| Element | Klasser | Eksempel |
|---------|---------|----------|
| **H1 (Sidetittel)** | `text-4xl font-extrabold text-brand-slate tracking-tight` | Dashboard |
| **H2 (Seksjon)** | `text-2xl font-bold text-brand-slate` | Topp 3 Rangert |
| **H3 (Kort-tittel)** | `text-xl font-bold text-brand-slate` | Siste Nyheter |
| **H4 (Sub-header)** | `text-lg font-semibold text-gray-700` | Execution Tracking |
| **Body** | `text-sm text-gray-600` | Normal tekst |
| **Label** | `text-xs text-gray-500 uppercase tracking-wide font-semibold` | K-SCORE, RSI |
| **Big Number** | `text-3xl font-extrabold text-brand-slate` | 85, 156.50 kr |
| **Small Number** | `text-lg font-bold` | +2.5% |

### Font
- Primær: `Inter` (importert fra Google Fonts)
- Fallback: `system-ui, sans-serif`
- Font weights brukt: 400, 500, 600, 700, 800

---

## Spacing Standard

| Context | Verdi | Tailwind |
|---------|-------|----------|
| Kort padding | 24px | `p-6` |
| Seksjon spacing | 32px | `mb-8` |
| Element gap (horisontal) | 16px | `gap-4` |
| Element gap (vertikal) | 24px | `space-y-6` |
| Knapp padding | 12px 20px | `px-5 py-2.5` |
| Input padding | 12px 16px | `px-4 py-3` |

---

## Border Radius

| Element | Verdi | Tailwind |
|---------|-------|----------|
| Store kort/paneler | 24px | `rounded-3xl` |
| Mindre kort/widgets | 16px | `rounded-2xl` |
| Knapper | 12px | `rounded-xl` |
| Badges/tags | 8px | `rounded-lg` |
| Progress bars | Full | `rounded-full` |

---

## Shadows

| Context | Klasse |
|---------|--------|
| Kort (default) | `shadow-card` (definert i Tailwind config) |
| Kort (hover) | `shadow-card-hover` |
| Aktive knapper | `shadow-md` |
| Dropdown/modaler | Standard Tailwind `shadow-lg` eller `shadow-xl` |

**Regel:** Shadows brukes kun på kort og modaler, IKKE på inline-elementer.

---

## Maks Kompleksitet per View

| View | Maks antall primære seksjoner | Maks antall komponenter |
|------|-------------------------------|------------------------|
| Dashboard | 4 (kort, liste, sammenligning, widgets) | 15-20 |
| Markedsskanner | 2 (tabs + innhold) | 10-15 |
| Aksjedetalj | 5 (header, analyse, chart, nyheter, plan) | 20-25 |
| Portefølje | 3 (header, trades-liste, statistikk) | 15 |
| Rapport | 4 (summary, dagsrapport, anbefalinger, alerts) | 15-20 |

**Regel:** En view skal kunne leses på under 30 sekunder. Skjul kompleksitet bak tabs/accordions.

---

## DO ✅

1. **DO** bruk eksisterende farger fra `tailwind.config.ts`
2. **DO** følg etablert spacing (p-6 for kort, gap-4 for elementer)
3. **DO** bruk `rounded-xl` eller høyere for alle interactive elementer
4. **DO** ha konsekvent typografi-hierarki (H1→H4)
5. **DO** bruk `clsx` for conditional klasser
6. **DO** legg nye farger i Tailwind config, ikke inline
7. **DO** test i både light og dark mode
8. **DO** bruk semantic HTML (button for knapper, a for lenker)
9. **DO** hold komponenter under 200 linjer
10. **DO** bruk Lucide icons konsekvent

---

## DON'T ❌

1. **DON'T** bruk inline styles for farger (`style={{ color: '#xxx' }}`)
2. **DON'T** introduser nye border-radius verdier
3. **DON'T** ha mer enn 3 nivåer av nesting i UI
4. **DON'T** lag komponenter som gjør mer enn én ting
5. **DON'T** bruk `!important` (unntatt dark mode overrides i globals.css)
6. **DON'T** bland forskjellige icon-biblioteker
7. **DON'T** ha tekst under 12px (0.75rem)
8. **DON'T** bruk gradients unntatt for signal-headers og CTAs
9. **DON'T** lag modaler bredere enn `max-w-2xl` (672px)
10. **DON'T** introduser animasjoner uten å definere i globals.css

---

## Kontrakt-endringer

Endringer i denne kontrakten krever:
1. Oppdatering av dette dokumentet
2. Gjennomgang av eksisterende komponenter for konsistens
3. Oppdatering av `tailwind.config.ts` hvis nye verdier

**Sist oppdatert:** Januar 2026
