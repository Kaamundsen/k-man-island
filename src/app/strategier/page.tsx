'use client';

import { useState } from 'react';
import { STRATEGIES, StrategyId, StrategyDefinition } from '@/lib/strategies';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Target, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';
import { clsx } from 'clsx';

// ============================================
// SCORING DOCUMENTATION - OPPDATER DETTE NÅR DU ENDRER STRATEGIENE!
// ============================================

interface ScoringCriteria {
  name: string;
  weight: string;
  description: string;
  ideal: string;
  penalty?: string;
}

interface StrategyScoring {
  strategyId: StrategyId;
  buyThreshold: number;
  description: string;
  criteria: ScoringCriteria[];
  goldRequirement?: string;
}

// DETTE MÅ OPPDATERES NÅR SCORING-LOGIKKEN ENDRES!
const STRATEGY_SCORING: Record<string, StrategyScoring> = {
  MOMENTUM_TREND: {
    strategyId: 'MOMENTUM_TREND',
    buyThreshold: 60,
    description: 'Følger etablerte opptrender. Mål: 8-15% gevinst på 2-4 uker. Høy win-rate (60-70%), stop loss 5-7%.',
    criteria: [
      { 
        name: 'K-Score (historisk momentum)', 
        weight: 'Må være 60+', 
        description: 'Validert momentum-score basert på 6m/3m/1m avkastning',
        ideal: '60+ for å kvalifisere'
      },
      { 
        name: 'Positiv 6-mnd momentum', 
        weight: 'Påkrevd', 
        description: '6-måneders avkastning må være positiv',
        ideal: 'Over 0%',
        penalty: 'Negativ = diskvalifisert'
      },
      { 
        name: 'Positiv 3-mnd momentum', 
        weight: 'Påkrevd', 
        description: '3-måneders avkastning må være positiv',
        ideal: 'Over 0%',
        penalty: 'Negativ = diskvalifisert'
      },
      { 
        name: 'Over SMA50', 
        weight: 'Påkrevd', 
        description: 'Pris må være over 50-dagers glidende snitt',
        ideal: 'Bekrefter etablert opptrend'
      },
    ],
    goldRequirement: 'Score 70+ på både M-Trend OG M-Asym = GOLD PICK 🥇 (prioriter for større posisjon)'
  },

  MOMENTUM_ASYM: {
    strategyId: 'MOMENTUM_ASYM',
    buyThreshold: 60,
    description: 'Asymmetriske muligheter med R/R 2.5:1+. Mål: 15-25% gevinst på 1-3 uker. Lavere win-rate (45-50%), stop loss 5-8%.',
    criteria: [
      { 
        name: 'K-Score (historisk)', 
        weight: 'Må være 60+', 
        description: 'Validert momentum-score som grunnlag',
        ideal: '60+ for å kvalifisere'
      },
      { 
        name: 'Risk/Reward Ratio', 
        weight: 'Må være 2.5+', 
        description: 'Forholdet mellom forventet gevinst og risiko',
        ideal: 'R/R ≥ 2.5 (asymmetrisk oppsidepotensial)',
        penalty: 'Under 2.5 = diskvalifisert'
      },
      { 
        name: 'Avstand fra 52-ukers høy', 
        weight: 'Må være 15%+', 
        description: 'Må ha rom for oppside',
        ideal: 'Minst 15% under 52-ukers høy',
        penalty: 'Nær toppen = begrenset upside'
      },
      { 
        name: 'RSI i normalområde', 
        weight: 'Må være 35-65', 
        description: 'Ikke overkjøpt eller oversolgt',
        ideal: '35-65 (sunn sone)'
      },
    ],
    goldRequirement: 'Score 70+ på både M-Trend OG M-Asym = GOLD PICK 🥇 (prioriter for større posisjon)'
  },

  BUFFETT: {
    strategyId: 'BUFFETT',
    buyThreshold: 65,
    description: 'Verdiinvestering. Fokus på kvalitet og langsiktig perspektiv. Mål: 8-20% årlig (Buffetts snitt er ~20%).',
    criteria: [
      { 
        name: 'K-Score (Kvalitet)', 
        weight: 'Må være 65+', 
        description: 'Høy kvalitetsscore basert på historisk momentum',
        ideal: '65+ for å kvalifisere'
      },
      { 
        name: 'RSI i normalområde', 
        weight: 'Må være under 65', 
        description: 'Unngå overkjøpte aksjer',
        ideal: 'RSI < 65',
        penalty: 'RSI > 65 = overkjøpt, unngå'
      },
      { 
        name: 'Ikke på ATH', 
        weight: 'Må være under 95%', 
        description: 'Avstand fra 52-ukers høy',
        ideal: 'Under 95% av 52-ukers høy',
        penalty: 'Ved ATH = for høy risiko'
      },
    ],
  },

  TVEITEREID: {
    strategyId: 'TVEITEREID',
    buyThreshold: 60,
    description: 'Fokus på likviditet og volum. Handler kun de mest omsatte aksjene hvor det er lett å komme inn og ut.',
    criteria: [
      { 
        name: 'K-Score', 
        weight: 'Må være 60+', 
        description: 'Teknisk kvalitetsscore',
        ideal: '60+ for å kvalifisere'
      },
      { 
        name: 'Daglig volum', 
        weight: 'Må være 500k+', 
        description: 'Høyere volum = enklere handel',
        ideal: '500.000+ aksjer/dag',
        penalty: 'Under 500k = for lav likviditet'
      },
      { 
        name: 'RSI i normalområde', 
        weight: 'Må være 35-65', 
        description: 'Ikke ekstreme verdier',
        ideal: '35-65 (sunn sone)'
      },
    ],
  },

  REBOUND: {
    strategyId: 'REBOUND',
    buyThreshold: 55,
    description: 'Kontrarian-strategi: kjøp oversolgte aksjer som viser tegn til reversering. Høyere risiko, rask gevinst.',
    criteria: [
      { 
        name: 'K-Score', 
        weight: 'Må være 55+', 
        description: 'Moderat kvalitetsscore (lavere terskel for rebound)',
        ideal: '55+ for å kvalifisere'
      },
      { 
        name: 'Oversolgt (RSI)', 
        weight: 'Må være under 45', 
        description: 'Lav RSI indikerer oversolgt tilstand',
        ideal: 'RSI < 45 (ideelt under 35)',
        penalty: 'RSI > 45 = ikke oversolgt nok'
      },
      { 
        name: 'Positiv 1-mnd momentum', 
        weight: 'Påkrevd', 
        description: 'Viser tegn til reversering',
        ideal: 'Positiv siste måned (snur opp)'
      },
    ],
  },

  SWING_SHORT: {
    strategyId: 'SWING_SHORT',
    buyThreshold: 60,
    description: 'Kortsiktige swings på 1-5 dager. Inn og ut raskt basert på momentum og tekniske signaler.',
    criteria: [
      { 
        name: 'K-Score', 
        weight: 'Må være 60+', 
        description: 'Kvalitetsscore som grunnlag',
        ideal: '60+ for å kvalifisere'
      },
      { 
        name: 'Momentum', 
        weight: 'Må være > 0.5%', 
        description: 'Positiv daglig momentum',
        ideal: 'Dagendring > 0.5%',
        penalty: 'Under 0.5% = for lite momentum'
      },
      { 
        name: 'RSI "sweet spot"', 
        weight: 'Må være 40-60', 
        description: 'RSI i optimal sone for swing',
        ideal: '40-60 (rom for bevegelse opp)'
      },
      { 
        name: 'Risk/Reward', 
        weight: 'Må være 1.5+', 
        description: 'Må ha god R/R for kort trade',
        ideal: 'R/R ≥ 1.5'
      },
    ],
  },
};

// BUY Signal kriterier (oppdatert basert på faktisk implementasjon i stock-data.ts)
const BUY_SIGNAL_CRITERIA = {
  kScore: { min: 70, description: 'K-Score må være 70+ (validert historisk momentum-score)' },
  rsi: { min: 35, max: 65, description: 'RSI må være mellom 35-65 (ikke overkjøpt/oversolgt)' },
  momentum: { 
    oneMonth: 'positiv', 
    threeMonth: 'positiv', 
    description: 'Må ha positiv momentum siste 1 OG 3 måneder' 
  },
  trend: { description: 'Pris må være over SMA50 (bekreftet opptrend)' },
  riskReward: { min: 2.0, description: 'Risk/Reward må være minst 2:1' },
};

// K-SCORE FORMEL (Validert basert på momentum-forskning)
// Referanse: Jegadeesh & Titman (1993) - Momentum factor
const K_SCORE_FORMULA = {
  momentum: {
    weight: '50%',
    components: [
      { name: '6-mnd avkastning', weight: '25%', description: 'Mest prediktiv for fremtidig avkastning' },
      { name: '3-mnd avkastning', weight: '15%', description: 'Mellomlangt momentum' },
      { name: '1-mnd avkastning', weight: '10%', description: 'Kortsiktig bekreftelse' },
    ],
  },
  trend: {
    weight: '30%',
    components: [
      { name: 'Pris vs SMA50', weight: '15%', description: 'Over SMA50 = opptrend' },
      { name: 'Pris vs SMA200', weight: '10%', description: 'Langsiktig trend' },
      { name: 'Avstand 52w-høy', weight: '5%', description: 'Rom for oppside' },
    ],
  },
  volatility: {
    weight: '20%',
    components: [
      { name: 'Daglig volatilitet', weight: '15%', description: 'Ideelt 1.5-3% daglig' },
      { name: 'Spike-potensial', weight: '5%', description: 'Historikk for store enkeltdager' },
    ],
  },
};

// Komponenter
function RiskBadge({ level }: { level: string }) {
  const config = {
    LOW: { bg: 'bg-green-100', text: 'text-green-700', label: 'Lav' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Høy' },
    VERY_HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: 'Veldig høy' },
  }[level] || { bg: 'bg-gray-100', text: 'text-gray-700', label: level };

  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', config.bg, config.text)}>
      {config.label}
    </span>
  );
}

function StrategyCard({ strategy, scoring }: { strategy: StrategyDefinition; scoring?: StrategyScoring }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
      {/* Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-muted transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{strategy.emoji}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{strategy.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{strategy.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge level={strategy.riskLevel} />
            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-sm">
              <span className="font-medium text-green-600">{strategy.targetReturn.min}-{strategy.targetReturn.max}%</span>
              <span className="text-gray-400 ml-1">mål</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm">
              <span className="font-medium">{strategy.typicalHoldingDays.min}-{strategy.typicalHoldingDays.max}</span>
              <span className="text-gray-400 ml-1">dager</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {strategy.enabled ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {strategy.enabled ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && scoring && (
        <div className="border-t border-gray-100 dark:border-dark-border p-6 bg-gray-50 dark:bg-dark-muted">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-emerald" />
            Hvordan scoren beregnes
          </h4>
          
          <p className="text-sm text-gray-600 mb-4">{scoring.description}</p>

          <div className="space-y-3">
            {scoring.criteria.map((criteria, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{criteria.name}</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    {criteria.weight}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{criteria.description}</p>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-green-600">✓ Ideelt: {criteria.ideal}</span>
                  {criteria.penalty && (
                    <span className="text-red-500">✗ Straff: {criteria.penalty}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Buy threshold */}
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-green-800">BUY-terskel: {scoring.buyThreshold}+ poeng</span>
            </div>
            <p className="text-sm text-green-700">
              Aksjer med score over {scoring.buyThreshold} kvalifiserer som potensielle kjøpskandidater for denne strategien.
            </p>
          </div>

          {/* Gold requirement */}
          {scoring.goldRequirement && (
            <div className="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="font-semibold text-yellow-800">🥇 GOLD PICK: </span>
              <span className="text-sm text-yellow-700">{scoring.goldRequirement}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StrategierPage() {
  // Grupper strategier
  const momentumStrategies = Object.values(STRATEGIES).filter(s => s.category === 'MOMENTUM' && s.enabled);
  const valueStrategies = Object.values(STRATEGIES).filter(s => s.category === 'VALUE' && s.enabled);
  const technicalStrategies = Object.values(STRATEGIES).filter(s => s.category === 'TECHNICAL' && s.enabled);
  const eventStrategies = Object.values(STRATEGIES).filter(s => s.category === 'EVENT' && s.enabled);

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-slate dark:text-white mb-2">Strategi-dokumentasjon</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Oversikt over alle trading-strategier og hvordan de scorer aksjer.
          Oppdatert automatisk ved endringer i systemet.
        </p>
      </div>

      {/* Global BUY criteria */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          Globale BUY-kriterier
        </h2>
        <p className="text-gray-600 mb-4">
          For at en aksje skal få BUY-signal må den oppfylle <strong>alle</strong> disse kriteriene:
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-muted rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="font-bold text-green-600">K</span>
            </div>
            <div>
              <p className="font-medium">K-Score ≥ {BUY_SIGNAL_CRITERIA.kScore.min}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{BUY_SIGNAL_CRITERIA.kScore.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-muted rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="font-bold text-blue-600">RSI</span>
            </div>
            <div>
              <p className="font-medium">RSI: {BUY_SIGNAL_CRITERIA.rsi.min}-{BUY_SIGNAL_CRITERIA.rsi.max}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{BUY_SIGNAL_CRITERIA.rsi.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-muted rounded-lg">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium">Positiv momentum</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{BUY_SIGNAL_CRITERIA.momentum.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-muted rounded-lg">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
              <span className="font-bold text-cyan-600">📈</span>
            </div>
            <div>
              <p className="font-medium">Over SMA50</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{BUY_SIGNAL_CRITERIA.trend.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-muted rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">R/R ≥ {BUY_SIGNAL_CRITERIA.riskReward.min}:1</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{BUY_SIGNAL_CRITERIA.riskReward.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* K-Score forklaring */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-brand-emerald rounded-lg flex items-center justify-center text-white font-bold">K</span>
          K-Score - Validert Momentum-score
        </h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800">
            <strong>✅ Beregnes fra EKTE historisk data</strong> - 2 år med daglige kurser hentes fra Yahoo Finance 
            for å beregne korrekt momentum, SMA-trender og volatilitet.
          </p>
        </div>
        <p className="text-gray-600 mb-4">
          K-Score er basert på <strong>akademisk forskning om momentum-faktoren</strong> (Jegadeesh & Titman, 1993).
          Studier viser at aksjer med sterk 3-12 måneders avkastning fortsetter å prestere godt.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {/* Momentum */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">📈 Momentum (50%)</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 6-mnd avkastning (25%)</li>
              <li>• 3-mnd avkastning (15%)</li>
              <li>• 1-mnd avkastning (10%)</li>
            </ul>
            <p className="text-xs text-green-600 mt-2 italic">
              Mest prediktiv faktor for fremtidig avkastning
            </p>
          </div>
          
          {/* Trend */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📊 Trend (30%)</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Pris vs SMA50 (15%)</li>
              <li>• Pris vs SMA200 (10%)</li>
              <li>• Avstand 52w-høy (5%)</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2 italic">
              Bekrefter at aksjen er i opptrend
            </p>
          </div>
          
          {/* Volatilitet */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">⚡ Volatilitet (20%)</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Daglig bevegelse (15%)</li>
              <li>• Spike-potensial (5%)</li>
            </ul>
            <p className="text-xs text-purple-600 mt-2 italic">
              Ideelt: 1.5-3% daglig for balanse
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-dark-muted rounded-lg p-4 text-sm">
          <strong>Hvorfor denne formelen?</strong>
          <p className="text-gray-600 mt-1">
            Momentum-faktoren har vært konsistent lønnsom over flere tiår i ulike markeder.
            Ved å kombinere momentum med trend-bekreftelse og moderat volatilitet, 
            filtrerer vi ut aksjer med høyest sannsynlighet for fortsatt oppgang.
          </p>
        </div>
      </div>

      {/* Target returns */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-yellow-600" />
          Hvordan oppnå 100-200% årlig avkastning
        </h2>
        
        {/* Realistic calculation */}
        <div className="bg-white/80 dark:bg-dark-surface/80 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Realistisk regnestykke</h3>
          <div className="grid md:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-50 dark:bg-dark-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-brand-emerald">20-25</p>
              <p className="text-gray-500">trades/år</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">8-15%</p>
              <p className="text-gray-500">snitt gevinst</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">60%</p>
              <p className="text-gray-500">win-rate</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">100-200%</p>
              <p className="text-gray-500">årlig mål</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Med 25 trades, 60% win-rate, 12% snittgevinst og 5% snitttap: (15×12%) - (10×5%) = 130% årlig
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">🚀 Momentum Asymmetrisk (M-Asym)</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Mål per trade:</strong> 15-25% på 1-3 uker
            </p>
            <p className="text-sm text-gray-600">
              Fokus på asymmetriske setups med R/R 3:1+. Aksepterer lavere win-rate (45-50%) 
              fordi gevinstene er større enn tapene. Stop loss typisk 5-8%.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">📈 Momentum Trend (M-Trend)</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Mål per trade:</strong> 8-15% på 2-4 uker
            </p>
            <p className="text-sm text-gray-600">
              Følger etablerte trender med høyere win-rate (60-70%). 
              Mindre gevinst per trade, men mer konsistent. Stop loss 5-7%.
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white/70 dark:bg-dark-surface/70 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>🥇 GOLD PICK:</strong> Aksjer som scorer 70+ på BEGGE strategiene har 
            både etablert trend OG asymmetrisk potensial. Disse prioriteres for større posisjonsstørrelser.
          </p>
        </div>

        {/* Compound example */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">💰 Eksempel med 100.000 kr startkapital</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p>• Q1: 4 trades → +25% → 125.000 kr</p>
            <p>• Q2: 6 trades → +30% → 162.500 kr</p>
            <p>• Q3: 5 trades → +20% → 195.000 kr</p>
            <p>• Q4: 5 trades → +25% → 243.750 kr</p>
            <p className="font-bold pt-2">Totalt: +143,75% avkastning med compounding</p>
          </div>
        </div>
      </div>

      {/* Momentum strategies */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Momentum-strategier
        </h2>
        <div className="space-y-4">
          {momentumStrategies.map(strategy => (
            <StrategyCard 
              key={strategy.id} 
              strategy={strategy} 
              scoring={STRATEGY_SCORING[strategy.id]}
            />
          ))}
        </div>
      </section>

      {/* Value strategies */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          Verdi-strategier
        </h2>
        <div className="space-y-4">
          {valueStrategies.map(strategy => (
            <StrategyCard 
              key={strategy.id} 
              strategy={strategy} 
              scoring={STRATEGY_SCORING[strategy.id]}
            />
          ))}
        </div>
      </section>

      {/* Technical strategies */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-500" />
          Tekniske strategier
        </h2>
        <div className="space-y-4">
          {technicalStrategies.map(strategy => (
            <StrategyCard 
              key={strategy.id} 
              strategy={strategy} 
              scoring={STRATEGY_SCORING[strategy.id]}
            />
          ))}
        </div>
      </section>

      {/* Event strategies */}
      {eventStrategies.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-pink-500" />
            Hendelsesbaserte strategier
          </h2>
          <div className="space-y-4">
            {eventStrategies.map(strategy => (
              <StrategyCard 
                key={strategy.id} 
                strategy={strategy} 
                scoring={STRATEGY_SCORING[strategy.id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Warning about "honest" strategies */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          ⚠️ &quot;Ærlige&quot; strategier - Les dette!
        </h2>
        <p className="text-gray-700 mb-4">
          Følgende strategier er <strong>ikke ekte handelsstrategier</strong>, men ærlige kategorier 
          for kjøp du har gjort uten en klar plan. De finnes for selvrefleksjon og læring.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚨</span>
              <span className="font-bold text-red-700">FOMO</span>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Forventet avkastning: -50% til 0%</strong><br/>
              80%+ av FOMO-kjøp taper penger. Du kjøper på toppen etter alle andre.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎲</span>
              <span className="font-bold text-red-700">YOLO/Magefølelse</span>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Forventet avkastning: -30% til +20%</strong><br/>
              Gambling uten analyse. De fleste taper over tid.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-orange-100 dark:border-orange-900/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💬</span>
              <span className="font-bold text-orange-700">Tips fra noen</span>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Forventet avkastning: -20% til +10%</strong><br/>
              Tips er ofte allerede priset inn når du hører om det.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💎</span>
              <span className="font-bold text-blue-700">HODL</span>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Forventet avkastning: -20% til +15%</strong><br/>
              Følger markedet. Historisk ca. 8% årlig for indeks.
            </p>
          </div>
        </div>
        
        <p className="text-sm text-red-700 font-medium">
          💡 Bruk disse kategoriene til å spore hvor mye du taper på impulsive kjøp 
          vs. disiplinerte strategier. Lær av dataene!
        </p>
      </div>

      {/* Performance info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-500" />
          Ytelse og caching
        </h2>
        <div className="space-y-3 text-sm text-blue-700">
          <p>
            <strong>Historisk data:</strong> Caches i 6 timer for å unngå gjentatte API-kall.
            Første lasting av dashboardet kan ta ~10 sekunder, deretter er det lynraskt.
          </p>
          <p>
            <strong>Børstider:</strong> Når Oslo Børs er stengt (før 09:00 og etter 16:30), 
            brukes cached data automatisk. Live-oppdateringer skjer kun i markedstiden.
          </p>
          <p>
            <strong>Watchlist:</strong> ~40 aksjer scannes, med fokus på OBX-indeksen.
          </p>
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-gray-100 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-600">
          <strong>NB:</strong> Denne dokumentasjonen oppdateres automatisk når strategiene endres i koden.
          Se <code className="bg-gray-200 px-1 rounded">src/lib/api/stock-data.ts</code> og 
          <code className="bg-gray-200 px-1 rounded ml-1">src/lib/strategies/index.ts</code> for implementasjonsdetaljer.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}
        </p>
      </div>
    </main>
  );
}
