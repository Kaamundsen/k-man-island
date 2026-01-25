// NewsWeb Integration - Fetches PDMR (insider trading) notices from Oslo Børs NewsWeb

export interface InsiderNotice {
  id: string;
  ticker: string;
  company: string;
  person: string;
  position: string;
  transactionType: 'buy' | 'sell';
  shares: number;
  price: number;
  totalValue: number;
  date: string;
  source: 'newsweb';
}

// Parse insider notices from NewsWeb HTML
export function parseInsiderNotices(html: string): InsiderNotice[] {
  const notices: InsiderNotice[] = [];
  
  try {
    // Look for PDMR transaction patterns in the HTML
    // NewsWeb format typically includes structured data about insider trades
    
    // Pattern for PDMR messages - this is a simplified parser
    // Real implementation would need proper HTML parsing
    const pdmrPattern = /PDMR|Primary\s+insider|Meldepliktig\s+handel/gi;
    
    if (!pdmrPattern.test(html)) {
      return notices;
    }
    
    // Extract table rows or structured data
    // This is a placeholder - actual implementation depends on NewsWeb HTML structure
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    
    for (const row of rows) {
      // Try to extract ticker, person, transaction details
      const tickerMatch = row.match(/([A-Z]{2,5})\.OL|ticker["\s:]+([A-Z]{2,5})/i);
      const amountMatch = row.match(/(\d{1,3}(?:\s?\d{3})*(?:,\d+)?)\s*(?:aksjer|shares)/i);
      const priceMatch = row.match(/(?:NOK|kr)\s*(\d+(?:[.,]\d+)?)/i);
      const buyMatch = /kjøp|buy|erverv/i.test(row);
      const sellMatch = /salg|sell|avhend/i.test(row);
      
      if (tickerMatch && (buyMatch || sellMatch)) {
        const ticker = (tickerMatch[1] || tickerMatch[2]).toUpperCase();
        const shares = amountMatch ? parseInt(amountMatch[1].replace(/\s/g, '').replace(',', '')) : 0;
        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
        
        notices.push({
          id: `nw-${ticker}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ticker: `${ticker}.OL`,
          company: ticker, // Would need company name lookup
          person: 'Unknown', // Would need to extract from HTML
          position: 'Insider',
          transactionType: buyMatch ? 'buy' : 'sell',
          shares,
          price,
          totalValue: shares * price,
          date: new Date().toISOString().split('T')[0],
          source: 'newsweb',
        });
      }
    }
  } catch (error) {
    console.error('Error parsing NewsWeb HTML:', error);
  }
  
  return notices;
}

// Fetch insider notices from NewsWeb
export async function fetchInsiderNotices(): Promise<InsiderNotice[]> {
  try {
    // NewsWeb URL for PDMR messages
    const url = 'https://newsweb.oslobors.no/search?category=PDMR';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; K-Man-Island/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.error(`NewsWeb fetch failed: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    return parseInsiderNotices(html);
  } catch (error) {
    console.error('Error fetching from NewsWeb:', error);
    return [];
  }
}

// Get insider activity for a specific ticker
export async function getInsiderActivityForTicker(ticker: string): Promise<InsiderNotice[]> {
  const allNotices = await fetchInsiderNotices();
  const normalizedTicker = ticker.toUpperCase().replace('.OL', '');
  
  return allNotices.filter(notice => 
    notice.ticker.toUpperCase().replace('.OL', '') === normalizedTicker
  );
}

// Get recent insider buys (for insider strategy)
export async function getRecentInsiderBuys(days: number = 30): Promise<InsiderNotice[]> {
  const allNotices = await fetchInsiderNotices();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return allNotices.filter(notice => 
    notice.transactionType === 'buy' && 
    new Date(notice.date) >= cutoffDate
  );
}
