// Market Provider - Manages data source selection (Yahoo vs Finnhub)
// Default: Yahoo Finance
// Finnhub only used if FINNHUB_ENABLED === "true" and FINNHUB_API_KEY is set

export type MarketProvider = 'yahoo' | 'finnhub';

// Track if Finnhub has failed this session to prevent spam
let finnhubDisabledForSession = false;

// Check if Finnhub is enabled via environment variables
export function isFinnhubEnabled(): boolean {
  // If already disabled for this session due to errors, return false
  if (finnhubDisabledForSession) {
    return false;
  }
  
  const enabled = process.env.FINNHUB_ENABLED === 'true' || 
                  process.env.NEXT_PUBLIC_FINNHUB_ENABLED === 'true';
  const hasKey = !!(process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY);
  
  return enabled && hasKey;
}

// Get the current market provider
export function getMarketProvider(): MarketProvider {
  return isFinnhubEnabled() ? 'finnhub' : 'yahoo';
}

// Disable Finnhub for the rest of this session (after errors)
export function disableFinnhubForSession(reason: string): void {
  if (!finnhubDisabledForSession) {
    console.log(`⚠️ Finnhub disabled for session: ${reason}`);
    finnhubDisabledForSession = true;
  }
}

// Check if Finnhub error should trigger session disable
export function handleFinnhubError(status: number, message?: string): void {
  // Disable on auth errors, rate limits, or empty responses
  if (status === 401 || status === 403 || status === 429) {
    disableFinnhubForSession(`HTTP ${status}`);
  } else if (message?.includes('empty') || message?.includes('no data')) {
    disableFinnhubForSession('Empty response');
  }
}

// Log provider status (call once at startup)
export function logProviderStatus(): void {
  const provider = getMarketProvider();
  if (provider === 'finnhub') {
    console.log('📊 Finnhub enabled');
  } else {
    console.log('📊 Using Yahoo Finance (default)');
  }
}

// Get Finnhub API key (safely, never log it)
export function getFinnhubApiKey(): string | undefined {
  return process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
}
