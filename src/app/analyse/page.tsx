'use client';

import { useState } from 'react';
import { mockStocks } from '@/lib/mock-data';
import StockCard from '@/components/StockCard';
import MarketStatus from '@/components/MarketStatus';
import { TrendingUp, Search, Sparkles } from 'lucide-react';

export default function AnalysePage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Get top performers by K-Score
  const topStocks = [...mockStocks]
    .sort((a, b) => b.kScore - a.kScore)
    .slice(0, 6);

  // Filter stocks based on search
  const filteredStocks = searchTerm
    ? mockStocks.filter(stock => 
        stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : topStocks;

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-brand-slate tracking-tight mb-2">
              Dyp Analyse
            </h1>
            <p className="text-gray-600">
              Søk etter en aksje for detaljert analyse med pris, target, risiko og innsidehandel
            </p>
          </div>
          <MarketStatus />
        </div>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Søk etter ticker eller navn... (OKEA, VAR, AAPL)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-gray-200 focus:border-brand-emerald focus:ring-4 focus:ring-brand-emerald/20 outline-none transition-all text-lg font-medium"
          />
        </div>
        
        {searchTerm && (
          <div className="mt-4 text-sm text-gray-600">
            Fant {filteredStocks.length} resultat{filteredStocks.length !== 1 ? 'er' : ''}
          </div>
        )}
      </div>

      {/* Info Cards */}
      {!searchTerm && (
        <div className="mb-12">
          <div className="bg-gradient-to-br from-brand-slate to-gray-800 rounded-3xl p-8 text-white">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold mb-3">Hvordan bruke Dyp Analyse</h2>
                <div className="grid grid-cols-2 gap-6 text-sm opacity-90 leading-relaxed">
                  <div>
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-emerald flex items-center justify-center text-xs">1</span>
                      Søk etter aksje
                    </h3>
                    <p>Skriv inn ticker (OKEA) eller navn i søkefeltet over.</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-emerald flex items-center justify-center text-xs">2</span>
                      Se detaljert analyse
                    </h3>
                    <p>Få innsikt i pris, K-Score, target, stop loss og risk/reward.</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-emerald flex items-center justify-center text-xs">3</span>
                      Sjekk innsidehandel
                    </h3>
                    <p>Se meldepliktige handler og få varsler om aktivitet.</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-emerald flex items-center justify-center text-xs">4</span>
                      Les handelsplan
                    </h3>
                    <p>Få en profesjonell handelsplan med entry, target og tidshorisont.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        {!searchTerm && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-brand-slate flex items-center gap-3 mb-2">
              <TrendingUp className="w-7 h-7 text-brand-emerald" />
              Topp 6 Etter K-Score
            </h2>
            <p className="text-gray-600">Klikk på et kort for å se full analyse</p>
          </div>
        )}

        {filteredStocks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStocks.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">Ingen aksjer funnet</div>
            <p className="text-gray-500 text-sm">Prøv et annet søk eller gå til Markedsskanner for full oversikt</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      {!searchTerm && (
        <div className="mt-12 grid grid-cols-3 gap-4">
          <a 
            href="/markedsskanner"
            className="bg-surface rounded-2xl p-6 border border-surface-border hover:shadow-card-hover transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-emerald/20 transition-colors">
              <Search className="w-6 h-6 text-brand-emerald" />
            </div>
            <h3 className="font-bold text-brand-slate mb-1">Markedsskanner</h3>
            <p className="text-sm text-gray-600">Se alle aksjer i tabell</p>
          </a>

          <a 
            href="/"
            className="bg-surface rounded-2xl p-6 border border-surface-border hover:shadow-card-hover transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/20 transition-colors">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-brand-slate mb-1">Dashboard</h3>
            <p className="text-sm text-gray-600">Beste muligheter nå</p>
          </a>

          <div className="bg-gradient-to-br from-brand-emerald to-emerald-600 rounded-2xl p-6 text-white">
            <div className="text-sm font-semibold opacity-90 mb-2">Totalt analysert</div>
            <div className="text-4xl font-extrabold mb-1">{mockStocks.length}</div>
            <div className="text-sm opacity-75">Aksjer i systemet</div>
          </div>
        </div>
      )}
    </main>
  );
}
