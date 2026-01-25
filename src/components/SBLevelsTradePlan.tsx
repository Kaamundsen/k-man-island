'use client';

import { SBLevelsAnalysis, Scenario } from '@/lib/analysis/sb-levels';
import { clsx } from 'clsx';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Shield, 
  Ban,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface SBLevelsTradePlanProps {
  analysis: SBLevelsAnalysis;
}

function ScenarioPlanCard({ scenario, isActive }: { scenario: Scenario; isActive: boolean }) {
  const getScenarioIcon = () => {
    switch (scenario.id) {
      case 'A': return <TrendingUp className="w-5 h-5" />;
      case 'B': return <TrendingDown className="w-5 h-5" />;
      case 'C': return <Ban className="w-5 h-5" />;
    }
  };

  const getScenarioColor = () => {
    switch (scenario.id) {
      case 'A': return 'green';
      case 'B': return 'blue';
      case 'C': return 'red';
    }
  };

  const color = getScenarioColor();
  const minRR = scenario.id === 'A' ? 1.5 : scenario.id === 'B' ? 1.3 : 0;
  const meetsRR = scenario.tradingPlan ? scenario.tradingPlan.riskReward >= minRR : false;

  return (
    <div className={clsx(
      'rounded-2xl border-2 transition-all',
      isActive 
        ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20` 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
      scenario.id === 'A' && isActive && 'border-green-500 bg-green-50 dark:bg-green-900/20',
      scenario.id === 'B' && isActive && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      scenario.id === 'C' && isActive && 'border-red-500 bg-red-50 dark:bg-red-900/20',
    )}>
      {/* Header */}
      <div className={clsx(
        'p-4 border-b flex items-center justify-between',
        scenario.id === 'A' && 'border-green-200 dark:border-green-800',
        scenario.id === 'B' && 'border-blue-200 dark:border-blue-800',
        scenario.id === 'C' && 'border-red-200 dark:border-red-800',
        !isActive && 'border-gray-200 dark:border-gray-700',
      )}>
        <div className="flex items-center gap-3">
          <div className={clsx(
            'p-2 rounded-xl',
            scenario.id === 'A' && 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300',
            scenario.id === 'B' && 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300',
            scenario.id === 'C' && 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300',
          )}>
            {getScenarioIcon()}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100">
              Scenario {scenario.id}: {scenario.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confidence: {scenario.confidence}%
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* R/R Badge */}
          {scenario.tradingPlan && (
            <span className={clsx(
              'px-2 py-1 rounded-lg text-xs font-bold',
              meetsRR 
                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
            )}>
              R/R {scenario.tradingPlan.riskReward.toFixed(2)}
            </span>
          )}
          
          {/* Status badges */}
          {isActive && (
            <span className={clsx(
              'px-3 py-1 rounded-full text-xs font-bold',
              scenario.id === 'A' && 'bg-green-500 text-white',
              scenario.id === 'B' && 'bg-blue-500 text-white',
              scenario.id === 'C' && 'bg-red-500 text-white',
            )}>
              AKTIV
            </span>
          )}
          {scenario.tradeable ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              TRADEABLE
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-400 text-white flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              IKKE TRADEABLE
            </span>
          )}
        </div>
      </div>

      {/* Tradeable Reason */}
      {scenario.tradeableReason && (
        <div className={clsx(
          'px-4 py-2 text-sm',
          scenario.tradeable 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
        )}>
          <Info className="w-4 h-4 inline mr-1" />
          {scenario.tradeableReason}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Scenario C has no trading plan */}
        {scenario.id === 'C' ? (
          <div className="text-center py-8">
            <Ban className="w-12 h-12 mx-auto text-red-400 mb-3" />
            <h5 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
              INGEN HANDELSPLAN
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Scenario C har ingen entry, ingen stop, ingen targets. 
              Vent på at prisen beveger seg til ytterkant av range.
            </p>
          </div>
        ) : scenario.tradingPlan ? (
          <div className="space-y-4">
            {/* Trigger */}
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Trigger</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {scenario.tradingPlan.trigger}
                </p>
              </div>
            </div>

            {/* Entry */}
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Entry</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {scenario.tradingPlan.entryType} @ {scenario.tradingPlan.entryPrice.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Stop Loss */}
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Stop Loss</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {scenario.tradingPlan.stopLoss.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {scenario.tradingPlan.stopReason}
                </p>
              </div>
            </div>

            {/* Stop Logic Explanation */}
            <div className={clsx(
              'p-3 rounded-lg text-xs',
              scenario.id === 'A' 
                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
            )}>
              <p className={clsx(
                'font-medium mb-1',
                scenario.id === 'A' ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'
              )}>
                {scenario.id === 'A' ? '⚡ Breakout-stop logikk:' : '🔄 Pullback-stop logikk:'}
              </p>
              <p className={clsx(
                scenario.id === 'A' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
              )}>
                {scenario.id === 'A' 
                  ? 'TETT stop 1×ATR under breakout-nivå. Dyp stop (range-bunn) er FORBUDT i breakout-scenario.'
                  : 'STRUKTURELL stop under støtte. Dyp stop er RIKTIG i pullback-scenario for å gi trade rom til å utvikle seg.'
                }
              </p>
            </div>

            {/* Targets */}
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Targets</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  T1: {scenario.tradingPlan.target1.toFixed(2)}
                  {scenario.tradingPlan.target2 && (
                    <span> | T2: {scenario.tradingPlan.target2.toFixed(2)}</span>
                  )}
                </p>
              </div>
            </div>

            {/* R/R Section */}
            <div className={clsx(
              'p-3 rounded-lg',
              meetsRR 
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            )}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Risk/Reward
                </span>
                <span className={clsx(
                  'text-lg font-bold',
                  meetsRR ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {scenario.tradingPlan.riskReward.toFixed(2)}
                </span>
              </div>
              <div className="text-xs mt-1">
                <span className="text-gray-500">Minimum for Scenario {scenario.id}: </span>
                <span className={clsx(
                  'font-medium',
                  meetsRR ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {minRR} {meetsRR ? '✓' : '✗'}
                </span>
              </div>
              {!meetsRR && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-700 dark:text-red-400">
                  ⚠️ R/R er under minimum. Denne er IKKE TRADEABLE.
                </div>
              )}
            </div>

            {/* Trail Strategy */}
            {scenario.tradingPlan.trailStrategy && (
              <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <span className="font-medium">Trail: </span>
                {scenario.tradingPlan.trailStrategy}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SBLevelsTradePlan({ analysis }: SBLevelsTradePlanProps) {
  return (
    <div className="space-y-6">
      {/* Reactive Strategy Reminder */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800">
        <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Reaktiv Strategi – Kritiske Regler
        </h4>
        <div className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1">
          <p>• <strong>Ingen innganger uten bekreftelse</strong> – vent på break & hold eller higher low</p>
          <p>• <strong>Ingen trades midt i range</strong> – kun ved ytterkant (motstand/støtte)</p>
          <p>• <strong>Scenario A (Breakout):</strong> TETT stop under breakout-nivå. R/R ≥ 1.5 påkrevd.</p>
          <p>• <strong>Scenario B (Pullback):</strong> STRUKTURELL stop under støtte. R/R ≥ 1.3 påkrevd.</p>
          <p>• <strong>FORBUDT:</strong> Bruke range-bunn som stop i breakout-scenario!</p>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid gap-4">
        <ScenarioPlanCard 
          scenario={analysis.scenarioA} 
          isActive={analysis.activeScenario === 'A'} 
        />
        <ScenarioPlanCard 
          scenario={analysis.scenarioB} 
          isActive={analysis.activeScenario === 'B'} 
        />
        <ScenarioPlanCard 
          scenario={analysis.scenarioC} 
          isActive={analysis.activeScenario === 'C'} 
        />
      </div>

      {/* Quick Decision Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
          Quick Decision Matrix
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Scenario</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Stop Type</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Min R/R</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Aktiv</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Handling</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-2 font-medium text-green-600">A - Breakout</td>
                <td className="py-2 text-gray-600 dark:text-gray-400">Tett (1×ATR)</td>
                <td className="py-2 text-gray-600 dark:text-gray-400">1.5</td>
                <td className="py-2">
                  {analysis.scenarioA.isActive ? '✅' : '❌'}
                </td>
                <td className="py-2">
                  {analysis.scenarioA.tradeable 
                    ? <span className="text-emerald-600 font-medium">TRADEABLE</span>
                    : <span className="text-gray-400">Vent</span>
                  }
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-2 font-medium text-blue-600">B - Pullback</td>
                <td className="py-2 text-gray-600 dark:text-gray-400">Strukturell</td>
                <td className="py-2 text-gray-600 dark:text-gray-400">1.3</td>
                <td className="py-2">
                  {analysis.scenarioB.isActive ? '✅' : '❌'}
                </td>
                <td className="py-2">
                  {analysis.scenarioB.tradeable 
                    ? <span className="text-emerald-600 font-medium">TRADEABLE</span>
                    : <span className="text-gray-400">Vent</span>
                  }
                </td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-red-600">C - Chop</td>
                <td className="py-2 text-gray-600 dark:text-gray-400">–</td>
                <td className="py-2 text-gray-600 dark:text-gray-400">–</td>
                <td className="py-2">
                  {analysis.scenarioC.isActive ? '✅' : '❌'}
                </td>
                <td className="py-2">
                  <span className="text-red-600 font-medium">NO TRADE</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Explanation box */}
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          <strong>Stop-logikk per scenario:</strong> Breakout = tett stop for høy R/R ved rask bevegelse. 
          Pullback = strukturell stop for å gi trade rom. ALDRI bruk dyp stop i breakout!
        </div>
      </div>
    </div>
  );
}
