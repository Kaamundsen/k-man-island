import { Stock } from '@/lib/types';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface TradePlanCardProps {
  stock: Stock;
}

export default function TradePlanCard({ stock }: TradePlanCardProps) {
  const riskRewardRatio = stock.gainKr / stock.riskKr;
  const riskRewardStatus = riskRewardRatio >= 2 ? 'excellent' : riskRewardRatio >= 1.5 ? 'good' : 'moderate';
  
  const statusConfig = {
    excellent: { color: 'text-brand-emerald', bg: 'bg-brand-emerald/10', label: '✓ Utmerket' },
    good: { color: 'text-green-500 dark:text-green-400', bg: 'bg-green-500/10', label: '✓ God' },
    moderate: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', label: '⚠ Moderat' },
  };

  const config = statusConfig[riskRewardStatus];

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
        <div className="w-2 h-8 bg-brand-emerald rounded-full"></div>
        Profesjonell Handelsplan
      </h3>

      <div className="space-y-6">
        {/* Entry, Stop Loss, Target */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-500/10 dark:bg-blue-950/40 rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
              Anbefalt Inngang
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {stock.price.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">NOK</div>
          </div>

          <div className="bg-red-500/10 dark:bg-red-950/40 rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
              Stop Loss
            </div>
            <div className="text-2xl font-extrabold text-brand-rose">
              {stock.stopLoss.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">2x ATR nedside</div>
          </div>

          <div className="bg-green-500/10 dark:bg-green-950/40 rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
              Teknisk Target
            </div>
            <div className="text-2xl font-extrabold text-brand-emerald">
              {stock.target.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Motstandsnivå</div>
          </div>
        </div>

        {/* Risk/Reward Analysis */}
        <div className="bg-muted rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Risiko / Reward Forhold
            </h4>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.color}`}>
              {config.label}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Risiko/Reward</div>
              <div className="text-3xl font-extrabold text-foreground">
                1:{riskRewardRatio.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Potensiell Gevinst
              </div>
              <div className="text-xl font-bold text-brand-emerald">
                +{stock.gainPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">+{stock.gainKr.toFixed(2)} kr</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Maksimal Risiko
              </div>
              <div className="text-xl font-bold text-brand-rose">
                -{stock.riskPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">-{stock.riskKr.toFixed(2)} kr</div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 text-sm text-muted-foreground leading-relaxed border border-border">
            <strong className="text-foreground">Anbefaling:</strong> {riskRewardRatio >= 2 ? 
              'Dette er en utmerket risk/reward setup. Target er minst 2x større enn risikoen.' : 
              riskRewardRatio >= 1.5 ?
              'God risk/reward. Vurder posisjonsstørrelse basert på risikotoleranse.' :
              'Moderat risk/reward. Vurder tidshorisont og alternativ mulighet før entry.'
            }
          </div>
        </div>

        {/* Time Horizon */}
        <div className="flex items-center justify-between p-4 bg-blue-500/10 dark:bg-blue-950/40 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Tidsestimat</div>
              <div className="text-xs text-muted-foreground">For swing trade</div>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-500">
            {stock.timeHorizon}
          </div>
        </div>

        {/* Trading Notes */}
        <div className="border-t border-border pt-6">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
            Handelsnotater
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-brand-emerald mt-0.5">•</span>
              <span>Vurder markedssentiment og generell trend før inngang</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-emerald mt-0.5">•</span>
              <span>Hold deg til stop loss-nivået for å begrense tap</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-emerald mt-0.5">•</span>
              <span>Vurder å ta delvis profit ved 50% av target</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-emerald mt-0.5">•</span>
              <span>Overvåk volum for bekreftelse på breakout</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
