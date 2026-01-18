'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  Briefcase, 
  Newspaper, 
  Target,
  Settings,
  Search,
  PieChart,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Star,
  FileText,
  Users,
  Activity,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  features: {
    name: string;
    description: string;
    tip?: string;
  }[];
  link: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-500',
    description: 'Oversikt over markedet og dine beste muligheter',
    link: '/',
    features: [
      {
        name: 'Watchlist',
        description: 'Viser aksjer rangert etter K-Score og valgt strategi. Øverst = best match for strategien.',
        tip: 'Bruk strategi-filteret for å se hvilke aksjer som passer din handelsstil.',
      },
      {
        name: 'Strategi-sammenligning',
        description: 'Sammenlign topp 3 aksjer på tvers av alle strategier for å finne konsensus.',
        tip: 'Aksjer som rangeres høyt på flere strategier er ofte de sikreste valgene.',
      },
      {
        name: 'Nyhetswidget',
        description: 'Siste finansnyheter fra E24 og dine manuelt lagrede artikler.',
      },
      {
        name: 'Kvartalsrapport-kalender',
        description: 'Hold øye med kommende resultatfremleggelser for aksjer i porteføljen.',
      },
    ],
  },
  {
    id: 'portfolio',
    title: 'Portefølje',
    icon: <Briefcase className="h-6 w-6" />,
    color: 'from-emerald-500 to-green-600',
    description: 'Administrer dine trades og se avkastning',
    link: '/portefolje',
    features: [
      {
        name: 'Aktive Trades',
        description: 'Se alle dine åpne posisjoner med urealisert P/L, dagens endring, og avstand til mål/stopp.',
        tip: 'Grønn = i profitt, Rød = i tap. Sjekk "Avstand til mål" for å vurdere om du skal ta gevinst.',
      },
      {
        name: 'Lukkede Trades',
        description: 'Historikk over alle avsluttede handler med realisert gevinst/tap.',
        tip: 'Analyser dine lukkede trades for å lære av feil og suksesser.',
      },
      {
        name: 'Porteføljefilter',
        description: 'Filtrer på portefølje og strategi for å se spesifikke deler av din handel.',
      },
      {
        name: 'Daglig endring',
        description: 'Se hvordan hver aksje har bevegd seg i dag (oppdateres ca. hvert minutt i markedstiden).',
      },
    ],
  },
  {
    id: 'scanner',
    title: 'Markedsskanner',
    icon: <Search className="h-6 w-6" />,
    color: 'from-purple-500 to-pink-500',
    description: 'Finn nye handelsmuligheter',
    link: '/markedsskanner',
    features: [
      {
        name: 'K-Score Scanner',
        description: 'Viser alle aksjer rangert etter momentum-score. Høyere score = sterkere momentum.',
        tip: 'K-Score over 70 = sterk momentum. Under 30 = svak/fallende trend.',
      },
      {
        name: 'Breakout Scanner',
        description: 'Finner aksjer som konsoliderer nær motstand - potensielle breakout-kandidater.',
        tip: 'Kombiner med volum-analyse. Breakouts med høyt volum er mer pålitelige.',
      },
      {
        name: 'Insider Scanner',
        description: 'Aksjer med positiv insider-aktivitet (innsidekjøp > innsidesalg).',
        tip: 'Når ledelsen kjøper egne aksjer, er det ofte et godt tegn.',
      },
      {
        name: 'Day Trade',
        description: 'Aksjer med høy volatilitet og volum - egnet for kortsiktig handel.',
      },
    ],
  },
  {
    id: 'analysis',
    title: 'Aksjeanalyse',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'from-orange-500 to-amber-500',
    description: 'Dypdykk i enkeltaksjer',
    link: '/analyse',
    features: [
      {
        name: 'Prischart',
        description: '90 dagers prishistorikk med volum. Se trender og mønstre.',
      },
      {
        name: 'Tekniske Indikatorer',
        description: 'RSI, K-Score, støtte/motstand, og risk/reward-beregning.',
        tip: 'RSI under 30 = oversold (mulig kjøpsmulighet). Over 70 = overbought (mulig salgssignal).',
      },
      {
        name: 'Trade-plan',
        description: 'Anbefalt entry, stop-loss, og target basert på teknisk analyse.',
        tip: 'Følg alltid stop-loss! Den er der for å beskytte kapitalen din.',
      },
      {
        name: 'Artikkel-nevnelser',
        description: 'Se om aksjen er nevnt i noen av dine lagrede artikler/tips.',
      },
    ],
  },
  {
    id: 'articles',
    title: 'Artikler & Nyheter',
    icon: <Newspaper className="h-6 w-6" />,
    color: 'from-red-500 to-rose-500',
    description: 'Lagre og organiser finansnyheter',
    link: '/artikler',
    features: [
      {
        name: 'Nyhetsstrøm',
        description: 'RSS-feed fra E24 og andre kilder. Automatisk oppdatert.',
        tip: 'Bruk filter-knappene for å finne spesifikke nyhetstyper (innsidehandel, resultat, etc.).',
      },
      {
        name: 'Rask Import',
        description: 'Kopier en artikkel fra E24/DN → Lim inn → Aksjer detekteres automatisk!',
        tip: 'URL-en fylles automatisk ut hvis du kopierer fra E24.',
      },
      {
        name: 'Manuelle Tips',
        description: 'Lagre viktige funn fra betalingsartikler med notater og aksje-koblinger.',
      },
      {
        name: 'Aksje-kobling',
        description: 'Artikler kobles til aksjer og vises på analyse-siden.',
      },
    ],
  },
  {
    id: 'analyst',
    title: 'Analysthus-Tracker',
    icon: <Users className="h-6 w-6" />,
    color: 'from-indigo-500 to-violet-500',
    description: 'Følg anbefalinger fra profesjonelle analytikere',
    link: '/analysthus',
    features: [
      {
        name: 'Konsensus',
        description: 'Se sammenstilt anbefaling fra flere analytikerhus på en aksje.',
        tip: 'Sterk kjøpsanbefaling fra flere = høyere sannsynlighet for oppside.',
      },
      {
        name: 'Kursmål',
        description: 'Lagre kursmål fra DNB Markets, Arctic, Pareto, etc.',
      },
      {
        name: 'Backtest',
        description: 'Se historisk treffsikkerhet for analytikerhusene.',
      },
      {
        name: 'Investtech-score',
        description: 'Import av tekniske signaler fra Investtech.',
      },
    ],
  },
  {
    id: 'tools',
    title: 'Verktøy',
    icon: <Zap className="h-6 w-6" />,
    color: 'from-teal-500 to-cyan-600',
    description: 'Avanserte analyseverktøy',
    link: '/verktoy',
    features: [
      {
        name: 'Master Score',
        description: 'Kombinerer K-Score, Investtech, analytiker-konsensus, og fundamental analyse.',
        tip: 'Jo flere signaler som peker samme vei, jo sterkere er casen.',
      },
      {
        name: 'Risk Dashboard',
        description: 'Se portefølje-beta, Value at Risk, og sektorkonsentrasjon.',
      },
      {
        name: 'Position Sizing',
        description: 'Beregn optimal posisjonsstørrelse basert på risiko og R/R.',
        tip: 'Aldri risiker mer enn 1-2% av porteføljen på en enkelt trade.',
      },
      {
        name: 'Trade Journal',
        description: 'Logg trades med notater og få AI-genererte lærdommer.',
      },
    ],
  },
  {
    id: 'strategies',
    title: 'Strategier',
    icon: <Target className="h-6 w-6" />,
    color: 'from-yellow-500 to-orange-500',
    description: 'Forstå de ulike handelsstrategiene',
    link: '/strategier',
    features: [
      {
        name: 'Momentum Trend',
        description: 'Kjøp aksjer i sterk opptrend. Fokus på momentum og trendstyrke.',
        tip: 'Best i bull-markeder. Unngå i sidelengs/fallende markeder.',
      },
      {
        name: 'Momentum Asym',
        description: 'Momentum + asymmetrisk risk/reward (mål 3x større enn risiko).',
        tip: 'Aksepter flere tap, men store gevinster kompenserer.',
      },
      {
        name: 'Buffett',
        description: 'Verdiaksjer med sterke fundamentaler og innsidekjøp.',
        tip: 'Langsiktig perspektiv. Ignorer kortsiktig støy.',
      },
      {
        name: 'Tveitereid',
        description: 'Fokus på utbytteaksjer og stabil avkastning.',
      },
    ],
  },
  {
    id: 'report',
    title: 'Rapport',
    icon: <FileText className="h-6 w-6" />,
    color: 'from-gray-600 to-slate-700',
    description: 'Daglig handlingsrapport',
    link: '/rapport',
    features: [
      {
        name: 'Krever Handling Nå',
        description: 'Aksjer som har truffet stop-loss eller target - SELG!',
        tip: 'Sjekk denne daglig for å ikke gå glipp av viktige signaler.',
      },
      {
        name: 'Selg-anbefalinger',
        description: 'Aksjer med forverret momentum eller tekniske signaler.',
      },
      {
        name: 'Hold-anbefalinger',
        description: 'Aksjer som er greit å holde, men som ikke er på sitt beste.',
      },
      {
        name: 'Porteføljestatus',
        description: 'Oversikt over total P/L, win rate, og beste/verste trades.',
      },
    ],
  },
];

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Morgenrutine',
    icon: <Clock className="h-5 w-5" />,
    description: 'Start dagen med å sjekke Rapport-siden for aksjer som krever handling.',
    actions: ['Sjekk "Krever Handling Nå"', 'Se daglig endring i porteføljen', 'Les siste nyheter'],
  },
  {
    step: 2,
    title: 'Finn Muligheter',
    icon: <Search className="h-5 w-5" />,
    description: 'Bruk Dashboard og Markedsskanner for å finne nye kandidater.',
    actions: ['Se topp-rangerte aksjer', 'Sjekk Breakout-scanner', 'Analyser enkeltaksjer'],
  },
  {
    step: 3,
    title: 'Analyser',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Gjør dypdykk i interessante aksjer før du handler.',
    actions: ['Se tekniske indikatorer', 'Sjekk analytiker-anbefalinger', 'Les relaterte artikler'],
  },
  {
    step: 4,
    title: 'Handle',
    icon: <Zap className="h-5 w-5" />,
    description: 'Legg inn trade med definert entry, stop-loss og target.',
    actions: ['Bruk Position Sizing', 'Sett stop-loss ALLTID', 'Registrer trade i porteføljen'],
  },
  {
    step: 5,
    title: 'Følg Opp',
    icon: <Activity className="h-5 w-5" />,
    description: 'Overvåk dine posisjoner og juster ved behov.',
    actions: ['Sjekk daglig P/L', 'Flytt stop-loss ved break-even', 'Logg i Trade Journal'],
  },
];

const IMPROVEMENT_IDEAS = [
  {
    category: 'Høy Prioritet',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    items: [
      'Push-varsler når aksjer treffer stop-loss eller target',
      'Automatisk trailing stop-loss funksjonalitet',
      'Integrasjon med Nordnet API for live portefølje-sync',
    ],
  },
  {
    category: 'Medium Prioritet',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    items: [
      'Mobil-app (PWA) med push-varsler',
      'Automatisk månedlig PDF-rapport',
      'Sosial funksjon - del trades med andre brukere',
      'Screener med tilpassbare filtre',
    ],
  },
  {
    category: 'Ideer til Fremtiden',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    items: [
      'Machine Learning-baserte prediksjoner',
      'Automatisert trading (paper trading først)',
      'Opsjonsanalyse og strategier',
      'Kryptovaluta-støtte',
    ],
  },
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Brukerveiledning
            </h1>
            <p className="text-gray-600 dark:text-dark-muted">
              Lær å bruke K-man Island effektivt for å maksimere avkastningen
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Kom i Gang - Anbefalt Arbeidsflyt
        </h2>
        <div className="grid md:grid-cols-5 gap-4">
          {WORKFLOW_STEPS.map((step, index) => (
            <div 
              key={step.step}
              className="relative bg-white dark:bg-dark-surface rounded-xl p-4 border border-gray-200 dark:border-dark-border"
            >
              {index < WORKFLOW_STEPS.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 dark:text-gray-600 z-10" />
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-bold">
                  {step.step}
                </span>
                {step.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-dark-muted mb-2">
                {step.description}
              </p>
              <ul className="space-y-1">
                {step.actions.map((action, i) => (
                  <li key={i} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Guide */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📚 Funksjoner i Detalj
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDE_SECTIONS.map((section) => (
            <div
              key={section.id}
              className={`bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden transition-all ${
                activeSection === section.id ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {/* Header */}
              <button
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color} text-white`}>
                  {section.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">
                    {section.description}
                  </p>
                </div>
                <ArrowRight className={`h-4 w-4 text-gray-400 transition-transform ${
                  activeSection === section.id ? 'rotate-90' : ''
                }`} />
              </button>

              {/* Expanded Content */}
              {activeSection === section.id && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-dark-border pt-3">
                  <div className="space-y-3">
                    {section.features.map((feature, i) => (
                      <div key={i} className="text-sm">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {feature.name}
                        </h4>
                        <p className="text-gray-600 dark:text-dark-muted text-xs">
                          {feature.description}
                        </p>
                        {feature.tip && (
                          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1">
                            <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {feature.tip}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={section.link}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Gå til {section.title} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pro Tips */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Pro Tips
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risikostyring
            </h3>
            <ul className="space-y-2 text-sm text-emerald-700 dark:text-emerald-400">
              <li>• Aldri risiker mer enn 1-2% av porteføljen per trade</li>
              <li>• Sett ALLTID stop-loss før du går inn i en trade</li>
              <li>• Flytt stop-loss til break-even når aksjen går 1R i profitt</li>
              <li>• Diversifiser - ikke legg alle egg i én kurv</li>
              <li>• Ha alltid kontanter tilgjengelig for muligheter</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Vanlige Feil å Unngå
            </h3>
            <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
              <li>• FOMO - ikke kjøp bare fordi aksjen går opp</li>
              <li>• Averaging down - ikke kjøp mer av en taper</li>
              <li>• Overtrading - kvalitet over kvantitet</li>
              <li>• Ignorere stop-loss - den viktigste regelen</li>
              <li>• Kjøpe på topp av momentum uten pullback</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Improvement Ideas */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          💡 Planlagte Forbedringer
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {IMPROVEMENT_IDEAS.map((category) => (
            <div key={category.category} className="bg-white dark:bg-dark-surface rounded-xl p-4 border border-gray-200 dark:border-dark-border">
              <h3 className={`inline-block px-2 py-1 rounded text-sm font-medium mb-3 ${category.color}`}>
                {category.category}
              </h3>
              <ul className="space-y-2">
                {category.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-dark-muted">
                    <CheckCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Klar til å begynne?</h2>
        <p className="text-purple-100 mb-4">
          Gå til Dashboard for å se dagens beste muligheter
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
        >
          <TrendingUp className="h-5 w-5" />
          Åpne Dashboard
        </Link>
      </section>
    </main>
  );
}
