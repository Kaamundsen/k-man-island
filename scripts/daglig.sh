#!/bin/bash
# Kjør dette hver dag etter børsen stenger (f.eks. kl 18-19)
# cd /Users/kyrreamundsen/Projects/k-man-island && bash scripts/daglig.sh

set -e
cd "$(dirname "$0")/.."

echo "=== K-MAN DAGLIG PIPELINE $(date '+%Y-%m-%d %H:%M') ==="
echo ""

echo "1/4 Laster priser fra Yahoo Finance (OSE + US)..."
npx tsx scripts/load-prices.ts
echo ""

echo "2/4 Beregner indikatorer..."
npx tsx scripts/run-pipeline.ts
echo ""

echo "3/4 Kjører scanner → lagrer signaler..."
npx tsx scripts/run-scanner.ts
echo ""

echo "4/4 Beregner backtest-resultater..."
npx tsx scripts/compute-signal-results.ts
echo ""

echo "=== FERDIG — åpne https://k-man-island.vercel.app/scanner ==="
