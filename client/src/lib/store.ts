import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Position {
  marketId: string;
  outcome: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
}

export interface Trade {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  timestamp: number;
}

interface UserState {
  isAuthenticated: boolean;
  email: string | null;
  balance: number;
  positions: Position[];
  trades: Trade[];
  login: (email: string) => void;
  logout: () => void;
  buyShares: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', shares: number, price: number) => void;
  sellShares: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', shares: number, price: number) => void;
}

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      email: null,
      balance: 10000,
      positions: [],
      trades: [],
      login: (email) => set({ isAuthenticated: true, email }),
      logout: () => set({ isAuthenticated: false, email: null, positions: [], trades: [], balance: 10000 }),
      buyShares: (marketId, marketTitle, outcome, shares, price) => {
        const { balance, positions, trades } = get();
        const cost = shares * price;
        
        if (balance < cost) {
          throw new Error("Insufficient funds");
        }

        const newTrade: Trade = {
          id: Math.random().toString(36).substring(7),
          marketId,
          marketTitle,
          outcome,
          type: 'BUY',
          shares,
          price,
          timestamp: Date.now(),
        };

        const existingPositionIndex = positions.findIndex(p => p.marketId === marketId && p.outcome === outcome);
        let newPositions = [...positions];

        if (existingPositionIndex >= 0) {
          const pos = newPositions[existingPositionIndex];
          const totalShares = pos.shares + shares;
          const totalCost = (pos.shares * pos.avgPrice) + cost;
          newPositions[existingPositionIndex] = {
            ...pos,
            shares: totalShares,
            avgPrice: totalCost / totalShares
          };
        } else {
          newPositions.push({
            marketId,
            outcome,
            shares,
            avgPrice: price
          });
        }

        set({
          balance: balance - cost,
          positions: newPositions,
          trades: [newTrade, ...trades]
        });
      },
      sellShares: (marketId, marketTitle, outcome, shares, price) => {
        const { balance, positions, trades } = get();
        const existingPositionIndex = positions.findIndex(p => p.marketId === marketId && p.outcome === outcome);

        if (existingPositionIndex === -1 || positions[existingPositionIndex].shares < shares) {
           throw new Error("Insufficient shares");
        }

        const revenue = shares * price;
        const newTrade: Trade = {
          id: Math.random().toString(36).substring(7),
          marketId,
          marketTitle,
          outcome,
          type: 'SELL',
          shares,
          price,
          timestamp: Date.now(),
        };

        let newPositions = [...positions];
        const pos = newPositions[existingPositionIndex];
        
        if (pos.shares === shares) {
          newPositions.splice(existingPositionIndex, 1);
        } else {
          newPositions[existingPositionIndex] = {
            ...pos,
            shares: pos.shares - shares
          };
        }

        set({
          balance: balance + revenue,
          positions: newPositions,
          trades: [newTrade, ...trades]
        });
      }
    }),
    {
      name: 'polytrade-storage',
    }
  )
);
