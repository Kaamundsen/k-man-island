'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Settings, 
  Server, 
  Database, 
  Code, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Cloud,
  Globe,
  Key,
  Terminal,
  Layers,
  Zap,
  Clock,
  Bell,
  Wallet,
  TrendingUp,
  PieChart,
  Shield,
  Newspaper,
  Target,
  BarChart3,
  Bot,
  Smartphone,
  LineChart,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';
import { useNotifications, getNotificationSettings, saveNotificationSettings, NotificationSettings } from '@/lib/hooks/useNotifications';

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  badgeColor?: string;
}

function AccordionSection({ title, icon, children, defaultOpen = false, badge, badgeColor = 'bg-brand-emerald' }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-surface-border rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-brand-slate">{title}</span>
          {badge && (
            <span className={`${badgeColor} text-white text-xs px-2 py-0.5 rounded-full font-medium`}>
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-surface-border">
          {children}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative group">
      <pre className="bg-brand-slate text-gray-100 rounded-xl p-4 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <CheckCircle className="w-4 h-4 text-brand-emerald" />
        ) : (
          <Copy className="w-4 h-4 text-gray-300" />
        )}
      </button>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'done' | 'in-progress' | 'planned';
  priority?: 'high' | 'medium' | 'low';
}

function FeatureCard({ title, description, icon, status, priority }: FeatureCardProps) {
  const statusConfig = {
    'done': { bg: 'bg-brand-emerald/10', border: 'border-brand-emerald/30', text: 'text-brand-emerald', label: '✅ Ferdig' },
    'in-progress': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', label: '🔨 Under arbeid' },
    'planned': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', label: '📋 Planlagt' },
  };
  
  const priorityConfig = {
    'high': { bg: 'bg-rose-100', text: 'text-rose-700' },
    'medium': { bg: 'bg-amber-100', text: 'text-amber-700' },
    'low': { bg: 'bg-gray-100', text: 'text-gray-600' },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${config.text} mt-0.5`}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-brand-slate">{title}</h4>
            {priority && (
              <span className={`${priorityConfig[priority].bg} ${priorityConfig[priority].text} text-xs px-2 py-0.5 rounded font-medium`}>
                {priority === 'high' ? 'Høy' : priority === 'medium' ? 'Medium' : 'Lav'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
          <span className={`text-xs ${config.text} font-medium mt-2 inline-block`}>{config.label}</span>
        </div>
      </div>
    </div>
  );
}

export default function InnstillingerPage() {
  const [fixStatus, setFixStatus] = useState<string | null>(null);
  const { isDark, toggleTheme, theme, setTheme } = useTheme();
  const { isSupported, permission, requestPermission, isEnabled } = useNotifications();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getNotificationSettings());

  // Save notification settings when they change
  useEffect(() => {
    saveNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setNotificationSettings(prev => ({ ...prev, enabled: true }));
    }
  };

  const handleFixAllTrades = useCallback(() => {
    // KOMPLETT LISTE MED ALLE KJØP OG SALG
    // Strategier:
    // - Vår Energi → Utbytte
    // - Nordic Semiconductor → Tveitereid
    // - SATS → Tveitereid
    // - Aker BP (ny 12.1.2026) → Ukens Aksje
    // - TGS → Tveitereid
    // - Höegh, MPC → Utbytte
    // - Protector, Novo → Buffett
    // - NHY, Kid → Momentum
    
    const allTrades = [
      // ============ AKTIVE TRADES ============
      
      // NHY - Momentum (AKTIV)
      { date: '2026-01-12', ticker: 'NHY.OL', name: 'Norsk Hydro', quantity: 120, price: 81.88, portfolio: 'portfolio-momentum-trend', strategy: 'MOMENTUM_TREND', status: 'ACTIVE' },
      
      // Aker BP - Ukens Aksje (AKTIV)
      { date: '2026-01-12', ticker: 'AKRBP.OL', name: 'Aker BP', quantity: 40, price: 262.00, portfolio: 'portfolio-mixed', strategy: 'UKENS_AKSJE', status: 'ACTIVE' },
      
      // Vår Energi - Utbytte (AKTIV - 7 kjøp)
      { date: '2025-11-19', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 1600, price: 31.80, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'ACTIVE' },
      { date: '2025-10-10', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 735, price: 33.90, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'ACTIVE' },
      { date: '2025-02-26', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 265, price: 32.12, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'ACTIVE' },
      { date: '2024-08-05', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 200, price: 32.73, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'ACTIVE' },
      { date: '2024-07-26', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 530, price: 35.20, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'ACTIVE' },
      { date: '2024-04-19', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 270, price: 37.00, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'ACTIVE' },
      
      // SATS - Tveitereid (AKTIV)
      { date: '2025-11-19', ticker: 'SATS.OL', name: 'SATS', quantity: 400, price: 35.10, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID', status: 'ACTIVE' },
      
      // Protector - Buffett (AKTIV)
      { date: '2025-10-31', ticker: 'PROT.OL', name: 'Protector Forsikring', quantity: 22, price: 458.00, portfolio: 'portfolio-value', strategy: 'BUFFETT', status: 'ACTIVE' },
      
      // Kid - Momentum (AKTIV)
      { date: '2025-10-28', ticker: 'KID.OL', name: 'Kid', quantity: 80, price: 140.00, portfolio: 'portfolio-momentum-trend', strategy: 'MOMENTUM_TREND', status: 'ACTIVE' },
      
      // Nordic Semiconductor - Tveitereid (AKTIV - 4 kjøp)
      { date: '2025-04-11', ticker: 'NOD.OL', name: 'Nordic Semiconductor', quantity: 370, price: 103.10, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID', status: 'ACTIVE' },
      { date: '2024-08-02', ticker: 'NOD.OL', name: 'Nordic Semiconductor', quantity: 80, price: 131.50, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID', status: 'ACTIVE' },
      { date: '2024-07-26', ticker: 'NOD.OL', name: 'Nordic Semiconductor', quantity: 150, price: 134.40, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID', status: 'ACTIVE' },
      
      // ============ LUKKEDE TRADES ============
      
      // Kitron #1 - LUKKET (kjøp 3.4.2024, salg 9.4.2024)
      { date: '2024-04-03', ticker: 'KIT.OL', name: 'Kitron', quantity: 300, price: 32.48, portfolio: 'portfolio-momentum-trend', strategy: 'MOMENTUM_TREND', status: 'CLOSED', exitDate: '2024-04-09', exitPrice: 32.10 },
      
      // Kitron #2 - LUKKET (kjøp 23.1.2025, salg 3.2.2025)
      { date: '2025-01-23', ticker: 'KIT.OL', name: 'Kitron', quantity: 250, price: 39.20, portfolio: 'portfolio-momentum-trend', strategy: 'MOMENTUM_TREND', status: 'CLOSED', exitDate: '2025-02-03', exitPrice: 37.98 },
      
      // Aker BP (gammel) - LUKKET (kjøp 16.4.2024, salg 18.3.2025)
      { date: '2024-04-16', ticker: 'AKRBP.OL', name: 'Aker BP', quantity: 35, price: 290.00, portfolio: 'portfolio-momentum-trend', strategy: 'MOMENTUM_TREND', status: 'CLOSED', exitDate: '2025-03-18', exitPrice: 241.60 },
      
      // TGS - LUKKET (kjøp 27.11.2024, salg 18.3.2025)
      { date: '2024-11-27', ticker: 'TGS.OL', name: 'TGS', quantity: 200, price: 105.20, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID', status: 'CLOSED', exitDate: '2025-03-18', exitPrice: 104.00 },
      
      // SATS #1 - LUKKET (kjøp 11.2.2025, salg 12.2.2025) - GEVINST!
      { date: '2025-02-11', ticker: 'SATS.OL', name: 'SATS', quantity: 400, price: 28.25, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID', status: 'CLOSED', exitDate: '2025-02-12', exitPrice: 30.00 },
      
      // Novo Nordisk - LUKKET (kjøp 28.3.2025, salg 11.4.2025)
      { date: '2025-03-28', ticker: 'NOVO-B.CO', name: 'Novo Nordisk B', quantity: 20, price: 477.00, portfolio: 'portfolio-value', strategy: 'BUFFETT', status: 'CLOSED', exitDate: '2025-04-11', exitPrice: 419.40 },
      
      // Wallenius - LUKKET (kjøp 27.11.2024, salg 11.4.2025)
      { date: '2024-11-27', ticker: 'WAWI.OL', name: 'Wallenius Wilhelmsen', quantity: 200, price: 106.00, portfolio: 'portfolio-momentum-trend', strategy: 'MOMENTUM_TREND', status: 'CLOSED', exitDate: '2025-04-11', exitPrice: 68.50 },
      
      // Höegh #1 - LUKKET (kjøp 27.11.2024, del av salg 11.4.2025)
      { date: '2024-11-27', ticker: 'HAUTO.OL', name: 'Höegh Autoliners', quantity: 200, price: 123.90, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'CLOSED', exitDate: '2025-04-11', exitPrice: 72.72 },
      
      // Höegh #2 - LUKKET (kjøp 12.12.2024, del av salg 11.4.2025)
      { date: '2024-12-12', ticker: 'HAUTO.OL', name: 'Höegh Autoliners', quantity: 100, price: 107.00, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'CLOSED', exitDate: '2025-04-11', exitPrice: 72.72 },
      
      // MPC #1 - LUKKET (kjøp 28.11.2024, del av salg 11.4.2025)
      { date: '2024-11-28', ticker: 'MPCC.OL', name: 'MPC Container Ships', quantity: 1000, price: 21.80, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'CLOSED', exitDate: '2025-04-11', exitPrice: 14.80 },
      
      // MPC #2 - LUKKET (kjøp 12.12.2024, del av salg 11.4.2025)
      { date: '2024-12-12', ticker: 'MPCC.OL', name: 'MPC Container Ships', quantity: 500, price: 20.50, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER', status: 'CLOSED', exitDate: '2025-04-11', exitPrice: 14.80 },
    ];
    
    const trades = allTrades.map((t, i) => {
      const entryValue = t.price * t.quantity;
      const exitValue = t.exitPrice ? t.exitPrice * t.quantity : 0;
      const realizedPnL = t.status === 'CLOSED' ? exitValue - entryValue : undefined;
      const realizedPnLPercent = t.status === 'CLOSED' && t.exitPrice ? ((t.exitPrice - t.price) / t.price) * 100 : undefined;
      
      return {
        id: `trade-${Date.now()}-${i}`,
        ticker: t.ticker,
        name: t.name,
        entryPrice: t.price,
        quantity: t.quantity,
        entryDate: t.date,
        portfolioId: t.portfolio,
        strategyId: t.strategy,
        stopLoss: Math.round(t.price * 0.9 * 100) / 100,
        target: Math.round(t.price * 1.15 * 100) / 100,
        timeHorizonEnd: new Date(new Date(t.date).getTime() + 90*24*60*60*1000).toISOString().split('T')[0],
        status: t.status as 'ACTIVE' | 'CLOSED',
        exitDate: t.exitDate || undefined,
        exitPrice: t.exitPrice || undefined,
        exitReason: t.status === 'CLOSED' ? 'Solgt' : undefined,
        realizedPnL,
        realizedPnLPercent,
        notes: '',
      };
    });

    localStorage.setItem('kman_trades', JSON.stringify(trades));
    const activeTrades = trades.filter(t => t.status === 'ACTIVE').length;
    const closedTrades = trades.filter(t => t.status === 'CLOSED').length;
    setFixStatus(`✅ ${trades.length} trades fikset! (${activeTrades} aktive, ${closedTrades} lukkede)`);
    
    setTimeout(() => {
      window.location.href = '/portefolje';
    }, 1500);
  }, []);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-slate flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-slate">Innstillinger & Dokumentasjon</h1>
            <p className="text-gray-500">Alt du trenger for å sette opp og kjøre K-man Island</p>
          </div>
        </div>
      </div>

      {/* Quick Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Theme Toggle */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-6 h-6 text-indigo-500" /> : <Sun className="w-6 h-6 text-yellow-500" />}
              <div>
                <h3 className="font-bold text-brand-slate">Tema</h3>
                <p className="text-sm text-gray-500">{isDark ? 'Mørk modus aktivert' : 'Lys modus aktivert'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                isDark ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  isDark ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications Toggle */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className={`w-6 h-6 ${isEnabled ? 'text-brand-emerald' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-bold text-brand-slate">Push-varsler</h3>
                <p className="text-sm text-gray-500">
                  {!isSupported ? 'Ikke støttet i denne nettleseren' :
                   permission === 'denied' ? 'Blokkert - aktiver i nettleserinnstillinger' :
                   isEnabled ? 'Aktivert' : 'Deaktivert'}
                </p>
              </div>
            </div>
            {isSupported && permission !== 'denied' && (
              <button
                onClick={handleEnableNotifications}
                disabled={isEnabled}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  isEnabled ? 'bg-brand-emerald' : 'bg-gray-300'
                } ${isEnabled ? 'cursor-default' : 'cursor-pointer hover:bg-gray-400'}`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    isEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert: iCloud Warning */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 mb-2">⚠️ Viktig: Flytt prosjektet ut av iCloud</h3>
            <p className="text-amber-700 mb-3">
              Dette prosjektet ligger i iCloud-mappen, noe som kan forårsake problemer:
            </p>
            <ul className="text-amber-700 text-sm space-y-1 mb-4">
              <li>• <strong>Fillåsing:</strong> iCloud kan låse filer under synkronisering</li>
              <li>• <strong>node_modules korrupsjon:</strong> Binærfiler synkroniserer dårlig</li>
              <li>• <strong>TypeScript-feil:</strong> Temp-filer fra kompilatoren feiler</li>
              <li>• <strong>Git-konflikter:</strong> .git-mappen kan bli korrupt</li>
              <li>• <strong>Trege bygg:</strong> iCloud sjekker hver fil ved endring</li>
            </ul>
            <div className="bg-amber-100 rounded-xl p-4">
              <p className="text-amber-800 font-semibold mb-2">Anbefalt løsning:</p>
              <CodeBlock code={`# Flytt prosjektet til lokal mappe
mv ~/Library/Mobile\\ Documents/com~apple~CloudDocs/k-man-island ~/Projects/k-man-island

# Naviger til ny lokasjon
cd ~/Projects/k-man-island

# Reinstaller avhengigheter
rm -rf node_modules
npm install`} />
            </div>
          </div>
        </div>
      </div>

      {/* Fix Trades Button */}
      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-rose-800 mb-2">🔧 Fiks alle trades med korrekte datoer</h3>
            <p className="text-rose-700 mb-4">
              Klikk knappen under for å erstatte alle trades med korrekte kjøpsdatoer fra Nordnet-dataene.
              Dette vil overskrive eksisterende trades!
            </p>
            {fixStatus && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4 text-green-800 font-medium">
                {fixStatus}
              </div>
            )}
            <button
              onClick={handleFixAllTrades}
              className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors"
            >
              🔄 Fiks alle 25 trades nå
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Hva er Next.js */}
        <AccordionSection 
          title="Hva er Next.js? (Ikke Python!)" 
          icon={<Code className="w-5 h-5 text-blue-500" />}
          defaultOpen={true}
          badge="Viktig"
          badgeColor="bg-blue-500"
        >
          <div className="pt-4 space-y-6">
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-3 text-lg">Next.js er IKKE Python - det er JavaScript/TypeScript</h4>
              <p className="text-blue-700 mb-4">
                Next.js er et <strong>React-rammeverk</strong> bygget på JavaScript/TypeScript. 
                Det er helt separat fra Python og Streamlit-appen (app.py).
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">N</span>
                    </div>
                    <span className="font-bold">Next.js</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Språk: <strong>JavaScript/TypeScript</strong></li>
                    <li>• Runtime: Node.js</li>
                    <li>• UI Library: React</li>
                    <li>• Brukes til: Webapplikasjoner</li>
                    <li>• Filer: .tsx, .ts, .js</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
                      <span className="text-black font-bold text-sm">🐍</span>
                    </div>
                    <span className="font-bold">Python/Streamlit</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Språk: <strong>Python</strong></li>
                    <li>• Runtime: Python interpreter</li>
                    <li>• UI Library: Streamlit</li>
                    <li>• Brukes til: Data science, scripting</li>
                    <li>• Filer: .py</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-brand-slate">Hvorfor Next.js for K-man Island?</h4>
              <div className="grid gap-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-brand-emerald flex-shrink-0 mt-0.5" />
                  <span><strong>Raskere UI:</strong> React er optimalisert for interaktive dashboards</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-brand-emerald flex-shrink-0 mt-0.5" />
                  <span><strong>SEO & Performance:</strong> Server-side rendering gir raskere lasting</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-brand-emerald flex-shrink-0 mt-0.5" />
                  <span><strong>Type Safety:</strong> TypeScript fanger feil før produksjon</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-brand-emerald flex-shrink-0 mt-0.5" />
                  <span><strong>Økosystem:</strong> Tusenvis av npm-pakker tilgjengelig</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-brand-emerald flex-shrink-0 mt-0.5" />
                  <span><strong>Deployment:</strong> Vercel deployer automatisk ved git push</span>
                </div>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Sammenligning av appene */}
        <AccordionSection 
          title="Next.js vs Streamlit - Kan begge kjøres?" 
          icon={<Zap className="w-5 h-5 text-purple-500" />}
        >
          <div className="pt-4 space-y-6">
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-purple-800">
                <strong>Ja!</strong> Du kan kjøre begge appene samtidig på forskjellige porter. 
                De er helt uavhengige av hverandre.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-brand-slate">Egenskap</th>
                    <th className="text-left py-3 px-2 font-semibold text-brand-emerald">Next.js (Anbefalt)</th>
                    <th className="text-left py-3 px-2 font-semibold text-purple-600">Streamlit (app.py)</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Språk</td>
                    <td className="py-2 px-2">TypeScript/JavaScript</td>
                    <td className="py-2 px-2">Python</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Port</td>
                    <td className="py-2 px-2"><code className="bg-gray-100 px-1 rounded">localhost:3000</code></td>
                    <td className="py-2 px-2"><code className="bg-gray-100 px-1 rounded">localhost:8501</code></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Data API</td>
                    <td className="py-2 px-2">Finnhub (sanntid)</td>
                    <td className="py-2 px-2">Yahoo Finance</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Database</td>
                    <td className="py-2 px-2">Supabase ✅</td>
                    <td className="py-2 px-2">Ingen (kun session)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">UI Kvalitet</td>
                    <td className="py-2 px-2">Profesjonell</td>
                    <td className="py-2 px-2">Enkel/Funksjonell</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Deployment</td>
                    <td className="py-2 px-2">Vercel (gratis)</td>
                    <td className="py-2 px-2">Streamlit Cloud (gratis)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Fremtidig utvikling</td>
                    <td className="py-2 px-2">✅ Hovedfokus</td>
                    <td className="py-2 px-2">❌ Legacy/backup</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-brand-emerald/10 rounded-xl p-4 border border-brand-emerald/20">
              <h4 className="font-semibold text-brand-emerald mb-2">💡 Anbefaling</h4>
              <p className="text-sm text-gray-700">
                Bruk <strong>Next.js-appen</strong> som hovedapplikasjon. Den har database-støtte,
                bedre UI, og vil få alle nye funksjoner. Streamlit-appen er nyttig som rask
                prototype eller for Python-basert analyse.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-brand-slate mb-3">Kjør begge samtidig:</h4>
              <CodeBlock code={`# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Streamlit
streamlit run app.py

# Nå kan du åpne:
# - http://localhost:3000 (Next.js)
# - http://localhost:8501 (Streamlit)`} />
            </div>
          </div>
        </AccordionSection>

        {/* Database sammenligning */}
        <AccordionSection 
          title="Database: Er Supabase best?" 
          icon={<Database className="w-5 h-5 text-green-500" />}
        >
          <div className="pt-4 space-y-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <h4 className="font-semibold text-green-800 mb-2">Supabase er et godt valg for dette prosjektet</h4>
              <p className="text-green-700 text-sm">
                For en trading-app med moderat trafikk er Supabase en utmerket balanse mellom
                brukervennlighet, ytelse og pris.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold">Database</th>
                    <th className="text-left py-3 px-2 font-semibold">Pris</th>
                    <th className="text-left py-3 px-2 font-semibold">Hastighet</th>
                    <th className="text-left py-3 px-2 font-semibold">Egnet for</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100 bg-green-50">
                    <td className="py-2 px-2 font-medium">Supabase ✅</td>
                    <td className="py-2 px-2">Gratis (500MB)</td>
                    <td className="py-2 px-2">~50-100ms</td>
                    <td className="py-2 px-2">De fleste apps</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">PlanetScale</td>
                    <td className="py-2 px-2">Gratis (5GB)</td>
                    <td className="py-2 px-2">~30-50ms</td>
                    <td className="py-2 px-2">Skalering</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Neon</td>
                    <td className="py-2 px-2">Gratis (3GB)</td>
                    <td className="py-2 px-2">~40-80ms</td>
                    <td className="py-2 px-2">Serverless</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Firebase</td>
                    <td className="py-2 px-2">Gratis (1GB)</td>
                    <td className="py-2 px-2">~20-50ms</td>
                    <td className="py-2 px-2">Realtime apps</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-2">Redis (cache)</td>
                    <td className="py-2 px-2">Gratis (25MB)</td>
                    <td className="py-2 px-2">~1-5ms</td>
                    <td className="py-2 px-2">Caching</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-brand-slate mb-2">✅ Hvorfor Supabase passer</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PostgreSQL = kraftig SQL-database</li>
                  <li>• Innebygd auth (for fremtidig login)</li>
                  <li>• Realtime subscriptions (live oppdateringer)</li>
                  <li>• Enkel JavaScript SDK</li>
                  <li>• Bra dokumentasjon</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-brand-slate mb-2">⚠️ Når bytte?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {`>`}10,000 trades = vurder PlanetScale</li>
                  <li>• Sanntidspriser = legg til Redis cache</li>
                  <li>• {`>`}100 brukere = vurder betalt tier</li>
                  <li>• Global = vurder edge database</li>
                </ul>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* ROADMAP - Fremtidige funksjoner */}
        <AccordionSection 
          title="Roadmap: Planlagte Funksjoner" 
          icon={<Target className="w-5 h-5 text-rose-500" />}
          badge="Kommende"
          badgeColor="bg-rose-500"
        >
          <div className="pt-4 space-y-6">
            <p className="text-gray-600">
              Her er en oversikt over funksjoner som skal utvikles. Prioritet basert på verdi og kompleksitet.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-brand-slate flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Portfolio Management
              </h4>
              <div className="grid gap-3">
                <FeatureCard 
                  title="Enkel Trade-registrering"
                  description="Registrer kjøp med ett klikk - lagrer automatisk til riktig strategi med entry, stop loss og target."
                  icon={<CheckCircle className="w-5 h-5" />}
                  status="in-progress"
                  priority="high"
                />
                <FeatureCard 
                  title="Portfolio Dashboard"
                  description="Oversikt over alle aktive posisjoner med live P/L, total eksponering og sektor-allokering."
                  icon={<PieChart className="w-5 h-5" />}
                  status="planned"
                  priority="high"
                />
                <FeatureCard 
                  title="Trade Journal"
                  description="Historikk over alle trades med statistikk: win rate, gjennomsnittlig gevinst, R-multiple."
                  icon={<BarChart3 className="w-5 h-5" />}
                  status="planned"
                  priority="medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-brand-slate flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Automatisk Analyse
              </h4>
              <div className="grid gap-3">
                <FeatureCard 
                  title="Daglig Portfolio-skanning"
                  description="Automatisk analyse av alle dine aksjer hver morgen. Sjekker tekniske signaler og nyheter."
                  icon={<Clock className="w-5 h-5" />}
                  status="planned"
                  priority="high"
                />
                <FeatureCard 
                  title="Salgssignal-varsler"
                  description="Automatisk varsel når en aksje treffer stop loss, target, eller viser svakhetstegn."
                  icon={<AlertTriangle className="w-5 h-5" />}
                  status="planned"
                  priority="high"
                />
                <FeatureCard 
                  title="Gevinst-sikring"
                  description="Trailing stop-forslag når aksjer går i pluss. Automatisk beregning av nye stop loss-nivåer."
                  icon={<Shield className="w-5 h-5" />}
                  status="planned"
                  priority="medium"
                />
                <FeatureCard 
                  title="Posisjonsstørrelse-kalkulator"
                  description="Anbefalt posisjonsstørrelse basert på porteføljestørrelse, risiko per trade og stop loss."
                  icon={<Target className="w-5 h-5" />}
                  status="planned"
                  priority="medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-brand-slate flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifikasjoner & Nyheter
              </h4>
              <div className="grid gap-3">
                <FeatureCard 
                  title="Push-notifikasjoner"
                  description="Varsler til mobil/desktop når viktige hendelser skjer: signaler, stop loss, nyheter."
                  icon={<Smartphone className="w-5 h-5" />}
                  status="planned"
                  priority="medium"
                />
                <FeatureCard 
                  title="Nyhets-aggregator"
                  description="Samlet nyhetsfeed for alle aksjer i porteføljen. Filtrer på relevans og sentiment."
                  icon={<Newspaper className="w-5 h-5" />}
                  status="planned"
                  priority="medium"
                />
                <FeatureCard 
                  title="Insider-varsler"
                  description="Automatisk varsel når innsidere kjøper/selger i aksjer du følger."
                  icon={<TrendingUp className="w-5 h-5" />}
                  status="planned"
                  priority="low"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-brand-slate flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Avansert Analyse
              </h4>
              <div className="grid gap-3">
                <FeatureCard 
                  title="Dead Money Indicator"
                  description="Varsel når aksjer har stått stille for lenge. Foreslår å flytte kapital til bedre muligheter."
                  icon={<Clock className="w-5 h-5" />}
                  status="done"
                />
                <FeatureCard 
                  title="Sektor-analyse"
                  description="Se hvilke sektorer som er sterke/svake. Unngå overeksponering mot én sektor."
                  icon={<PieChart className="w-5 h-5" />}
                  status="planned"
                  priority="low"
                />
                <FeatureCard 
                  title="Korrelasjon-matrise"
                  description="Analyse av hvordan aksjene i porteføljen korrelerer. Bedre diversifisering."
                  icon={<BarChart3 className="w-5 h-5" />}
                  status="planned"
                  priority="low"
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-brand-slate to-gray-800 rounded-xl p-5 text-white mt-6">
              <h4 className="font-bold mb-2">🎯 MVP (Minimum Viable Product)</h4>
              <p className="text-sm opacity-90 mb-3">
                Første release bør inkludere disse funksjonene:
              </p>
              <ul className="text-sm space-y-1 opacity-90">
                <li>1. ✅ K-Momentum skanner</li>
                <li>2. ✅ Aksje-analyse med signaler</li>
                <li>3. 🔨 Enkel trade-registrering</li>
                <li>4. 📋 Portfolio oversikt</li>
                <li>5. 📋 Daglig analyse av posisjoner</li>
                <li>6. 📋 Salgssignal-varsler</li>
              </ul>
            </div>
          </div>
        </AccordionSection>

        {/* Prosjektarkitektur */}
        <AccordionSection 
          title="Prosjektarkitektur" 
          icon={<Layers className="w-5 h-5 text-brand-emerald" />}
        >
          <div className="pt-4 space-y-6">
            <p className="text-gray-600">
              K-man Island består av <strong>to separate applikasjoner</strong> som kan kjøres uavhengig:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-brand-emerald/10 to-brand-emerald/5 rounded-xl p-5 border border-brand-emerald/20">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-brand-emerald" />
                  <h4 className="font-bold text-brand-slate">Next.js Dashboard</h4>
                  <span className="bg-brand-emerald text-white text-xs px-2 py-0.5 rounded">Hoved</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Hovedapplikasjonen med K-Momentum analyse, database og moderne UI.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Next.js 14 (App Router)</li>
                  <li>• React 18 + TypeScript</li>
                  <li>• TailwindCSS styling</li>
                  <li>• Supabase database</li>
                  <li>• Finnhub API (sanntidsdata)</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-brand-emerald/20">
                  <code className="text-xs bg-brand-emerald/10 px-2 py-1 rounded">npm run dev → localhost:3000</code>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-5 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-brand-slate">Streamlit Scanner</h4>
                  <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded">Legacy</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Alternativ Python-basert aksjesvanner. Nyttig for prototyping.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Python + Streamlit</li>
                  <li>• yfinance (Yahoo Finance)</li>
                  <li>• pandas_ta (teknisk analyse)</li>
                  <li>• Plotly (interaktive grafer)</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <code className="text-xs bg-purple-100 px-2 py-1 rounded">streamlit run app.py → localhost:8501</code>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-brand-slate mb-3">📁 Filstruktur</h4>
              <pre className="text-xs text-gray-600 font-mono overflow-x-auto">
{`k-man-island/
├── src/                        # Next.js app (TypeScript)
│   ├── app/                    # Sider (routing)
│   │   ├── page.tsx            # Dashboard
│   │   ├── markedsskanner/     # Skanner
│   │   ├── analyse/            # Dyp analyse
│   │   └── innstillinger/      # Denne siden
│   ├── components/             # React komponenter
│   └── lib/
│       ├── api/                # API integrasjoner
│       │   ├── finnhub.ts      # Finnhub klient
│       │   └── k-momentum.ts   # K-Momentum algoritme
│       └── supabase/           # Database
├── app.py                      # Streamlit (Python)
├── requirements.txt            # Python avhengigheter
├── package.json                # Node.js avhengigheter
└── .env.local                  # Miljøvariabler`}</pre>
            </div>
          </div>
        </AccordionSection>

        {/* API Nøkler */}
        <AccordionSection 
          title="API-nøkler & Miljøvariabler" 
          icon={<Key className="w-5 h-5 text-amber-500" />}
        >
          <div className="pt-4 space-y-6">
            <p className="text-gray-600">
              Opprett en fil kalt <code className="bg-gray-100 px-2 py-0.5 rounded">.env.local</code> i prosjektroten:
            </p>
            
            <CodeBlock code={`# .env.local

# Supabase (PÅKREVD for database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Finnhub (ANBEFALT for sanntidsdata)
NEXT_PUBLIC_FINNHUB_API_KEY=your-finnhub-key-here`} />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-green-500" />
                  Supabase
                </h4>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Gå til <a href="https://supabase.com" target="_blank" className="text-brand-emerald hover:underline">supabase.com</a></li>
                  <li>2. Logg inn / Opprett konto</li>
                  <li>3. Opprett nytt prosjekt</li>
                  <li>4. Settings → API → Kopier URL og anon key</li>
                </ol>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Finnhub
                </h4>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Gå til <a href="https://finnhub.io" target="_blank" className="text-brand-emerald hover:underline">finnhub.io</a></li>
                  <li>2. Opprett gratis konto</li>
                  <li>3. Dashboard → Kopier API key</li>
                  <li>4. Gratis: 60 kall/min</li>
                </ol>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Installasjon */}
        <AccordionSection 
          title="Installasjon & Kjøring" 
          icon={<Terminal className="w-5 h-5 text-green-500" />}
        >
          <div className="pt-4 space-y-6">
            <div>
              <h4 className="font-semibold text-brand-slate mb-3">1. Forutsetninger</h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-brand-emerald" />
                  <span>Node.js 18+ installert</span>
                  <code className="bg-gray-200 px-2 py-0.5 rounded text-xs ml-auto">node --version</code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-brand-emerald" />
                  <span>npm eller pnpm</span>
                  <code className="bg-gray-200 px-2 py-0.5 rounded text-xs ml-auto">npm --version</code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Python 3.11+ (kun for Streamlit)</span>
                  <code className="bg-gray-200 px-2 py-0.5 rounded text-xs ml-auto">python3 --version</code>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-brand-slate mb-3">2. Installer avhengigheter</h4>
              <CodeBlock code={`# Next.js (hovedapp)
npm install

# Streamlit (valgfritt)
pip3 install -r requirements.txt`} />
            </div>

            <div>
              <h4 className="font-semibold text-brand-slate mb-3">3. Sett opp database</h4>
              <ol className="text-sm text-gray-600 space-y-2 mb-4">
                <li>1. Opprett Supabase-prosjekt på <a href="https://supabase.com" target="_blank" className="text-brand-emerald hover:underline">supabase.com</a></li>
                <li>2. Gå til SQL Editor i Supabase</li>
                <li>3. Kjør innholdet fra <code className="bg-gray-100 px-1 rounded">src/lib/supabase/schema.sql</code></li>
                <li>4. Opprett <code className="bg-gray-100 px-1 rounded">.env.local</code> med API-nøkler</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-brand-slate mb-3">4. Start utviklingsserver</h4>
              <CodeBlock code={`# Start Next.js (port 3000)
npm run dev

# ELLER start Streamlit (port 8501)
streamlit run app.py`} />
            </div>

            <div className="bg-brand-emerald/10 rounded-xl p-4 border border-brand-emerald/20">
              <h4 className="font-semibold text-brand-emerald mb-2">🎉 Ferdig!</h4>
              <p className="text-sm text-gray-700">
                Åpne <a href="http://localhost:3000" className="text-brand-emerald hover:underline font-medium">http://localhost:3000</a> i nettleseren.
              </p>
            </div>
          </div>
        </AccordionSection>

        {/* Deployment */}
        <AccordionSection 
          title="Deploy til Produksjon" 
          icon={<Cloud className="w-5 h-5 text-sky-500" />}
        >
          <div className="pt-4 space-y-6">
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
              <h4 className="font-semibold text-sky-800 mb-2">Raskeste vei til produksjon: Vercel</h4>
              <p className="text-sky-700 text-sm">Vercel er laget av Next.js-teamet. Push til GitHub og det deployes automatisk!</p>
            </div>

            <div>
              <h4 className="font-semibold text-brand-slate mb-3">Steg 1: Push til GitHub</h4>
              <CodeBlock code={`git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/brukernavn/k-man-island.git
git push -u origin main`} />
            </div>

            <div>
              <h4 className="font-semibold text-brand-slate mb-3">Steg 2: Deploy på Vercel</h4>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Gå til <a href="https://vercel.com" target="_blank" className="text-brand-emerald hover:underline">vercel.com</a> → Logg inn med GitHub</li>
                <li>2. &quot;Add New Project&quot; → Importer repo</li>
                <li>3. Legg til miljøvariabler i Settings</li>
                <li>4. Klikk Deploy - ferdig! 🎉</li>
              </ol>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-surface-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">▲</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Vercel</h4>
                    <span className="text-xs text-brand-emerald font-medium">For Next.js</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Gratis hobby-tier, automatisk CI/CD</p>
              </div>
              
              <div className="border border-surface-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">ST</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Streamlit Cloud</h4>
                    <span className="text-xs text-purple-600 font-medium">For Python</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Gratis, koble til GitHub repo</p>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* K-Momentum Strategi */}
        <AccordionSection 
          title="K-Momentum Strategien" 
          icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
        >
          <div className="pt-4 space-y-6">
            <p className="text-gray-600">
              K-Momentum er en systematisk swing-trading strategi designet for å identifisere aksjer med høy sannsynlighet for oppgang.
            </p>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-brand-slate mb-3">Harde filtre (må bestå alle):</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ <strong>SMA50 {`>`} SMA200</strong> - Golden Cross</li>
                <li>✅ <strong>Pris {`>`} SMA50</strong> - Over trenden</li>
                <li>✅ <strong>RSI {`<`} 70</strong> - Ikke overkjøpt</li>
                <li>✅ <strong>Likviditet {`>`} 5M/dag</strong> - Kan handles</li>
                <li>✅ <strong>Innenfor 2% av 20d høy</strong> - Breakout</li>
                <li>✅ <strong>RelVol {`>`} 1.2x</strong> - Økt interesse</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-brand-emerald/10 to-brand-emerald/5 rounded-xl p-4 border border-brand-emerald/20">
              <h4 className="font-semibold text-brand-emerald mb-2">Handelsplan</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Entry:</strong> Ved K-Score {`>`} 70</li>
                <li>• <strong>Stop Loss:</strong> 2x ATR under entry</li>
                <li>• <strong>Target:</strong> 3R (3x risiko)</li>
                <li>• <strong>Tidshorisont:</strong> 15 dager maks</li>
              </ul>
            </div>
          </div>
        </AccordionSection>

        {/* Version Info */}
        <div className="bg-gray-50 rounded-2xl p-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-brand-slate">K-man Island</h3>
              <p className="text-sm text-gray-500">Aero v1.0 · © 2026</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Next.js 14.2.21</p>
              <p>React 18.3.1</p>
              <p>Supabase + Finnhub</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
