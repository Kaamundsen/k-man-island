/**
 * Seed data - Investtech artikkel fra 16. januar 2026
 * Kjør denne funksjonen én gang for å legge til eksempeldata
 */

import { addInvesttechInsiderList, getArticleTips } from './article-tips';

export function seedInvesttechArticle() {
  // Sjekk om vi allerede har lagt til denne artikkelen
  const existing = getArticleTips();
  if (existing.some(a => a.title.includes('De sterkeste aksjene på innsidehandler') && a.publishedDate === '2026-01-16')) {
    console.log('Investtech-artikkelen er allerede lagt til');
    return;
  }

  addInvesttechInsiderList({
    date: '2026-01-16',
    title: 'Ukens Investtech: De sterkeste aksjene på innsidehandler',
    url: 'https://e24.no/boers-og-finans/i/investtech-analyser',
    summary: 'Ti selskaper får toppscore på Investtechs innsidehandelrangering, tre virker særdeles spennende. 79 av aksjene på Oslo Børs er nå positive på innsidehandler. Statistikk viser at aksjer med innsidekjøp i gjennomsnitt steg 4,7% de etterfølgende 66 børsdagene, mot 2,8% for referanseindeksen.',
    stocks: [
      {
        ticker: 'GOGL',
        name: 'Golden Energy Offshore Services ASA',
        highlight: 'Maksimalt positiv på Investtechs innsidehandelrangering',
      },
      {
        ticker: 'KIT',
        name: 'Kitron',
        highlight: 'Maksimalt positiv på Investtechs innsidehandelrangering',
      },
      {
        ticker: 'ORK',
        name: 'Orkla ASA',
        highlight: '5 innsidekjøp i nov/des. CEO kjøpte for 1,6 mill kr. Teknisk analyse svært positiv på lang sikt, stigende trendkanal. Motstand 115-118 kr.',
        isTopPick: true,
      },
      {
        ticker: 'PPINV',
        name: 'Public Property Invest',
        highlight: '4 kjøp av aksjer + 1 kjøp av opsjoner fra innsidere i desember. Ikke registrert et eneste innsidesalg siden børsnotering mai 2024. Ligger i bred, stigende trendkanal.',
        isTopPick: true,
      },
      {
        ticker: 'PYRUM',
        name: 'Pyrum Innovations',
        highlight: 'Maksimalt positiv på Investtechs innsidehandelrangering',
      },
      {
        ticker: 'SAGA',
        name: 'Saga Pure',
        highlight: 'Maksimalt positiv på Investtechs innsidehandelrangering',
      },
      {
        ticker: 'SMCRT',
        name: 'SmartCraft',
        highlight: 'Maksimalt positiv på Investtechs innsidehandelrangering',
      },
      {
        ticker: 'TEKNA',
        name: 'Tekna Holding ASA',
        highlight: 'Maksimalt positiv på Investtechs innsidehandelrangering',
      },
      {
        ticker: 'VOW',
        name: 'Vow',
        highlight: '14 innsidekjøp siste 12 mnd, null salg! CEO, CFO og styreleder har kjøpt. Fire kjøp i desember på kurser 2,40-2,58 kr. Risikabel aksje med >40% månedlig svingning, men innsidekjøp er risikoreduserende faktor.',
        isTopPick: true,
      },
      {
        ticker: 'ZELA',
        name: 'Zelluna ASA',
        highlight: 'Maksimalt positiv på Investtechs innsidehandelrangering',
      },
    ],
  });

  console.log('✅ Investtech-artikkelen fra 16. januar er lagt til!');
}
