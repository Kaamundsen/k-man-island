import type { DailyBar, MarketDataProvider } from "./types";

function toStooqDate(d: string) {
  // "YYYY-MM-DD" -> "YYYYMMDD"
  return d.replaceAll("-", "");
}

function parseCsv(csv: string): DailyBar[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const out: DailyBar[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [date, open, high, low, close, volume] = line.split(",");
    if (!date || !open || !high || !low || !close) continue;

    out.push({
      date,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: volume ? Number(volume) : undefined,
    });
  }

  // sorter eldste -> nyeste
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export const stooqProvider: MarketDataProvider = {
  async getDailyBars(symbol, fromDate, toDate) {
    const s = symbol
      .trim()
      .toLowerCase()
      .replace(".ol", ".no"); // NHY.OL -> nhy.no

    const d1 = toStooqDate(fromDate);
    const d2 = toStooqDate(toDate);

    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(
      s
    )}&d1=${d1}&d2=${d2}&i=d`;

    const res = await fetch(url, {
      headers: { "user-agent": "k-man-island" },
    });

    if (!res.ok) {
      throw new Error(`Stooq HTTP ${res.status} for ${s}`);
    }

    const text = await res.text();
    if (!text || !text.includes("\n")) return [];

    return parseCsv(text);
  },
};

