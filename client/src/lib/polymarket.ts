// Mock data for fallback when API fails or for specific demo purposes
const MOCK_MARKETS = [
  {
    id: "1",
    question: "Will Bitcoin hit $100k in 2026?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.65", "0.35"],
    volume: 12500000,
    liquidity: 450000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png"
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
    icon: "https://cdn-icons-png.flaticon.com/512/330/330430.png"
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
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/SpaceX_Logo_Black.svg/2560px-SpaceX_Logo_Black.svg.png"
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
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Seal_of_the_United_States_Federal_Reserve_System.svg/1200px-Seal_of_the_United_States_Federal_Reserve_System.svg.png"
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
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Rockstar_Games_Logo.svg/1200px-Rockstar_Games_Logo.svg.png"
  }
];

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
}

export async function fetchMarkets(): Promise<PolymarketEvent[]> {
  // In a real simulation, we might try to fetch from Gamma API
  // const response = await fetch('https://gamma-api.polymarket.com/events?limit=20&active=true&closed=false');
  // if (!response.ok) throw new Error('Failed to fetch markets');
  // const data = await response.json();
  // return data;

  // Returning mock data for stability in this prototype environment
  // Simulating network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_MARKETS;
}

export async function fetchMarket(id: string): Promise<PolymarketEvent | undefined> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_MARKETS.find(m => m.id === id);
}
