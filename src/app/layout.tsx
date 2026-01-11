import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
