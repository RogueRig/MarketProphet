export interface PolymarketEvent {
  id: string;
  question: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: number;
  liquidity: number;
  startDate: string;
  endDate: string;
  icon?: string;
  category: string;
  history: { time: string; price: number }[];
}

// Enhanced Mock Data
const MOCK_MARKETS: PolymarketEvent[] = [
  {
    id: "1",
    question: "Will Bitcoin hit $100k in 2026?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.65", "0.35"],
    volume: 12500000,
    liquidity: 450000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png",
    category: "Crypto",
    history: Array.from({ length: 20 }, (_, i) => ({ time: `Day ${i+1}`, price: 0.5 + (Math.random() * 0.2 - 0.1) }))
  },
  {
    id: "2",
    question: "US GDP growth > 2% in Q1 2026?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.42", "0.58"],
    volume: 3200000,
    liquidity: 120000,
    startDate: "2026-01-01",
    endDate: "2026-04-30",
    icon: "https://cdn-icons-png.flaticon.com/512/330/330430.png",
    category: "Economics",
    history: Array.from({ length: 20 }, (_, i) => ({ time: `Day ${i+1}`, price: 0.4 + (Math.random() * 0.1 - 0.05) }))
  },
  {
    id: "3",
    question: "SpaceX Starship orbital flight success in Feb?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.88", "0.12"],
    volume: 5600000,
    liquidity: 210000,
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/SpaceX_Logo_Black.svg/2560px-SpaceX_Logo_Black.svg.png",
    category: "Science",
    history: Array.from({ length: 20 }, (_, i) => ({ time: `Day ${i+1}`, price: 0.8 + (Math.random() * 0.15 - 0.05) }))
  },
  {
    id: "4",
    question: "Fed interest rate cut in March 2026?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.30", "0.70"],
    volume: 8900000,
    liquidity: 340000,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Seal_of_the_United_States_Federal_Reserve_System.svg/1200px-Seal_of_the_United_States_Federal_Reserve_System.svg.png",
    category: "Economics",
    history: Array.from({ length: 20 }, (_, i) => ({ time: `Day ${i+1}`, price: 0.3 + (Math.random() * 0.1 - 0.05) }))
  },
  {
    id: "5",
    question: "Will GTA VI release date be announced by June?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.55", "0.45"],
    volume: 14500000,
    liquidity: 550000,
    startDate: "2026-01-01",
    endDate: "2026-06-30",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Rockstar_Games_Logo.svg/1200px-Rockstar_Games_Logo.svg.png",
    category: "Gaming",
    history: Array.from({ length: 20 }, (_, i) => ({ time: `Day ${i+1}`, price: 0.5 + (Math.random() * 0.1 - 0.05) }))
  },
  {
    id: "6",
    question: "Apple to announce foldable iPhone in 2026?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.25", "0.75"],
    volume: 4500000,
    liquidity: 180000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    icon: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    category: "Tech",
    history: Array.from({ length: 20 }, (_, i) => ({ time: `Day ${i+1}`, price: 0.25 + (Math.random() * 0.05 - 0.02) }))
  }
];

export async function fetchMarkets(): Promise<PolymarketEvent[]> {
  // Simulate live price updates by slightly jittering prices
  MOCK_MARKETS.forEach(m => {
    const change = (Math.random() * 0.02) - 0.01;
    let newYes = parseFloat(m.outcomePrices[0]) + change;
    if (newYes > 0.99) newYes = 0.99;
    if (newYes < 0.01) newYes = 0.01;
    m.outcomePrices[0] = newYes.toFixed(2);
    m.outcomePrices[1] = (1 - newYes).toFixed(2);
  });

  await new Promise(resolve => setTimeout(resolve, 300)); // Faster for live feel
  return [...MOCK_MARKETS];
}

export async function fetchMarket(id: string): Promise<PolymarketEvent | undefined> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const market = MOCK_MARKETS.find(m => m.id === id);
  if (market) {
     // Jitter specific market for "live ticker" effect
     const change = (Math.random() * 0.01) - 0.005;
     let newYes = parseFloat(market.outcomePrices[0]) + change;
     if (newYes > 0.99) newYes = 0.99;
     if (newYes < 0.01) newYes = 0.01;
     market.outcomePrices[0] = newYes.toFixed(2);
     market.outcomePrices[1] = (1 - newYes).toFixed(2);
     return { ...market };
  }
  return undefined;
}
