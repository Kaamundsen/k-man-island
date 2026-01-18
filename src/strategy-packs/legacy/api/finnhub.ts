export type FinnhubConfig = {
  apiKey?: string;
};

export interface InsiderTransaction {
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionDate: string;
  transactionCode: string;
  transactionPrice: number;
}

export async function getFinnhubQuote(_symbol: string, _config?: FinnhubConfig) {
  return null;
}

export async function getFinnhubCandles(
  _symbol: string,
  _fromDateOrDays?: string | number,
  _toDate?: string,
  _config?: FinnhubConfig
) {
  return [];
}

export async function getInsiderTransactions(_symbol: string, _config?: FinnhubConfig) {
  return [];
}
