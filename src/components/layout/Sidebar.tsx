'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  TrendingUp,
  Briefcase,
  FileText,
  Building2,
  Newspaper,
  Wrench,
  Target,
  BookOpen,
  Settings2,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Portefølje', href: '/portefolje', icon: Briefcase },
  { name: 'Rapport', href: '/rapport', icon: FileText },
  { name: 'Markedsskanner', href: '/markedsskanner', icon: Search },
  { name: 'Analysthus', href: '/analysthus', icon: Building2 },
  { name: 'Artikler', href: '/artikler', icon: Newspaper },
  { name: 'Verktøy', href: '/verktoy', icon: Wrench },
  { name: 'Dyp Analyse', href: '/analyse', icon: TrendingUp },
  { name: 'Strategier', href: '/strategier', icon: Target },
  { name: 'Brukerveiledning', href: '/guide', icon: BookOpen },
  { name: 'System', href: '/system', icon: Settings2 },
  { name: 'Innstillinger', href: '/innstillinger', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isGoalOpen, setIsGoalOpen] = useState(false);

  // Progress percentage for the goal
  const progressPercent = 45;

  return (
    <div className="w-72 bg-surface dark:bg-dark-surface border-r border-surface-border dark:border-dark-border h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-surface-border dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-emerald flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-slate dark:text-white">K-man Island</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
                            (item.href !== '/' && pathname?.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all',
                    isActive
                      ? 'bg-brand-slate dark:bg-brand-emerald text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-border hover:text-brand-slate dark:hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5" strokeWidth={2} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Målet Accordion - always shows progress bar */}
      <div className="px-4 pb-6 space-y-3">
        <div className="bg-gradient-to-br from-brand-slate to-gray-800 dark:from-dark-border dark:to-dark-surface rounded-2xl overflow-hidden">
          <button
            onClick={() => setIsGoalOpen(!isGoalOpen)}
            className="w-full p-4 text-white hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Målet</h3>
              {isGoalOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
            {/* Progress bar always visible */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="opacity-75">Progresjon</span>
                <span className="font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-brand-emerald h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </button>
          
          {/* Expanded content */}
          {isGoalOpen && (
            <div className="px-4 pb-4 pt-0">
              <p className="text-2xl font-bold mb-3 text-white">100-200% Avkastning</p>
              <p className="text-xs opacity-75 leading-relaxed text-white">
                Swing-trading med momentum strategi for Oslo Børs og US Markets.
              </p>
            </div>
          )}
        </div>
        
        <div className="pt-3 flex justify-center">
          <ThemeToggle />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          © 2026 K-man Island · Aero v1
        </p>
      </div>
    </div>
  );
}
