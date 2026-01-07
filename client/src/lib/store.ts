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

export interface LimitOrder {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  type: 'BUY' | 'SELL';
  shares: number;
  limitPrice: number;
  timestamp: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
}

interface UserState {
  isAuthenticated: boolean;
  email: string | null;
  balance: number;
  positions: Position[];
  trades: Trade[];
  orders: LimitOrder[];
  login: (email: string) => void;
  logout: () => void;
  buyShares: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', shares: number, price: number) => void;
  sellShares: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', shares: number, price: number) => void;
  placeLimitOrder: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', type: 'BUY' | 'SELL', shares: number, limitPrice: number) => void;
  cancelOrder: (orderId: string) => void;
  checkOrders: (marketId: string, currentPriceYes: number, currentPriceNo: number) => void; // Simulate order matching
  resolveMarket: (marketId: string, winningOutcome: 'YES' | 'NO') => void;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      email: null,
      balance: 10000,
      positions: [],
      trades: [],
      orders: [],
      login: (email) => set({ isAuthenticated: true, email }),
      logout: () => set({ isAuthenticated: false, email: null, positions: [], trades: [], orders: [], balance: 10000 }),
      
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
      },

      placeLimitOrder: (marketId, marketTitle, outcome, type, shares, limitPrice) => {
         const { balance, orders } = get();
         
         if (type === 'BUY') {
            const cost = shares * limitPrice;
            if (balance < cost) throw new Error("Insufficient funds for limit order");
            // Reserve funds immediately
            set({ balance: balance - cost }); 
         } else {
            // For SELL orders, we should check share balance, but for limit orders we reserve shares
            // Simplified: we'll check at execution time or reserve now. Let's reserve now.
            const { positions } = get();
            const pos = positions.find(p => p.marketId === marketId && p.outcome === outcome);
            if (!pos || pos.shares < shares) throw new Error("Insufficient shares for limit order");
            
            // Deduct shares immediately
             const existingPositionIndex = positions.findIndex(p => p.marketId === marketId && p.outcome === outcome);
             let newPositions = [...positions];
             if (pos.shares === shares) {
                newPositions.splice(existingPositionIndex, 1);
             } else {
                newPositions[existingPositionIndex] = { ...pos, shares: pos.shares - shares };
             }
             set({ positions: newPositions });
         }

         const newOrder: LimitOrder = {
           id: Math.random().toString(36).substring(7),
           marketId,
           marketTitle,
           outcome,
           type,
           shares,
           limitPrice,
           timestamp: Date.now(),
           status: 'OPEN'
         };

         set({ orders: [newOrder, ...orders] });
      },

      cancelOrder: (orderId) => {
         const { orders, balance, positions } = get();
         const order = orders.find(o => o.id === orderId);
         if (!order || order.status !== 'OPEN') return;

         // Refund reserved assets
         if (order.type === 'BUY') {
            set({ balance: balance + (order.shares * order.limitPrice) });
         } else {
            // Refund shares
            const existingPositionIndex = positions.findIndex(p => p.marketId === order.marketId && p.outcome === order.outcome);
            let newPositions = [...positions];
            if (existingPositionIndex >= 0) {
               newPositions[existingPositionIndex].shares += order.shares;
            } else {
               newPositions.push({
                  marketId: order.marketId,
                  outcome: order.outcome,
                  shares: order.shares,
                  avgPrice: 0 // Avg price is tricky on refund, keep simple
               });
            }
            set({ positions: newPositions });
         }

         set({
            orders: orders.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o)
         });
      },

      checkOrders: (marketId, currentPriceYes, currentPriceNo) => {
         const { orders, positions, trades, balance } = get();
         const openOrders = orders.filter(o => o.marketId === marketId && o.status === 'OPEN');
         
         let newOrders = [...orders];
         let newPositions = [...positions];
         let newTrades = [...trades];
         let newBalance = balance;
         let somethingChanged = false;

         openOrders.forEach(order => {
            const currentPrice = order.outcome === 'YES' ? currentPriceYes : currentPriceNo;
            let shouldFill = false;

            if (order.type === 'BUY' && currentPrice <= order.limitPrice) {
               shouldFill = true;
               // Fund deduction already happened on placement
               // Add shares
                const existingPositionIndex = newPositions.findIndex(p => p.marketId === marketId && p.outcome === order.outcome);
                if (existingPositionIndex >= 0) {
                  const pos = newPositions[existingPositionIndex];
                  const totalShares = pos.shares + order.shares;
                  const totalCost = (pos.shares * pos.avgPrice) + (order.shares * order.limitPrice);
                  newPositions[existingPositionIndex] = { ...pos, shares: totalShares, avgPrice: totalCost / totalShares };
                } else {
                  newPositions.push({ marketId, outcome: order.outcome, shares: order.shares, avgPrice: order.limitPrice });
                }
            } else if (order.type === 'SELL' && currentPrice >= order.limitPrice) {
               shouldFill = true;
               // Share deduction already happened
               // Add cash
               newBalance += order.shares * order.limitPrice;
            }

            if (shouldFill) {
               somethingChanged = true;
               const orderIndex = newOrders.findIndex(o => o.id === order.id);
               newOrders[orderIndex] = { ...order, status: 'FILLED' };
               newTrades.unshift({
                  id: Math.random().toString(36).substring(7),
                  marketId,
                  marketTitle: order.marketTitle,
                  outcome: order.outcome,
                  type: order.type,
                  shares: order.shares,
                  price: order.limitPrice, // Filled at limit price
                  timestamp: Date.now()
               });
            }
         });

         if (somethingChanged) {
            set({ orders: newOrders, positions: newPositions, trades: newTrades, balance: newBalance });
         }
      },

      resolveMarket: (marketId, winningOutcome) => {
         const { positions, balance } = get();
         const relevantPositions = positions.filter(p => p.marketId === marketId);
         
         let payout = 0;
         relevantPositions.forEach(pos => {
            if (pos.outcome === winningOutcome) {
               payout += pos.shares * 1.0; // Pays out $1 per share
            }
         });

         const newPositions = positions.filter(p => p.marketId !== marketId);
         
         set({
            balance: balance + payout,
            positions: newPositions
         });
      }
    }),
    {
      name: 'polytrade-storage',
    }
  )
);
