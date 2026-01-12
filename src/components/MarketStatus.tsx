'use client';

import { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';

export default function MarketStatus() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if market is open (Monday-Friday, 9:00-16:20 Oslo time)
    const checkMarketStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Weekend check
      if (day === 0 || day === 6) {
        setIsOpen(false);
        return;
      }
      
      // Market hours check (9:00 - 16:20)
      const currentMinutes = hours * 60 + minutes;
      const marketOpen = 9 * 60; // 9:00
      const marketClose = 16 * 60 + 20; // 16:20
      
      setIsOpen(currentMinutes >= marketOpen && currentMinutes < marketClose);
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Circle 
        className={`w-2.5 h-2.5 ${isOpen ? 'text-brand-emerald fill-brand-emerald' : 'text-gray-400 fill-gray-400'}`}
      />
      <span className={`font-semibold text-sm ${isOpen ? 'text-brand-emerald' : 'text-gray-500'}`}>
        {isOpen ? 'Børsen er Åpen' : 'Børsen er Stengt'}
      </span>
    </div>
  );
}
