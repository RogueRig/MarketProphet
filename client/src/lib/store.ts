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

export interface StopLossOrder {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  shares: number;
  triggerPrice: number;
  timestamp: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
}

export interface OrderFillNotification {
  id: string;
  type: 'LIMIT_FILL' | 'STOP_LOSS';
  marketTitle: string;
  outcome: 'YES' | 'NO';
  orderType: 'BUY' | 'SELL';
  shares: number;
  price: number;
  timestamp: number;
  read: boolean;
}

export interface Settings {
  maxAllocationPerMarket: number; // 0-100 percentage
}

interface UserState {
  isAuthenticated: boolean;
  email: string | null;
  balance: number;
  positions: Position[];
  trades: Trade[];
  orders: LimitOrder[];
  stopLossOrders: StopLossOrder[];
  notifications: OrderFillNotification[];
  settings: Settings;
  login: (email: string) => void;
  logout: () => void;
  buyShares: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', shares: number, price: number) => void;
  sellShares: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', shares: number, price: number) => void;
  placeLimitOrder: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', type: 'BUY' | 'SELL', shares: number, limitPrice: number) => void;
  placeStopLoss: (marketId: string, marketTitle: string, outcome: 'YES' | 'NO', shares: number, triggerPrice: number) => void;
  cancelOrder: (orderId: string) => void;
  cancelStopLoss: (orderId: string) => void;
  checkOrders: (marketId: string, currentPriceYes: number, currentPriceNo: number) => OrderFillNotification[];
  resolveMarket: (marketId: string, winningOutcome: 'YES' | 'NO') => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  getMarketExposure: (marketId: string) => number;
  canInvestInMarket: (marketId: string, amount: number) => boolean;
}

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      email: null,
      balance: 10000,
      positions: [],
      trades: [],
      orders: [],
      stopLossOrders: [],
      notifications: [],
      settings: {
        maxAllocationPerMarket: 25, // Default 25% max per market
      },
      
      login: (email) => set({ isAuthenticated: true, email }),
      logout: () => set({ 
        isAuthenticated: false, 
        email: null, 
        positions: [], 
        trades: [], 
        orders: [], 
        stopLossOrders: [],
        notifications: [],
        balance: 10000 
      }),
      
      getMarketExposure: (marketId) => {
        const { positions, orders } = get();
        let exposure = 0;
        
        // Current position value
        positions.filter(p => p.marketId === marketId).forEach(p => {
          exposure += p.shares * p.avgPrice;
        });
        
        // Open limit buy orders
        orders.filter(o => o.marketId === marketId && o.status === 'OPEN' && o.type === 'BUY').forEach(o => {
          exposure += o.shares * o.limitPrice;
        });
        
        return exposure;
      },
      
      canInvestInMarket: (marketId, amount) => {
        const { settings, balance, getMarketExposure } = get();
        const totalPortfolio = 10000; // Using initial balance as reference
        const maxAllowed = (settings.maxAllocationPerMarket / 100) * totalPortfolio;
        const currentExposure = getMarketExposure(marketId);
        return (currentExposure + amount) <= maxAllowed;
      },
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },
      
      buyShares: (marketId, marketTitle, outcome, shares, price) => {
        const { balance, positions, trades, canInvestInMarket } = get();
        const cost = shares * price;
        
        if (balance < cost) {
          throw new Error("Insufficient funds");
        }
        
        if (!canInvestInMarket(marketId, cost)) {
          throw new Error("Exceeds max allocation limit for this market");
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
         const { balance, orders, canInvestInMarket } = get();
         
         if (type === 'BUY') {
            const cost = shares * limitPrice;
            if (balance < cost) throw new Error("Insufficient funds for limit order");
            if (!canInvestInMarket(marketId, cost)) throw new Error("Exceeds max allocation limit");
            set({ balance: balance - cost }); 
         } else {
            const { positions } = get();
            const pos = positions.find(p => p.marketId === marketId && p.outcome === outcome);
            if (!pos || pos.shares < shares) throw new Error("Insufficient shares for limit order");
            
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

      placeStopLoss: (marketId, marketTitle, outcome, shares, triggerPrice) => {
         const { positions, stopLossOrders } = get();
         const pos = positions.find(p => p.marketId === marketId && p.outcome === outcome);
         
         if (!pos || pos.shares < shares) {
            throw new Error("Insufficient shares for stop-loss order");
         }

         const newStopLoss: StopLossOrder = {
           id: Math.random().toString(36).substring(7),
           marketId,
           marketTitle,
           outcome,
           shares,
           triggerPrice,
           timestamp: Date.now(),
           status: 'ACTIVE'
         };

         set({ stopLossOrders: [newStopLoss, ...stopLossOrders] });
      },

      cancelOrder: (orderId) => {
         const { orders, balance, positions } = get();
         const order = orders.find(o => o.id === orderId);
         if (!order || order.status !== 'OPEN') return;

         if (order.type === 'BUY') {
            set({ balance: balance + (order.shares * order.limitPrice) });
         } else {
            const existingPositionIndex = positions.findIndex(p => p.marketId === order.marketId && p.outcome === order.outcome);
            let newPositions = [...positions];
            if (existingPositionIndex >= 0) {
               newPositions[existingPositionIndex] = {
                  ...newPositions[existingPositionIndex],
                  shares: newPositions[existingPositionIndex].shares + order.shares
               };
            } else {
               newPositions.push({
                  marketId: order.marketId,
                  outcome: order.outcome,
                  shares: order.shares,
                  avgPrice: 0
               });
            }
            set({ positions: newPositions });
         }

         set({
            orders: orders.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o)
         });
      },

      cancelStopLoss: (orderId) => {
         const { stopLossOrders } = get();
         set({
            stopLossOrders: stopLossOrders.map(o => 
               o.id === orderId ? { ...o, status: 'CANCELLED' } : o
            )
         });
      },

      checkOrders: (marketId, currentPriceYes, currentPriceNo) => {
         const { orders, stopLossOrders, positions, trades, balance, notifications } = get();
         const openOrders = orders.filter(o => o.marketId === marketId && o.status === 'OPEN');
         const activeStopLosses = stopLossOrders.filter(o => o.marketId === marketId && o.status === 'ACTIVE');
         
         let newOrders = [...orders];
         let newStopLosses = [...stopLossOrders];
         let newPositions = [...positions];
         let newTrades = [...trades];
         let newNotifications = [...notifications];
         let newBalance = balance;
         let somethingChanged = false;
         const fillNotifications: OrderFillNotification[] = [];

         // Check limit orders
         openOrders.forEach(order => {
            const currentPrice = order.outcome === 'YES' ? currentPriceYes : currentPriceNo;
            let shouldFill = false;

            if (order.type === 'BUY' && currentPrice <= order.limitPrice) {
               shouldFill = true;
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
               newBalance += order.shares * order.limitPrice;
            }

            if (shouldFill) {
               somethingChanged = true;
               const orderIndex = newOrders.findIndex(o => o.id === order.id);
               newOrders[orderIndex] = { ...order, status: 'FILLED' };
               
               const notification: OrderFillNotification = {
                  id: Math.random().toString(36).substring(7),
                  type: 'LIMIT_FILL',
                  marketTitle: order.marketTitle,
                  outcome: order.outcome,
                  orderType: order.type,
                  shares: order.shares,
                  price: order.limitPrice,
                  timestamp: Date.now(),
                  read: false
               };
               fillNotifications.push(notification);
               newNotifications.unshift(notification);
               
               newTrades.unshift({
                  id: Math.random().toString(36).substring(7),
                  marketId,
                  marketTitle: order.marketTitle,
                  outcome: order.outcome,
                  type: order.type,
                  shares: order.shares,
                  price: order.limitPrice,
                  timestamp: Date.now()
               });
            }
         });

         // Check stop-loss orders
         activeStopLosses.forEach(stopLoss => {
            const currentPrice = stopLoss.outcome === 'YES' ? currentPriceYes : currentPriceNo;
            
            if (currentPrice <= stopLoss.triggerPrice) {
               somethingChanged = true;
               
               // Find position and sell
               const posIndex = newPositions.findIndex(p => p.marketId === marketId && p.outcome === stopLoss.outcome);
               if (posIndex >= 0) {
                  const pos = newPositions[posIndex];
                  const sharesToSell = Math.min(stopLoss.shares, pos.shares);
                  
                  if (sharesToSell > 0) {
                     newBalance += sharesToSell * currentPrice;
                     
                     if (pos.shares <= sharesToSell) {
                        newPositions.splice(posIndex, 1);
                     } else {
                        newPositions[posIndex] = { ...pos, shares: pos.shares - sharesToSell };
                     }
                     
                     const notification: OrderFillNotification = {
                        id: Math.random().toString(36).substring(7),
                        type: 'STOP_LOSS',
                        marketTitle: stopLoss.marketTitle,
                        outcome: stopLoss.outcome,
                        orderType: 'SELL',
                        shares: sharesToSell,
                        price: currentPrice,
                        timestamp: Date.now(),
                        read: false
                     };
                     fillNotifications.push(notification);
                     newNotifications.unshift(notification);
                     
                     newTrades.unshift({
                        id: Math.random().toString(36).substring(7),
                        marketId,
                        marketTitle: stopLoss.marketTitle,
                        outcome: stopLoss.outcome,
                        type: 'SELL',
                        shares: sharesToSell,
                        price: currentPrice,
                        timestamp: Date.now()
                     });
                  }
               }
               
               const slIndex = newStopLosses.findIndex(o => o.id === stopLoss.id);
               newStopLosses[slIndex] = { ...stopLoss, status: 'TRIGGERED' };
            }
         });

         if (somethingChanged) {
            set({ 
               orders: newOrders, 
               stopLossOrders: newStopLosses,
               positions: newPositions, 
               trades: newTrades, 
               balance: newBalance,
               notifications: newNotifications
            });
         }
         
         return fillNotifications;
      },

      resolveMarket: (marketId, winningOutcome) => {
         const { positions, balance, orders, stopLossOrders } = get();
         const relevantPositions = positions.filter(p => p.marketId === marketId);
         
         let payout = 0;
         relevantPositions.forEach(pos => {
            if (pos.outcome === winningOutcome) {
               payout += pos.shares * 1.0;
            }
         });

         const newPositions = positions.filter(p => p.marketId !== marketId);
         
         // Cancel related orders
         const updatedOrders = orders.map(o => 
            o.marketId === marketId && o.status === 'OPEN' ? { ...o, status: 'CANCELLED' as const } : o
         );
         const updatedStopLosses = stopLossOrders.map(o => 
            o.marketId === marketId && o.status === 'ACTIVE' ? { ...o, status: 'CANCELLED' as const } : o
         );
         
         // Refund cancelled buy orders
         let refund = 0;
         orders.filter(o => o.marketId === marketId && o.status === 'OPEN' && o.type === 'BUY').forEach(o => {
            refund += o.shares * o.limitPrice;
         });
         
         set({
            balance: balance + payout + refund,
            positions: newPositions,
            orders: updatedOrders,
            stopLossOrders: updatedStopLosses
         });
      },
      
      markNotificationRead: (id) => {
         const { notifications } = get();
         set({
            notifications: notifications.map(n => n.id === id ? { ...n, read: true } : n)
         });
      },
      
      clearNotifications: () => {
         set({ notifications: [] });
      }
    }),
    {
      name: 'polytrade-storage',
    }
  )
);
