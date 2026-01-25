'use client';

import { SBLevelsAnalysis, Scenario } from '@/lib/analysis/sb-levels';
import { clsx } from 'clsx';
import { 
  TrendingUp, 
  RefreshCcw, 
  Ban,
  AlertTriangle,
  ArrowRight,
  Target,
  XCircle,
  CheckCircle,
} from 'lucide-react';

interface SBLevelsTradePlanProps {
  analysis: SBLevelsAnalysis;
}

function ScenarioCard({ scenario, analysis, isActive }: { scenario: Scenario; analysis: SBLevelsAnalysis; isActive: boolean }) {
  const getScenarioConfig = () => {
    switch (scenario.id) {
      case 'A':
        return {
          icon: '🚀',
          title: 'IMPULS',
          subtitle: 'Impuls (Breakout)',
          headerBg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          borderColor: 'border-green-200 dark:border-green-800',
          lightBg: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-400',
        };
      case 'B':
        return {
          icon: '🔄',
          title: 'PULLBACK',
          subtitle: 'Pullback (Retest)',
          headerBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          borderColor: 'border-blue-200 dark:border-blue-800',
          lightBg: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-700 dark:text-blue-400',
        };
      case 'C':
        return {
          icon: '⛔',
          title: 'NO TRADE',
          subtitle: 'Chop / Diagonal',
          headerBg: 'bg-gradient-to-r from-red-500 to-rose-600',
          borderColor: 'border-red-200 dark:border-red-800',
          lightBg: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-400',
        };
    }
  };

  const config = getScenarioConfig();
  const plan = scenario.tradingPlan;
  
  // Calculate risk/reward display
  const getRRDisplay = () => {
    if (!plan || plan.riskReward <= 0) return '0.00';
    return plan.riskReward.toFixed(2);
  };
  
  const isLowRR = plan && plan.riskReward < (scenario.id === 'A' ? 1.5 : 1.3);

  return (
    <div className={clsx(
      'rounded-2xl border overflow-hidden',
      config.borderColor,
      isActive && 'ring-2 ring-offset-2',
      scenario.id === 'A' && isActive && 'ring-green-500',
      scenario.id === 'B' && isActive && 'ring-blue-500',
      scenario.id === 'C' && isActive && 'ring-red-500',
    )}>
      {/* Header */}
      <div className={clsx('p-4 text-white', config.headerBg)}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <div className="text-sm opacity-90">Scenario {scenario.id}:</div>
                <div className="text-xl font-bold">{config.title}</div>
              </div>
            </div>
            <div className="text-sm opacity-80">{config.subtitle}</div>
          </div>
          
          <div className="text-right">
            <div className="text-xs opacity-80 mb-1">Konfidensgrad</div>
            <div className="text-3xl font-bold">{scenario.confidence}%</div>
          </div>
        </div>
        
        {/* Status badges */}
        <div className="flex items-center gap-2 mt-3">
          {isActive && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              AKTIVT
            </span>
          )}
          {scenario.tradeable ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/30 backdrop-blur flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Tradeable
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Ikke tradeable
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 bg-white dark:bg-gray-900">
        {/* Description */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          {scenario.description}
        </p>

        {/* Scenario C - No trading plan */}
        {scenario.id === 'C' ? (
          <div className={clsx('rounded-xl p-4', config.lightBg)}>
            <div className="flex items-center gap-2 mb-3">
              <Ban className="w-5 h-5 text-red-500" />
              <span className="font-bold text-red-700 dark:text-red-400">INGEN HANDELSPLAN</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              I Scenario C (Chop/Diagonal) har vi ingen edge. Prisen er fanget i en range uten klar retning. Enhver trade her har dårlig risk/reward fordi:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                Stop loss må plasseres langt unna (under støtte eller over motstand)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                Target er begrenset til motsatt side av range
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                Retningen er uforutsigbar - 50/50 odds
              </li>
            </ul>
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="text-lg">👉</span>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                HANDLING: Vent til prisen når ytterkant av range for Scenario A eller B.
              </p>
            </div>
          </div>
        ) : plan && (
          <div className="space-y-4">
            {/* Trigger */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                <AlertTriangle className="w-3 h-3" />
                TRIGGER (HVA MÅ SKJE)
              </div>
              <p className={clsx('text-sm font-medium', config.textColor)}>
                {scenario.id === 'A' 
                  ? `Pris bryter over ${analysis.primaryResistance.toFixed(2)} NOK og holder i minimum 30 min`
                  : `Pris tester ${analysis.primarySupport.toFixed(2)} NOK og viser reaksjonstegn (higher low, bullish candle)`
                }
              </p>
            </div>

            {/* Entry Type */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                <ArrowRight className="w-3 h-3" />
                ENTRY TYPE
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {scenario.id === 'A' ? 'Break & Hold - Vent på bekreftet brudd' : 'Higher Low - Vent på stigende bunn'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Entry zone: {plan.entryPrice.toFixed(2)} - {(plan.entryPrice + analysis.atr * 0.3).toFixed(2)}
              </p>
            </div>

            {/* Stop Loss */}
            <div className={clsx('rounded-xl p-3', scenario.id === 'A' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-red-50 dark:bg-red-900/20')}>
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1">
                <XCircle className="w-3 h-3" />
                STOP LOSS (STRUKTURELL INVALIDASJON)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {plan.stopLoss.toFixed(2)} NOK
                </span>
                <span className="text-sm text-red-600 dark:text-red-400">
                  -{((plan.entryPrice - plan.stopLoss) / plan.entryPrice * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {scenario.id === 'A' 
                  ? 'Under breakout-nivå = strukturell invalidasjon'
                  : 'Under støtte-sone = strukturelt brudd'
                }
              </p>
            </div>

            {/* Targets */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                <Target className="w-3 h-3" />
                TARGETS
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-green-600 dark:text-green-400">T1:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {plan.target1.toFixed(2)} NOK
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    +{((plan.target1 - plan.entryPrice) / plan.entryPrice * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {scenario.id === 'A' ? '61.8% Fibonacci-ekstensjon fra range' : '50% av range tilbake'}
                </p>
                
                {plan.target2 && (
                  <>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-bold text-green-600 dark:text-green-400">T2:</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {plan.target2.toFixed(2)} NOK
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        +{((plan.target2 - plan.entryPrice) / plan.entryPrice * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {scenario.id === 'A' ? '100% measured move' : 'Tilbake til motstand'}
                    </p>
                  </>
                )}
              </div>
              
              {/* Trail strategy */}
              {plan.trailStrategy && (
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>🎯</span>
                  <span><strong>Trail:</strong> {scenario.id === 'A' 
                    ? 'Flytt stop til break-even ved T1, trail med 2x ATR etter T1'
                    : 'Sikre 50% posisjon ved T1, trail resten mot T2'
                  }</span>
                </div>
              )}
            </div>

            {/* Risk/Reward */}
            <div className={clsx(
              'rounded-xl p-3 border',
              isLowRR 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            )}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Risk/Reward Ratio
                </span>
                <span className={clsx(
                  'text-2xl font-bold',
                  isLowRR ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'
                )}>
                  1:{getRRDisplay()}
                </span>
              </div>
              {isLowRR && (
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  Lav R/R - vær forsiktig
                </div>
              )}
            </div>

            {/* Invalidation */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                <Ban className="w-3 h-3" />
                INVALIDASJON
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {scenario.id === 'A'
                  ? `Pris faller tilbake under ${analysis.primaryResistance.toFixed(2)} NOK etter breakout`
                  : `Pris bryter under ${analysis.primarySupport.toFixed(2)} NOK med volum`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SBLevelsTradePlan({ analysis }: SBLevelsTradePlanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ScenarioCard 
        scenario={analysis.scenarioA} 
        analysis={analysis}
        isActive={analysis.activeScenario === 'A'} 
      />
      <ScenarioCard 
        scenario={analysis.scenarioB} 
        analysis={analysis}
        isActive={analysis.activeScenario === 'B'} 
      />
      <ScenarioCard 
        scenario={analysis.scenarioC} 
        analysis={analysis}
        isActive={analysis.activeScenario === 'C'} 
      />
    </div>
  );
}
