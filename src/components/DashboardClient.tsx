'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardContent from '@/components/DashboardContent';
import { Stock } from '@/lib/types';

interface DashboardClientProps {
  initialStocks: Stock[];
  initialTimestamp: string;
}

export default function DashboardClient({ initialStocks, initialTimestamp }: DashboardClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(initialTimestamp);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Trigger a server-side refresh by revalidating the page
      router.refresh();
      setLastUpdated(new Date().toISOString());
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [router]);

  return (
    <DashboardContent
      initialStocks={initialStocks}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      lastUpdated={lastUpdated}
    />
  );
}
