import { AlertTriangle, ExternalLink, Users } from 'lucide-react';

interface InsiderAlertProps {
  ticker: string;
}

export default function InsiderAlert({ ticker }: InsiderAlertProps) {
  // Mock insider data - in production this would come from Newsweb API
  const hasInsiderActivity = Math.random() > 0.5;
  const insiderType = hasInsiderActivity ? 'buy' : 'sell';
  
  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-brand-slate" />
        <h3 className="text-xl font-bold text-brand-slate">Innsidehandel-Sjekk</h3>
      </div>

      {/* Alert Box */}
      {hasInsiderActivity && (
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
                <span className="text-xs text-gray-500">Oppdatert for 2 timer siden</span>
              </div>
              <h4 className={`font-bold mb-2 ${
                insiderType === 'buy' ? 'text-brand-emerald' : 'text-brand-rose'
              }`}>
                {insiderType === 'buy' 
                  ? 'Primærinnsider ekte beholdning med 12.4%'
                  : 'Primærinnsider solgte 8.2% av beholdning'
                }
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {insiderType === 'buy'
                  ? 'Styremedlem har økt sin beholdning betydelig. Dette kan indikere tro på fremtidig vekst.'
                  : 'Flere innsidere har solgt aksjer den siste måneden. Vurder om dette påvirker din investeringsavgjørelse.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insider Trading Table */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-bold text-brand-slate mb-3">Siste meldepliktige handler</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-white rounded">
            <span className="text-gray-600">12. jan 2026</span>
            <span className="font-semibold text-brand-emerald">KJØP</span>
            <span className="text-gray-900 font-semibold">5,000 aksjer</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded">
            <span className="text-gray-600">08. jan 2026</span>
            <span className="font-semibold text-brand-rose">SALG</span>
            <span className="text-gray-900 font-semibold">2,500 aksjer</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded">
            <span className="text-gray-600">03. jan 2026</span>
            <span className="font-semibold text-brand-emerald">KJØP</span>
            <span className="text-gray-900 font-semibold">10,000 aksjer</span>
          </div>
        </div>
      </div>

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
