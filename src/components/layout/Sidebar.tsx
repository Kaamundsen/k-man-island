'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Markedsskanner', href: '/markedsskanner', icon: Search },
  { name: 'Dyp Analyse', href: '/analyse', icon: TrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-surface border-r border-surface-border h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-emerald flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-slate">K-man Island</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
                            (item.href !== '/' && pathname?.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    isActive
                      ? 'bg-brand-slate text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-slate'
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

      {/* Goal Widget */}
      <div className="px-4 pb-6">
        <div className="bg-gradient-to-br from-brand-slate to-gray-800 rounded-2xl p-6 text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">Målsetning</h3>
          <p className="text-2xl font-bold mb-4">100-200% Avkastning</p>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
              <span className="opacity-75">Progresjon</span>
              <span className="font-semibold">45%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="bg-brand-emerald h-full rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
          
          <p className="text-xs opacity-75 leading-relaxed">
            Swing-trading med momentum strategi for Oslo Børs og US Markets.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400 text-center">
          © 2026 K-man Island · Aero v1
        </p>
      </div>
    </div>
  );
}
