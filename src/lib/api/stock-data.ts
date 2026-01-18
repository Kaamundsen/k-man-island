import { Stock } from '../types';

export * from "./stock-data-v2";

// AnalysePage kaller uten args og forventer en liste
export async function fetchLiveStockData(): Promise<Stock[]> {
  return [];
}
