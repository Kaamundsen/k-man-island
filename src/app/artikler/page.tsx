'use client';

import { useEffect, useState } from 'react';
import ArticleTipsManager from '@/components/ArticleTipsManager';
import { NewsAggregator } from '@/components/NewsAggregator';
import QuickArticleCapture from '@/components/QuickArticleCapture';
import { seedInvesttechArticle } from '@/lib/store/seed-article';
import { fixExistingArticles } from '@/lib/store/fix-article';
import { Newspaper, FileText, AlertCircle, ExternalLink, Info, Sparkles } from 'lucide-react';

type TabType = 'manual' | 'aggregator' | 'howto';

export default function ArtiklerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('aggregator');
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  
  // Seed eksempelartikkel og fiks eventuelle feil ved første besøk
  useEffect(() => {
    seedInvesttechArticle();
    
    // Fiks eksisterende artikler (fjern "to selskaper" etc.)
    const result = fixExistingArticles();
    if (result.fixed > 0) {
      console.log(`Fikset ${result.fixed} artikler. Fjernet:`, result.removed);
    }
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            📰 Nyheter & Artikkel-Tips
          </h1>
          <p className="text-gray-600 dark:text-dark-muted">
            Hent nyheter fra finansaviser og lagre viktig informasjon fra artikler
          </p>
        </div>
        
        {/* Quick Capture Button */}
        <button
          onClick={() => setShowQuickCapture(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 
                     text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 
                     hover:shadow-purple-500/40 transition-all hover:scale-105"
        >
          <Sparkles className="h-5 w-5" />
          Rask Import
        </button>
      </div>
      
      {/* Quick Capture Modal */}
      <QuickArticleCapture 
        isOpen={showQuickCapture} 
        onClose={() => setShowQuickCapture(false)}
        onSaved={() => {
          // Refresh if on manual tab
          if (activeTab === 'manual') {
            setActiveTab('aggregator');
            setTimeout(() => setActiveTab('manual'), 100);
          }
        }}
      />
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-dark-border pb-3">
        <TabButton 
          active={activeTab === 'aggregator'} 
          onClick={() => setActiveTab('aggregator')}
          icon={<Newspaper className="h-4 w-4" />}
          label="Nyhetsstrøm"
        />
        <TabButton 
          active={activeTab === 'manual'} 
          onClick={() => setActiveTab('manual')}
          icon={<FileText className="h-4 w-4" />}
          label="Manuelle Tips"
        />
        <TabButton 
          active={activeTab === 'howto'} 
          onClick={() => setActiveTab('howto')}
          icon={<Info className="h-4 w-4" />}
          label="Hvordan bruke"
        />
      </div>
      
      {/* Content */}
      {activeTab === 'aggregator' && (
        <NewsAggregator showLinks={true} maxItems={20} />
      )}
      
      {activeTab === 'manual' && (
        <ArticleTipsManager />
      )}
      
      {activeTab === 'howto' && (
        <HowToSection />
      )}
    </main>
  );
}

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
        ${active 
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function HowToSection() {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          🎯 Hvordan nyttiggjøre finansnyheter
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          Finansaviser som E24, DN, og Finansavisen har ofte betalingsmur. 
          Her er hvordan du kan bruke informasjonen effektivt:
        </p>
      </div>
      
      {/* Methods */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Method 1: RSS */}
        <div className="bg-white dark:bg-dark-surface rounded-xl p-5 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Newspaper className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              1. Nyhetsstrøm (RSS)
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
            Overskrifter og ingresser er <strong>gratis</strong> via RSS. Bruk &quot;Nyhetsstrøm&quot;-fanen 
            for å se siste nyheter uten abonnement.
          </p>
          <ul className="text-sm text-gray-600 dark:text-dark-muted space-y-1">
            <li>✅ Overskrifter</li>
            <li>✅ Korte sammendrag</li>
            <li>✅ Automatisk oppdatering</li>
            <li>❌ Fullartikler</li>
          </ul>
        </div>
        
        {/* Method 2: Manual */}
        <div className="bg-white dark:bg-dark-surface rounded-xl p-5 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              2. Manuell Lagring
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
            Les artikler (med abonnement) og lagre <strong>nøkkelpunkter</strong> manuelt. 
            Perfekt for Investtech-tips, analytikeranbefalinger, etc.
          </p>
          <ul className="text-sm text-gray-600 dark:text-dark-muted space-y-1">
            <li>✅ Dine egne notater</li>
            <li>✅ Koble til aksjer</li>
            <li>✅ Søkbart arkiv</li>
            <li>✅ Vises på aksjesiden</li>
          </ul>
        </div>
        
        {/* Method 3: Newsweb */}
        <div className="bg-white dark:bg-dark-surface rounded-xl p-5 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              3. Newsweb (Gratis!)
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
            Oslo Børs&apos; offisielle meldingstjeneste. <strong>100% gratis</strong> og 
            inneholder alle børsmeldinger, innsidehandler, og flagginger.
          </p>
          <a 
            href="https://newsweb.oslobors.no"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Gå til Newsweb <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        {/* Method 4: Google News */}
        <div className="bg-white dark:bg-dark-surface rounded-xl p-5 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <ExternalLink className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              4. Google News
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
            Aggregerer nyheter fra mange kilder. Noen artikler er gratis, 
            andre krever abonnement.
          </p>
          <a 
            href="https://news.google.com/search?q=aksjer+OR+børs&hl=no&gl=NO"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Søk på Google News <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      
      {/* Tip Box */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
          💡 Pro-tips for Investtech-artikler
        </h3>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
          <li>
            • <strong>E24 Investtech</strong>: Publiseres ukentlig med innsidehandler og tekniske analyser. 
            Lagre aksjenavnene og hovedpunktene manuelt.
          </li>
          <li>
            • <strong>Investtech.com</strong>: Har gratis oversikt over signaler. 
            <a href="https://www.investtech.com/no/market.php?market=1" target="_blank" rel="noopener noreferrer" className="underline ml-1">Se her</a>
          </li>
          <li>
            • <strong>Nyhetsbrev</strong>: Motta daglige tips på e-post og lagre relevante i systemet.
          </li>
        </ul>
      </div>
      
      {/* Quick Links */}
      <div className="bg-white dark:bg-dark-surface rounded-xl p-5 border border-gray-200 dark:border-dark-border">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          🔗 Nyttige lenker (gratis)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink href="https://newsweb.oslobors.no" label="Newsweb" />
          <QuickLink href="https://www.investtech.com/no/market.php?market=1" label="Investtech" />
          <QuickLink href="https://live.euronext.com/nb/markets/oslo/equities/list" label="Euronext Oslo" />
          <QuickLink href="https://www.oslobors.no/markedsaktivitet/#/" label="Oslo Børs" />
          <QuickLink href="https://e24.no/boers-og-finans" label="E24 Børs" />
          <QuickLink href="https://www.dn.no/bors" label="DN Børs" />
          <QuickLink href="https://finansavisen.no/bors" label="Finansavisen" />
          <QuickLink href="https://www.nordnet.no/market" label="Nordnet" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 
                 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm font-medium"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
