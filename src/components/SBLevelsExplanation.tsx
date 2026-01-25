'use client';

import { SBLevelsAnalysis } from '@/lib/analysis/sb-levels';
import { clsx } from 'clsx';
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  AlertOctagon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SBLevelsExplanationProps {
  analysis: SBLevelsAnalysis;
}

export default function SBLevelsExplanation({ analysis }: SBLevelsExplanationProps) {
  return (
    <div className="space-y-6">
      {/* What is SB-Levels */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Hva er SB-Levels?
          </h3>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            <strong>SB-Levels (Scenario-Based Levels)</strong> er en reaktiv tradingstrategi som 
            identifiserer tre distinkte scenarier basert på prisens posisjon i forhold til 
            nøkkelnivåer (støtte og motstand).
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">✅ VI GJØR</h4>
              <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                <li>• Handler kun ved ytterkant av range</li>
                <li>• Venter på bekreftelse før entry</li>
                <li>• Bruker scenario-spesifikke stops</li>
                <li>• Krever minimum R/R per scenario</li>
                <li>• Breakout: tett stop, R/R ≥ 1.5</li>
                <li>• Pullback: strukturell stop, R/R ≥ 1.3</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">❌ VI GJØR IKKE</h4>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                <li>• Handler midt i range (Scenario C)</li>
                <li>• Går inn uten bekreftelse</li>
                <li>• Bruker dyp stop i breakout</li>
                <li>• Handler mot hovedtrenden</li>
                <li>• Ignorerer R/R-krav</li>
                <li>• Blander scenario-logikk</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Rule Box */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-5 border-2 border-red-300 dark:border-red-800">
        <div className="flex items-center gap-2 mb-3">
          <AlertOctagon className="w-6 h-6 text-red-600" />
          <h4 className="text-lg font-bold text-red-700 dark:text-red-400">
            KRITISK REGEL: Stop hører til scenario, ikke aksjen
          </h4>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="font-bold text-green-700 dark:text-green-400 mb-1">
              Scenario A (Breakout):
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              TETT stop 0.5-1.5×ATR under breakout-nivå. 
              <span className="text-red-600 font-medium"> ALDRI bruk range-bunn som stop!</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">R/R-krav: ≥ 1.5</p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="font-bold text-blue-700 dark:text-blue-400 mb-1">
              Scenario B (Pullback):
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              STRUKTURELL stop under støtte (1×ATR). 
              Dyp stop er <span className="text-green-600 font-medium">RIKTIG</span> her.
            </p>
            <p className="text-gray-500 text-xs mt-1">R/R-krav: ≥ 1.3</p>
          </div>
        </div>
      </div>

      {/* Scenario A Explanation */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
            Scenario A: Impuls / Breakout
          </h3>
          {analysis.activeScenario === 'A' && (
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
              AKTIV
            </span>
          )}
        </div>
        
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-bold text-green-800 dark:text-green-300 mb-1">Hva ser vi etter?</h4>
            <p className="text-green-700 dark:text-green-400">
              Prisen nærmer seg eller bryter ut over motstandsnivå med momentum. 
              Posisjon i range er typisk over 80%.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-green-800 dark:text-green-300 mb-1">Hvordan handler vi?</h4>
            <ul className="text-green-700 dark:text-green-400 space-y-1">
              <li>• Vent på "Break & Hold" – pris må holde over motstand</li>
              <li>• Entry etter bekreftelse (ikke før!)</li>
              <li>• <strong>TETT stop 1×ATR under breakout-nivå</strong></li>
              <li>• <strong>R/R krav: Minimum 1.5</strong></li>
              <li>• Target: 2-4×ATR over breakout</li>
            </ul>
          </div>

          {/* Critical stop placement box */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-green-300 dark:border-green-700">
            <p className="font-bold text-green-800 dark:text-green-300 mb-1">
              ⚡ KRITISK: Stop-plassering i Breakout
            </p>
            <p className="text-green-700 dark:text-green-400 text-xs">
              I breakout-scenarier brukes TETT strukturell stop nær breakout-nivået. 
              Dype stops (range-bunn) hører ALDRI hjemme i breakout – de gir dårlig R/R 
              og blander sammen scenario-logikk. Hvis tett stop gir R/R under 1.5, 
              er scenarioet IKKE TRADEABLE.
            </p>
          </div>
          
          {/* Current state */}
          {analysis.scenarioA.isActive && analysis.scenarioA.tradingPlan && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">For {analysis.ticker} nå:</p>
              <div className="text-gray-600 dark:text-gray-400 space-y-0.5 text-xs">
                <p>Stop: {analysis.scenarioA.tradingPlan.stopLoss.toFixed(2)} (tett breakout-stop)</p>
                <p>R/R: {analysis.scenarioA.tradingPlan.riskReward.toFixed(2)} {analysis.scenarioA.tradingPlan.riskReward >= 1.5 ? '✓' : '✗'}</p>
                <p>Tradeable: {analysis.scenarioA.tradeable ? '✅ Ja' : '❌ Nei'}</p>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-bold text-green-800 dark:text-green-300 mb-1">Invalidasjon</h4>
            <p className="text-green-700 dark:text-green-400">
              {analysis.scenarioA.invalidationExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* Scenario B Explanation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400">
            Scenario B: Pullback / Retest
          </h3>
          {analysis.activeScenario === 'B' && (
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
              AKTIV
            </span>
          )}
        </div>
        
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Hva ser vi etter?</h4>
            <p className="text-blue-700 dark:text-blue-400">
              Prisen har trukket tilbake til støttenivå etter en oppgang. 
              Posisjon i range er typisk 10-40%.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Hvordan handler vi?</h4>
            <ul className="text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Vent på higher low / reaksjon ved støtte</li>
              <li>• Entry KUN etter bekreftet reaksjon</li>
              <li>• <strong>STRUKTURELL stop under støtte (1×ATR)</strong></li>
              <li>• <strong>R/R krav: Minimum 1.3</strong></li>
              <li>• Target: Tilbake mot motstand</li>
            </ul>
          </div>

          {/* Current state */}
          {analysis.scenarioB.isActive && analysis.scenarioB.tradingPlan && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">For {analysis.ticker} nå:</p>
              <div className="text-gray-600 dark:text-gray-400 space-y-0.5 text-xs">
                <p>Stop: {analysis.scenarioB.tradingPlan.stopLoss.toFixed(2)} (strukturell)</p>
                <p>R/R: {analysis.scenarioB.tradingPlan.riskReward.toFixed(2)} {analysis.scenarioB.tradingPlan.riskReward >= 1.3 ? '✓' : '✗'}</p>
                <p>Tradeable: {analysis.scenarioB.tradeable ? '✅ Ja' : '❌ Nei'}</p>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Invalidasjon</h4>
            <p className="text-blue-700 dark:text-blue-400">
              {analysis.scenarioB.invalidationExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* Scenario C Explanation */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-4">
          <AlertOctagon className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
            Scenario C: Chop / NO TRADE
          </h3>
          {analysis.activeScenario === 'C' && (
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
              AKTIV
            </span>
          )}
        </div>
        
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">Hva ser vi?</h4>
            <p className="text-red-700 dark:text-red-400">
              Prisen er midt i range uten klar retning. Posisjon i range er typisk 20-80%.
            </p>
          </div>
          
          <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-4 text-center">
            <AlertOctagon className="w-10 h-10 mx-auto text-red-500 mb-2" />
            <p className="text-lg font-bold text-red-700 dark:text-red-400">
              ⛔ INGEN HANDEL
            </p>
            <p className="text-red-600 dark:text-red-400 mt-1">
              Ingen entry. Ingen stop. Ingen targets.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">Hvorfor ikke handle?</h4>
            <p className="text-red-700 dark:text-red-400">
              {analysis.scenarioC.whyNotTrade}
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">Hva gjør vi?</h4>
            <p className="text-red-700 dark:text-red-400">
              Vent til prisen beveger seg til ytterkant av range, hvor A eller B scenario aktiveres.
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-gray-500" />
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Oppsummering</h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          SB-Levels er en <strong>reaktiv</strong> strategi – vi venter alltid på bekreftelse 
          før vi handler. Nøkkelen er å forstå hvilken scenario som er aktiv, og følge 
          den tilhørende handelsplanen med riktig stop-logikk. 
          <strong> Stop hører til scenario, ikke aksjen.</strong>
        </p>
      </div>
    </div>
  );
}
