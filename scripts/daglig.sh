#!/bin/bash
# Kjør dette hver dag etter børsen stenger (f.eks. kl 18-19)
# cd /Users/kyrreamundsen/Projects/k-man-island && bash scripts/daglig.sh

set -e
cd "$(dirname "$0")/.."

echo "=== K-MAN DAGLIG PIPELINE $(date '+%Y-%m-%d %H:%M') ==="
echo ""

echo "1/3 Laster priser fra Yahoo Finance..."
npx tsx scripts/load-prices.ts
echo ""

echo "2/3 Beregner indikatorer..."
npx tsx scripts/run-pipeline.ts
echo ""

echo "3/3 Kjører scanner..."
npx tsx scripts/run-scanner.ts
echo ""

echo "=== FERDIG — åpne https://k-man-island.vercel.app/scanner ==="
