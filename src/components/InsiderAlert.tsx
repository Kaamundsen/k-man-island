'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Users } from 'lucide-react';
import { InsiderTransaction } from '@/lib/api/finnhub';

interface InsiderAlertProps {
  ticker: string;
}

export default function InsiderAlert({ ticker }: InsiderAlertProps) {
  const [transactions, setTransactions] = useState<InsiderTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsiderData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/insider/${ticker}`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Error fetching insider data:', error);
      }
      setLoading(false);
    }
    
    fetchInsiderData();
  }, [ticker]);

  const recentBuys = transactions.filter(t => t.transactionCode === 'P').length;
  const recentSells = transactions.filter(t => t.transactionCode === 'S').length;
  const hasInsiderActivity = transactions.length > 0;
  const insiderType = recentBuys > recentSells ? 'buy' : recentSells > 0 ? 'sell' : 'neutral';
  
  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-brand-slate" />
        <h3 className="text-xl font-bold text-brand-slate">Innsidehandel-Sjekk</h3>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Laster innsidehandel...</div>
      ) : (
        <>
          {/* Alert Box */}
          {hasInsiderActivity && insiderType !== 'neutral' && (
            <div className={`p-4 rounded-xl mb-6 ${
              insiderType === 'buy' 
                ? 'bg-brand-emerald/10 border-2 border-brand-emerald' 
                : 'bg-brand-rose/10 border-2 border-brand-rose'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  insiderType === 'buy' ? 'bg-brand-emerald' : 'bg-brand-rose'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      insiderType === 'buy'
                        ? 'bg-brand-emerald text-white'
                        : 'bg-brand-rose text-white'
                    }`}>
                      ALARM
                    </span>
                    <span className="text-xs text-gray-500">Siste 90 dager</span>
                  </div>
                  <h4 className={`font-bold mb-2 ${
                    insiderType === 'buy' ? 'text-brand-emerald' : 'text-brand-rose'
                  }`}>
                    {insiderType === 'buy' 
                      ? `${recentBuys} kjøp registrert`
                      : `${recentSells} salg registrert`
                    }
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {insiderType === 'buy'
                      ? 'Innsidere har kjøpt aksjer. Dette kan indikere tro på fremtidig vekst.'
                      : 'Innsidere har solgt aksjer. Vurder om dette påvirker din investeringsavgjørelse.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Insider Trading Table */}
          {transactions.length > 0 ? (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-brand-slate mb-3">Siste meldepliktige handler</h4>
              <div className="space-y-2 text-sm">
                {transactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex justify-between p-2 bg-white rounded">
                    <span className="text-gray-600">
                      {new Date(transaction.transactionDate).toLocaleDateString('nb-NO', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span className={`font-semibold ${transaction.transactionCode === 'P' ? 'text-brand-emerald' : 'text-brand-rose'}`}>
                      {transaction.transactionCode === 'P' ? 'KJØP' : 'SALG'}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {Math.abs(transaction.change).toLocaleString()} aksjer
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center text-gray-500">
              Ingen innsidehandler registrert siste 90 dager
            </div>
          )}
        </>
      )}

      {/* Newsweb Link */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-700" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-yellow-900 mb-2">⚠️ Sjekk Newsweb</h4>
            <p className="text-sm text-yellow-800 mb-3 leading-relaxed">
              For fullstendig oversikt over meldepliktige handler og flaggemeldinger, 
              sjekk alltid Newsweb før du handler.
            </p>
            <a
              href={`https://newsweb.oslobors.no/search?category=1&issuer=${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-slate text-white rounded-lg text-sm font-bold hover:bg-brand-slate/90 transition-colors"
            >
              🔗 Åpne Newsweb for {ticker}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
