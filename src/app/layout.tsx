import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'K-man Island | Investment Dashboard',
  description: 'Strategisk porteføljestyring for Oslo Børs og US Markets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className="min-h-screen bg-surface-muted">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-72">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
