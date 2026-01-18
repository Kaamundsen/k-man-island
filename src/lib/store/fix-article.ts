/**
 * Engangs-script for å fikse eksisterende artikler i localStorage
 * Fjerner feildetekterte "to selskaper" etc.
 */

export function fixExistingArticles(): { fixed: number; removed: string[] } {
  if (typeof window === 'undefined') return { fixed: 0, removed: [] };
  
  const STORAGE_KEY = 'k-man-article-tips';
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) return { fixed: 0, removed: [] };
  
  const articles = JSON.parse(stored);
  const removed: string[] = [];
  let fixed = 0;
  
  // Ord/fraser som skal fjernes fra mentions
  const invalidMentions = [
    'to selskaper', 'tre selskaper', 'fire selskaper', 'fem selskaper',
    'et selskap', 'ett selskap', 'external', 'EXTERNAL',
    'saudi', 'arabia', 'new york', 'stock exchange',
  ];
  
  for (const article of articles) {
    if (article.mentions && Array.isArray(article.mentions)) {
      const originalCount = article.mentions.length;
      
      article.mentions = article.mentions.filter((m: { ticker: string; stockName: string }) => {
        const tickerLower = m.ticker?.toLowerCase() || '';
        const nameLower = m.stockName?.toLowerCase() || '';
        
        // Fjern hvis ticker eller navn matcher ugyldige
        const isInvalid = invalidMentions.some(invalid => 
          tickerLower.includes(invalid) || nameLower.includes(invalid)
        );
        
        if (isInvalid) {
          removed.push(`${m.stockName} (${m.ticker})`);
          return false;
        }
        return true;
      });
      
      if (article.mentions.length < originalCount) {
        fixed++;
      }
    }
  }
  
  // Lagre tilbake
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  
  return { fixed, removed };
}

// Kjør automatisk når filen importeres (kan kalles fra konsoll eller komponent)
if (typeof window !== 'undefined') {
  // Eksporter til window for enkel tilgang fra konsoll
  (window as unknown as { fixArticles: typeof fixExistingArticles }).fixArticles = fixExistingArticles;
}
