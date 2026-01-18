'use client';

import { useState } from 'react';
import { 
  Lightbulb, 
  Bug, 
  CheckCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  Settings,
  ChevronDown,
  Code,
  Rocket,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { clsx } from 'clsx';

// System improvement suggestions - OPPDATERT 16.01.2026
const SYSTEM_IMPROVEMENTS = [
  // ============ FULLFØRTE FORBEDRINGER ============
  {
    id: 'imp-1',
    priority: 'high',
    category: 'feature',
    title: 'Utbytte-administrasjon',
    description: 'Vis utbytter per aksje med dato, beløp og total. Legg til enkelt-import og visning på portefølje-siden.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-2',
    priority: 'high',
    category: 'performance',
    title: 'Børs-status caching',
    description: 'Når Oslo Børs er stengt, bruk cached data i stedet for live API-kall. Reduserer unødvendig trafikk.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-3',
    priority: 'high',
    category: 'ui',
    title: 'Kompakte portefølje-tabs',
    description: 'Portefølje-tabbene tar nå mindre plass med pill-design. Slett og rediger vises på hover.',
    status: 'done',
    effort: 'low',
  },
  {
    id: 'imp-4',
    priority: 'high',
    category: 'feature',
    title: 'Selg/Hold-rapport seksjoner',
    description: 'Vis aksjer med SELG og HOLD anbefaling i egne accordion-seksjoner i rapporten.',
    status: 'done',
    effort: 'low',
  },
  {
    id: 'imp-15-done',
    priority: 'high',
    category: 'performance',
    title: 'Dashboard hastighetsoptimalisering',
    description: 'Batch-fetch fra Yahoo Finance + parallell historisk analyse. Lastetid redusert til ~500ms.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-16-done',
    priority: 'high',
    category: 'feature',
    title: 'Dagens Vinnere Scanner',
    description: 'Scanner hele Oslo Børs for aksjer med >3% endring og >1 MNOK omsetning.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-17-done',
    priority: 'high',
    category: 'feature',
    title: 'Breakout Tips Scanner',
    description: 'Forutsi breakouts med konsolidering, volum-akkumulering og mønstergjenkjenning.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-18',
    priority: 'high',
    category: 'scoring',
    title: 'Forbedret K-Score beregning',
    description: 'K-Score basert på ekte historisk data (2 år) med validert momentum-formel.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-19',
    priority: 'high',
    category: 'scoring',
    title: 'DayTrade-score forbedret',
    description: 'Sofistikert intraday-scoring med volum, volatilitet og momentum-kriterier.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-dark',
    priority: 'low',
    category: 'ui',
    title: 'Dark mode',
    description: 'Mørk modus for kveldstrading. Toggle i sidebar og innstillinger.',
    status: 'done',
    effort: 'low',
  },
  {
    id: 'imp-notifications',
    priority: 'medium',
    category: 'feature',
    title: 'Push-varsler',
    description: 'Browser notifications for prisvarsler, stop-loss triggers og påminnelser. Aktiveres i innstillinger.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-fundamental',
    priority: 'medium',
    category: 'data',
    title: 'Fundamental data',
    description: 'P/E, P/B, utbytte-yield, market cap og sektor hentet fra Yahoo Finance.',
    status: 'done',
    effort: 'medium',
  },
  // ============ NYLIG FULLFØRT ============
  {
    id: 'imp-5',
    priority: 'high',
    category: 'scoring',
    title: 'Backtest K-Score på OSEBX',
    description: 'K-Score validert på historisk data. Egen side med visualisering og statistikk.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-6',
    priority: 'high',
    category: 'feature',
    title: 'Automatisk nattlig analyse',
    description: 'API-endepunkt for cron job som kjører full analyse før børsåpning.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-9',
    priority: 'medium',
    category: 'feature',
    title: 'Kvartalsrapport-kalender',
    description: 'Vis kommende kvartalsrapporter på dashboard. Fargekodet etter urgency.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-10',
    priority: 'medium',
    category: 'data',
    title: 'Sesong-mønstre og varsler',
    description: 'Sesonganalyse for aksjer. Identifiserer beste/verste måneder og kommende muligheter.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-20',
    priority: 'medium',
    category: 'data',
    title: '📰 Nyhets-integrasjon',
    description: 'Nyhets-aggregator med sentiment-analyse og relevans-scoring fra flere kilder.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-21',
    priority: 'medium',
    category: 'feature',
    title: '🔮 AI-drevet Analyse',
    description: 'Regelbasert prediksjon forberedt for ML-integrasjon. Nøkkelfaktorer og risiko-analyse.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-22',
    priority: 'medium',
    category: 'feature',
    title: '📊 Sektor-analyse',
    description: 'Sektor-heatmap med topp aksjer per sektor og snitt endring.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-23',
    priority: 'low',
    category: 'feature',
    title: '📱 PWA / Mobil-app',
    description: 'PWA manifest implementert. Kan installeres på mobil som app.',
    status: 'done',
    effort: 'medium',
  },
  // ============ NYLIG FULLFØRT (v1.7) ============
  {
    id: 'imp-12',
    priority: 'low',
    category: 'performance',
    title: 'Redis server-side caching',
    description: 'Redis-kompatibel cache med in-memory fallback. Klar for produksjon.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-24',
    priority: 'medium',
    category: 'feature',
    title: 'Email-varsler',
    description: 'HTML email-maler for daglig rapport. Støtter Resend, SendGrid.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-25',
    priority: 'low',
    category: 'feature',
    title: 'Telegram/Discord bot',
    description: 'Webhook-integrasjon med ferdigdefinerte varselmaler for alle hendelser.',
    status: 'done',
    effort: 'medium',
  },
  // ============ NYLIG FULLFØRT (v1.9) ============
  {
    id: 'imp-30',
    priority: 'high',
    category: 'feature',
    title: '🏦 Analysthus-Tracker',
    description: 'Track anbefalinger fra DNB Markets, Delphi, Investtech. Manuell import av JSON. Vis konsensus når flere er enige.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-31',
    priority: 'high',
    category: 'data',
    title: '📊 Backtest Analysthus',
    description: 'Historisk treffsikkerhet for DNB, Delphi, Investtech. Win rate, avg return, beste/verste pick.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-32',
    priority: 'high',
    category: 'scoring',
    title: '🎯 Master Score (Multi-Signal)',
    description: 'Kombiner K-Score (30%), Investtech (20%), Analysthus-konsensus (20%), Momentum (15%), Fundamentals (15%).',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-33',
    priority: 'high',
    category: 'feature',
    title: '📈 Portefølje vs Analysthus',
    description: 'Sammenlign din YTD return, Sharpe ratio, win rate mot DNB, Delphi og Investtech.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-34',
    priority: 'medium',
    category: 'feature',
    title: '📝 Trade Journal med AI',
    description: 'Logg trades med noter. AI analyserer feil og læring. "Du kjøpte på fallende K-Score..."',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-36',
    priority: 'medium',
    category: 'data',
    title: '🔄 Sektorrotasjon-Radar',
    description: 'Vis hvilke sektorer som leder/henger etter. Tidlig varsel på sektorskift.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-37-risk',
    priority: 'high',
    category: 'feature',
    title: '⚠️ Risk Dashboard',
    description: 'Portfolio beta, VaR, sektorkonsentrasjon, advarsler og forslag.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-position',
    priority: 'medium',
    category: 'feature',
    title: '📊 Position Sizing Calculator',
    description: 'Beregn optimal posisjonsstørrelse basert på risiko og stop-loss.',
    status: 'done',
    effort: 'low',
  },
  {
    id: 'imp-compare',
    priority: 'medium',
    category: 'feature',
    title: '🆚 Side-by-Side Sammenligning',
    description: 'Sammenlign opptil 4 aksjer visuelt: pris, K-Score, Master Score, fundamentals.',
    status: 'done',
    effort: 'medium',
  },
  {
    id: 'imp-export',
    priority: 'low',
    category: 'feature',
    title: '💾 Eksport til CSV',
    description: 'Eksporter portefølje, trades og rapport til CSV for videre analyse.',
    status: 'done',
    effort: 'low',
  },
  {
    id: 'imp-articles',
    priority: 'medium',
    category: 'data',
    title: '📰 Artikkel-tips System',
    description: 'Lagre artikler fra Investtech, E24, analytikere. Koble til aksjer. Vises på analyse-siden.',
    status: 'done',
    effort: 'medium',
  },
  // ============ FREMTIDIGE TODO ============
  {
    id: 'imp-35',
    priority: 'medium',
    category: 'feature',
    title: '🔔 Smart Alerts System',
    description: 'Varsler når: 2+ analysthus anbefaler KJØP, K-Score krysser 75, stop-loss nådd, target nådd.',
    status: 'todo',
    effort: 'medium',
  },
  {
    id: 'imp-26',
    priority: 'medium',
    category: 'feature',
    title: 'Portefølje-rebalansering',
    description: 'Automatiske forslag til rebalansering basert på risiko og allokering.',
    status: 'todo',
    effort: 'high',
  },
  {
    id: 'imp-37',
    priority: 'medium',
    category: 'feature',
    title: '⚠️ Risk Dashboard',
    description: 'Portfolio beta, konsentrasjon per sektor, korrelasjon, Value at Risk, max drawdown.',
    status: 'todo',
    effort: 'high',
  },
  {
    id: 'imp-38',
    priority: 'medium',
    category: 'feature',
    title: '📄 Automatisk Månedlig PDF',
    description: 'Generer PDF-rapport som DNB/Delphi: YTD return, beste/svakeste, anbefalinger neste mnd.',
    status: 'todo',
    effort: 'medium',
  },
  {
    id: 'imp-39',
    priority: 'medium',
    category: 'data',
    title: '🩳 Short Interest Data',
    description: 'Hent short-interest for aksjer. Varsle ved høy/økende shorting. Squeeze-potensial.',
    status: 'todo',
    effort: 'medium',
  },
  {
    id: 'imp-40',
    priority: 'medium',
    category: 'feature',
    title: '📊 Position Sizing Calculator',
    description: 'Beregn optimal posisjonsstørrelse basert på risiko, volatilitet og porteføljestørrelse.',
    status: 'todo',
    effort: 'low',
  },
  // === LAV PRIORITET - Nice to Have ===
  {
    id: 'imp-27',
    priority: 'low',
    category: 'data',
    title: 'Korrelasjon-matrise',
    description: 'Vis hvordan aksjer korrelerer for bedre diversifisering.',
    status: 'todo',
    effort: 'medium',
  },
  {
    id: 'imp-41',
    priority: 'low',
    category: 'feature',
    title: '🆚 Side-by-Side Sammenligning',
    description: 'Sammenlign 2-4 aksjer visuelt: pris, K-Score, fundamentals, anbefalinger.',
    status: 'todo',
    effort: 'low',
  },
  {
    id: 'imp-42',
    priority: 'low',
    category: 'data',
    title: '📰 Nyhets-Aggregator',
    description: 'RSS-basert nyhetsstrøm fra E24, DN. Direkte lenker til Newsweb, Finansavisen. Manuell input av artikkel-tips.',
    status: 'done',
    effort: 'high',
  },
  {
    id: 'imp-43',
    priority: 'low',
    category: 'feature',
    title: '🎨 Dashboard Widgets',
    description: 'Tilpassbare widgets: drag & drop layout, velg hvilke kort som vises.',
    status: 'todo',
    effort: 'high',
  },
  {
    id: 'imp-44',
    priority: 'low',
    category: 'data',
    title: '📈 Tekniske Mønstre',
    description: 'Gjenkjenn cup & handle, head & shoulders, double bottom etc. automatisk.',
    status: 'todo',
    effort: 'high',
  },
  {
    id: 'imp-45',
    priority: 'low',
    category: 'feature',
    title: '💾 Eksport til Excel',
    description: 'Eksporter portefølje, trades og rapport til Excel/CSV for videre analyse.',
    status: 'todo',
    effort: 'low',
  },
  {
    id: 'imp-46',
    priority: 'low',
    category: 'feature',
    title: '🔗 Nordnet API (Offisiell)',
    description: 'Direkte integrasjon med Nordnet for live portefølje og automatisk trade-import.',
    status: 'todo',
    effort: 'high',
  },
  {
    id: 'imp-47',
    priority: 'low',
    category: 'scoring',
    title: '🤖 Ekte ML-Prediksjon',
    description: 'Tren ML-modell på historiske K-Score/pris-data. Prediker neste ukes bevegelse.',
    status: 'todo',
    effort: 'high',
  },
];

const KNOWN_ISSUES = [
  {
    id: 'bug-1',
    severity: 'medium',
    title: 'Yahoo Finance rate limit',
    description: 'Ved mange samtidige requests kan Yahoo Finance blokkere midlertidig.',
    workaround: 'Vent 5-10 minutter og prøv igjen.',
  },
  {
    id: 'bug-2',
    severity: 'low',
    title: 'Manglende ticker-mapping',
    description: 'Noen aksjer fra Nordnet bulk import matcher ikke Yahoo Finance ticker.',
    workaround: 'Legg til manuelt med riktig ticker (f.eks. AKRBP.OL).',
  },
  {
    id: 'bug-3',
    severity: 'low',
    title: 'RSI beregning forenklet',
    description: 'RSI er forenklet basert på daglig endring, ikke ekte 14-dagers RSI.',
    workaround: 'Bruk K-Score og momentum som primære indikatorer.',
  },
];

const CHANGELOG = [
  {
    version: '1.10.0',
    date: '2026-01-17',
    changes: [
      '📰 Nyhetsaggregator: RSS fra E24, DN, Finansavisen',
      '🔗 Direkte lenker til Newsweb, Google News, alle nyhetskilder',
      '📝 Manuell input av artikkel-tips med aksje-kobling',
      '💡 "Hvordan bruke"-guide for nyheter og betalingsmurer',
      '📊 Kompakt nyhetsfeed på Dashboard og aksje-sider',
      '🏷️ Automatisk ticker-gjenkjenning i nyheter',
      '😊 Sentiment-analyse av overskrifter (positiv/negativ/nøytral)',
      '🔍 Kategori-filtrering (Innsidehandel, Resultat, Analytiker, etc)',
    ]
  },
  {
    version: '1.9.0',
    date: '2026-01-16',
    changes: [
      '🏦 Analysthus-Tracker: Import fra DNB, Delphi, Investtech',
      '📊 Backtest av analysthus: Win rate, avg return, beste/verste pick',
      '🎯 Master Score: Multi-signal kombinasjon (K-Score + Investtech + Konsensus)',
      '📝 Trade Journal med AI-analyse og lærdommer',
      '⚠️ Risk Dashboard: Portfolio beta, VaR, sektorkonsentrasjon',
      '📐 Position Sizing Calculator med R/R beregning',
      '🆚 Side-by-Side aksje-sammenligning (opptil 4 aksjer)',
      '🔄 Sektorrotasjon-Radar: Ledende vs hengende sektorer',
      '💾 CSV-eksport av portefølje og trades',
      '🛠️ Ny Verktøy-side med alle analyse-verktøy samlet',
      '📰 Artikkel-tips: Import fra Investtech, E24, analytikere',
      '🔗 Aksje-nevnelser vises automatisk på analyse-siden',
    ]
  },
  {
    version: '1.8.0',
    date: '2026-01-16',
    changes: [
      '📋 Utviklingsplan med 18 nye funksjoner',
      '🏗️ Grunnlag for analysthus-integrasjon',
    ]
  },
  {
    version: '1.7.0',
    date: '2026-01-16',
    changes: [
      '📊 Sektor-analyse med heatmap og topp aksjer per sektor',
      '📱 PWA-støtte - kan installeres som app på mobil',
      '🎯 Backtest-side for K-Score validering og statistikk',
      '⏰ Automatisk nattlig analyse API (cron-ready)',
      '📈 Sesong-mønstre analyse med varsler',
      '📰 Forbedret nyhets-aggregator med sentiment-analyse',
      '🤖 AI-prediksjonsmodul forberedt for ML',
      '🌙 Dark mode hover-fix på alle komponenter',
      '🔴 Redis-kompatibel caching med in-memory fallback',
      '📧 Email-varsler med HTML-maler (Resend/SendGrid)',
      '💬 Telegram/Discord webhook-integrasjon',
    ]
  },
  {
    version: '1.6.1',
    date: '2026-01-16',
    changes: [
      '📅 Kvartalsrapport-kalender på dashboard',
      '📦 Subtotal for lukkede trades i porteføljen',
      '🌙 Forbedret dark mode styling',
    ]
  },
  {
    version: '1.6.0',
    date: '2026-01-16',
    changes: [
      '🌙 Dark mode med toggle i sidebar',
      '🔔 Push-varsler for prisvarsler og signaler',
      '📊 Fundamental data (P/E, P/B, yield, market cap)',
      '⚙️ Hurtiginnstillinger for tema og varsler',
      '🔄 Egen System & Utvikling side',
    ]
  },
  {
    version: '1.5.0',
    date: '2026-01-16',
    changes: [
      'Breakout Tips Scanner',
      'Dagens Vinnere Scanner', 
      'Forbedret K-Score med ekte historisk data',
      'Dashboard hastighetsoptimalisering',
    ]
  },
  {
    version: '1.4.0',
    date: '2026-01-15',
    changes: [
      'Utbytte-import fra Nordnet',
      'Daglig rapport med live-priser',
      'Selg/Hold/Kjøp anbefalinger',
      'Kompakte portefølje-tabs',
    ]
  },
  {
    version: '1.3.0',
    date: '2026-01-14',
    changes: [
      'Bulk import av trades fra Nordnet',
      'Notater og påminnelser per aksje',
      'Prisvarsel-system',
    ]
  },
];

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<'todo' | 'done' | 'issues' | 'changelog'>('todo');
  
  const todoItems = SYSTEM_IMPROVEMENTS.filter(i => i.status === 'todo');
  const doneItems = SYSTEM_IMPROVEMENTS.filter(i => i.status === 'done');
  
  const priorityColors: Record<string, string> = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const categoryIcons: Record<string, JSX.Element> = {
    data: <BarChart3 className="w-4 h-4" />,
    scoring: <Target className="w-4 h-4" />,
    ui: <Settings className="w-4 h-4" />,
    feature: <Lightbulb className="w-4 h-4" />,
    performance: <Zap className="w-4 h-4" />,
  };

  const effortLabels: Record<string, string> = {
    low: '🟢 Lett',
    medium: '🟡 Medium',
    high: '🔴 Krevende',
  };

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System & Utvikling</h1>
            <p className="text-gray-500">Utviklingsplan, bugs og endringslogg</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-500">Planlagt</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todoItems.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">Fullført</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{doneItems.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Bug className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">Kjente bugs</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{KNOWN_ISSUES.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-500">Versjon</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">1.9.0</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab('todo')}
          className={clsx(
            'px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2',
            activeTab === 'todo'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Clock className="w-4 h-4" />
          TODO ({todoItems.length})
        </button>
        <button
          onClick={() => setActiveTab('done')}
          className={clsx(
            'px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2',
            activeTab === 'done'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Fullført ({doneItems.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={clsx(
            'px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2',
            activeTab === 'issues'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Bug className="w-4 h-4" />
          Bugs ({KNOWN_ISSUES.length})
        </button>
        <button
          onClick={() => setActiveTab('changelog')}
          className={clsx(
            'px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2',
            activeTab === 'changelog'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Changelog
        </button>
      </div>

      {/* TODO Tab */}
      {activeTab === 'todo' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Planlagte forbedringer
            </h2>
          </div>
          
          {/* Group by priority */}
          {(['high', 'medium', 'low'] as const).map(priority => {
            const items = todoItems.filter(i => i.priority === priority);
            if (items.length === 0) return null;
            
            return (
              <div key={priority} className="mb-6">
                <h3 className={clsx(
                  'text-sm font-semibold mb-3 uppercase tracking-wider',
                  priority === 'high' ? 'text-red-600' :
                  priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                )}>
                  {priority === 'high' ? '🔴 Høy prioritet' :
                   priority === 'medium' ? '🟡 Medium prioritet' : '🔵 Lav prioritet'}
                </h3>
                <div className="space-y-2">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className={clsx(
                        'rounded-xl p-4 border-l-4',
                        priority === 'high' ? 'bg-red-50 border-red-400' :
                        priority === 'medium' ? 'bg-yellow-50 border-yellow-400' : 'bg-blue-50 border-blue-400'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-gray-500">
                            {categoryIcons[item.category]}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {effortLabels[item.effort]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Done Tab */}
      {activeTab === 'done' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Fullførte forbedringer
            </h2>
          </div>
          
          {doneItems.map(item => (
            <div 
              key={item.id} 
              className="bg-green-50 rounded-xl p-4 border border-green-200"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Fullført
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-500" />
              Kjente problemer
            </h2>
          </div>
          
          {KNOWN_ISSUES.map(issue => (
            <div 
              key={issue.id} 
              className={clsx(
                'rounded-xl p-4 border',
                issue.severity === 'high' ? 'bg-red-50 border-red-200' :
                issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
              )}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className={clsx(
                  'w-5 h-5 mt-0.5 flex-shrink-0',
                  issue.severity === 'high' ? 'text-red-500' :
                  issue.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                )} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded font-medium uppercase',
                      issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                      issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {issue.severity}
                    </span>
                    <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                  <div className="bg-white/50 rounded-lg p-2">
                    <p className="text-sm">
                      <span className="font-medium text-green-700">💡 Løsning:</span>{' '}
                      <span className="text-gray-700">{issue.workaround}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Changelog Tab */}
      {activeTab === 'changelog' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Endringslogg
            </h2>
          </div>
          
          {CHANGELOG.map((release, index) => (
            <div key={release.version} className="relative">
              {/* Timeline line */}
              {index < CHANGELOG.length - 1 && (
                <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
              )}
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 z-10">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 bg-white rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl font-bold text-gray-900">v{release.version}</span>
                    <span className="text-sm text-gray-500">{release.date}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Latest
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-purple-500 mt-1">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
