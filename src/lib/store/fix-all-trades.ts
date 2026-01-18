/**
 * FIX ALL TRADES SCRIPT
 * 
 * Kjør dette i nettleserens konsoll for å fikse alle trades med korrekte datoer.
 * Åpne DevTools (F12) → Console → Lim inn scriptet → Trykk Enter
 */

const CORRECT_TRADES = [
  // 2026
  { date: '2026-01-12', ticker: 'NHY.OL', name: 'Norsk Hydro', quantity: 120, price: 81.88, portfolio: 'portfolio-mixed', strategy: 'MOMENTUM_TREND' },
  { date: '2026-01-12', ticker: 'AKRBP.OL', name: 'Aker BP', quantity: 40, price: 262.00, portfolio: 'portfolio-mixed', strategy: 'UKENS_AKSJE' },
  
  // 2025
  { date: '2025-11-19', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 1600, price: 31.80, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2025-11-19', ticker: 'SATS.OL', name: 'SATS', quantity: 400, price: 35.10, portfolio: 'portfolio-mixed', strategy: 'MOMENTUM_TREND' },
  { date: '2025-10-31', ticker: 'PROT.OL', name: 'Protector Forsikring', quantity: 22, price: 458.00, portfolio: 'portfolio-mixed', strategy: 'BUFFETT' },
  { date: '2025-10-28', ticker: 'KID.OL', name: 'Kid', quantity: 80, price: 140.00, portfolio: 'portfolio-mixed', strategy: 'MOMENTUM_TREND' },
  { date: '2025-10-10', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 735, price: 33.90, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2025-04-11', ticker: 'NOD.OL', name: 'Nordic Semiconductor', quantity: 370, price: 103.10, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID' },
  { date: '2025-03-28', ticker: 'NOVO-B.CO', name: 'Novo Nordisk B', quantity: 20, price: 477.00, portfolio: 'portfolio-mixed', strategy: 'BUFFETT' },
  { date: '2025-02-26', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 265, price: 32.12, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2025-02-11', ticker: 'SATS.OL', name: 'SATS', quantity: 400, price: 28.25, portfolio: 'portfolio-mixed', strategy: 'MOMENTUM_TREND' },
  { date: '2025-01-23', ticker: 'KIT.OL', name: 'Kitron', quantity: 250, price: 39.20, portfolio: 'portfolio-mixed', strategy: 'MOMENTUM_TREND' },
  
  // 2024
  { date: '2024-12-12', ticker: 'HAUTO.OL', name: 'Höegh Autoliners', quantity: 100, price: 107.00, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2024-12-12', ticker: 'MPCC.OL', name: 'MPC Container Ships', quantity: 500, price: 20.50, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2024-11-28', ticker: 'MPCC.OL', name: 'MPC Container Ships', quantity: 1000, price: 21.80, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2024-11-27', ticker: 'TGS.OL', name: 'TGS', quantity: 200, price: 105.20, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID' },
  { date: '2024-11-27', ticker: 'HAUTO.OL', name: 'Höegh Autoliners', quantity: 200, price: 123.90, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2024-11-27', ticker: 'WAWI.OL', name: 'Wallenius Wilhelmsen', quantity: 200, price: 106.00, portfolio: 'portfolio-mixed', strategy: 'MOMENTUM_TREND' },
  { date: '2024-08-05', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 200, price: 32.73, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2024-08-02', ticker: 'NOD.OL', name: 'Nordic Semiconductor', quantity: 80, price: 131.50, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID' },
  { date: '2024-07-26', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 530, price: 35.20, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2024-07-26', ticker: 'NOD.OL', name: 'Nordic Semiconductor', quantity: 150, price: 134.40, portfolio: 'portfolio-mixed', strategy: 'TVEITEREID' },
  { date: '2024-04-19', ticker: 'VAR.OL', name: 'Vår Energi', quantity: 270, price: 37.00, portfolio: 'portfolio-dividend', strategy: 'DIVIDEND_HUNTER' },
  { date: '2024-04-16', ticker: 'AKRBP.OL', name: 'Aker BP', quantity: 35, price: 290.00, portfolio: 'portfolio-mixed', strategy: 'MOMENTUM_TREND' },
  { date: '2024-04-03', ticker: 'KIT.OL', name: 'Kitron', quantity: 300, price: 32.48, portfolio: 'portfolio-mixed', strategy: 'MOMENTUM_TREND' },
];

// Console script - kopier alt under denne linjen til konsollen:
console.log('🔧 Fikser alle trades...');

const trades = CORRECT_TRADES.map((t, index) => ({
  id: `trade-fixed-${Date.now()}-${index}`,
  ticker: t.ticker,
  name: t.name,
  entryPrice: t.price,
  quantity: t.quantity,
  entryDate: t.date,
  portfolioId: t.portfolio,
  strategyId: t.strategy,
  stopLoss: t.price * 0.9,
  target: t.price * 1.15,
  timeHorizonEnd: new Date(new Date(t.date).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'ACTIVE',
  notes: '',
}));

localStorage.setItem('kman_trades', JSON.stringify(trades));
console.log(`✅ ${trades.length} trades lagret med korrekte datoer!`);
console.log('🔄 Refresh siden for å se endringene.');
