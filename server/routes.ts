import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { insertTradeSchema, insertLimitOrderSchema, insertStopLossOrderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get user profile (balance, settings)
  app.get("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        balance: user.balance,
        maxAllocationPerMarket: user.maxAllocationPerMarket
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user settings
  app.patch("/api/user/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { maxAllocationPerMarket } = req.body;
      
      if (typeof maxAllocationPerMarket !== 'number' || maxAllocationPerMarket < 5 || maxAllocationPerMarket > 100) {
        return res.status(400).json({ message: "Invalid allocation percentage" });
      }
      
      await storage.updateUserSettings(userId, maxAllocationPerMarket);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get user positions
  app.get("/api/positions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userPositions = await storage.getUserPositions(userId);
      res.json(userPositions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Get user trades
  app.get("/api/trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTrades = await storage.getUserTrades(userId);
      res.json(userTrades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Execute market order (buy or sell)
  app.post("/api/trade/market", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId, marketTitle, outcome, type, shares, price } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const sharesNum = parseFloat(shares);
      const priceNum = parseFloat(price);
      const cost = sharesNum * priceNum;

      if (type === 'BUY') {
        const currentBalance = parseFloat(user.balance);
        if (currentBalance < cost) {
          return res.status(400).json({ message: "Insufficient funds" });
        }

        // Check allocation limit
        const positions = await storage.getUserPositions(userId);
        const currentExposure = positions
          .filter(p => p.marketId === marketId)
          .reduce((acc, p) => acc + (parseFloat(p.shares) * parseFloat(p.avgPrice)), 0);
        
        const maxAllowed = (user.maxAllocationPerMarket / 100) * 10000;
        if (currentExposure + cost > maxAllowed) {
          return res.status(400).json({ message: "Exceeds max allocation limit for this market" });
        }

        // Update or create position
        const existingPos = await storage.getPosition(userId, marketId, outcome);
        if (existingPos) {
          const totalShares = parseFloat(existingPos.shares) + sharesNum;
          const totalCost = (parseFloat(existingPos.shares) * parseFloat(existingPos.avgPrice)) + cost;
          const newAvgPrice = totalCost / totalShares;
          await storage.updatePosition(existingPos.id, totalShares.toString(), newAvgPrice.toString());
        } else {
          await storage.createPosition(userId, marketId, outcome, shares, price);
        }

        // Update balance
        await storage.updateUserBalance(userId, (currentBalance - cost).toString());
      } else {
        // SELL
        const existingPos = await storage.getPosition(userId, marketId, outcome);
        if (!existingPos || parseFloat(existingPos.shares) < sharesNum) {
          return res.status(400).json({ message: "Insufficient shares" });
        }

        const currentBalance = parseFloat(user.balance);
        const revenue = sharesNum * priceNum;
        
        if (parseFloat(existingPos.shares) === sharesNum) {
          await storage.deletePosition(existingPos.id);
        } else {
          const newShares = parseFloat(existingPos.shares) - sharesNum;
          await storage.updatePosition(existingPos.id, newShares.toString(), existingPos.avgPrice);
        }

        await storage.updateUserBalance(userId, (currentBalance + revenue).toString());
      }

      // Create trade record
      const trade = await storage.createTrade(userId, marketId, marketTitle, outcome, type, shares, price);
      res.json(trade);
    } catch (error) {
      console.error("Error executing market order:", error);
      res.status(500).json({ message: "Failed to execute trade" });
    }
  });

  // Get user limit orders
  app.get("/api/orders/limit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Place limit order
  app.post("/api/orders/limit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId, marketTitle, outcome, type, shares, limitPrice } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const sharesNum = parseFloat(shares);
      const limitPriceNum = parseFloat(limitPrice);

      if (type === 'BUY') {
        const cost = sharesNum * limitPriceNum;
        const currentBalance = parseFloat(user.balance);
        if (currentBalance < cost) {
          return res.status(400).json({ message: "Insufficient funds for limit order" });
        }

        // Check allocation limit
        const positions = await storage.getUserPositions(userId);
        const currentExposure = positions
          .filter(p => p.marketId === marketId)
          .reduce((acc, p) => acc + (parseFloat(p.shares) * parseFloat(p.avgPrice)), 0);
        
        const maxAllowed = (user.maxAllocationPerMarket / 100) * 10000;
        if (currentExposure + cost > maxAllowed) {
          return res.status(400).json({ message: "Exceeds max allocation limit" });
        }

        // Reserve funds
        await storage.updateUserBalance(userId, (currentBalance - cost).toString());
      } else {
        // SELL - reserve shares
        const existingPos = await storage.getPosition(userId, marketId, outcome);
        if (!existingPos || parseFloat(existingPos.shares) < sharesNum) {
          return res.status(400).json({ message: "Insufficient shares for limit order" });
        }

        if (parseFloat(existingPos.shares) === sharesNum) {
          await storage.deletePosition(existingPos.id);
        } else {
          const newShares = parseFloat(existingPos.shares) - sharesNum;
          await storage.updatePosition(existingPos.id, newShares.toString(), existingPos.avgPrice);
        }
      }

      const order = await storage.createLimitOrder(userId, marketId, marketTitle, outcome, type, shares, limitPrice);
      res.json(order);
    } catch (error) {
      console.error("Error placing limit order:", error);
      res.status(500).json({ message: "Failed to place limit order" });
    }
  });

  // Cancel limit order
  app.delete("/api/orders/limit/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { orderId } = req.params;

      const orders = await storage.getUserOrders(userId);
      const order = orders.find(o => o.id === orderId && o.status === 'OPEN');
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Refund reserved assets
      if (order.type === 'BUY') {
        const refund = parseFloat(order.shares) * parseFloat(order.limitPrice);
        const newBalance = parseFloat(user.balance) + refund;
        await storage.updateUserBalance(userId, newBalance.toString());
      } else {
        // Refund shares
        const existingPos = await storage.getPosition(userId, order.marketId, order.outcome);
        if (existingPos) {
          const newShares = parseFloat(existingPos.shares) + parseFloat(order.shares);
          await storage.updatePosition(existingPos.id, newShares.toString(), existingPos.avgPrice);
        } else {
          await storage.createPosition(userId, order.marketId, order.outcome, order.shares, "0");
        }
      }

      await storage.updateOrderStatus(orderId, 'CANCELLED');
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // Get user stop-loss orders
  app.get("/api/orders/stoploss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stopLosses = await storage.getUserStopLosses(userId);
      res.json(stopLosses);
    } catch (error) {
      console.error("Error fetching stop-losses:", error);
      res.status(500).json({ message: "Failed to fetch stop-losses" });
    }
  });

  // Place stop-loss order
  app.post("/api/orders/stoploss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId, marketTitle, outcome, shares, triggerPrice } = req.body;

      const existingPos = await storage.getPosition(userId, marketId, outcome);
      if (!existingPos || parseFloat(existingPos.shares) < parseFloat(shares)) {
        return res.status(400).json({ message: "Insufficient shares for stop-loss order" });
      }

      const stopLoss = await storage.createStopLoss(userId, marketId, marketTitle, outcome, shares, triggerPrice);
      res.json(stopLoss);
    } catch (error) {
      console.error("Error placing stop-loss:", error);
      res.status(500).json({ message: "Failed to place stop-loss" });
    }
  });

  // Cancel stop-loss order
  app.delete("/api/orders/stoploss/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { orderId } = req.params;

      const stopLosses = await storage.getUserStopLosses(userId);
      const stopLoss = stopLosses.find(o => o.id === orderId && o.status === 'ACTIVE');
      
      if (!stopLoss) {
        return res.status(404).json({ message: "Stop-loss not found" });
      }

      await storage.updateStopLossStatus(orderId, 'CANCELLED');
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling stop-loss:", error);
      res.status(500).json({ message: "Failed to cancel stop-loss" });
    }
  });

  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userNotifications = await storage.getUserNotifications(userId);
      res.json(userNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification:", error);
      res.status(500).json({ message: "Failed to mark notification" });
    }
  });

  // Clear all notifications
  app.delete("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearUserNotifications(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Get all open orders for a market (for order book)
  app.get("/api/markets/:marketId/orderbook", async (req, res) => {
    try {
      const { marketId } = req.params;
      const orders = await storage.getOpenOrdersForMarket(marketId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching order book:", error);
      res.status(500).json({ message: "Failed to fetch order book" });
    }
  });

  // Analytics: Get P&L history over time
  app.get("/api/analytics/pnl-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trades = await storage.getUserTrades(userId);
      
      // Group trades by date and calculate cumulative P&L
      const pnlByDate = new Map<string, number>();
      let cumulativePnL = 0;
      
      // Sort trades by timestamp (oldest first)
      const sortedTrades = [...trades].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      for (const trade of sortedTrades) {
        const date = new Date(trade.timestamp).toISOString().split('T')[0];
        const shares = parseFloat(trade.shares);
        const price = parseFloat(trade.price);
        
        // BUY = money out (negative), SELL = money in (positive)
        const pnlChange = trade.type === 'BUY' ? -(shares * price) : (shares * price);
        cumulativePnL += pnlChange;
        pnlByDate.set(date, cumulativePnL);
      }
      
      const history = Array.from(pnlByDate.entries()).map(([date, pnl]) => ({
        date,
        pnl: Math.round(pnl * 100) / 100
      }));
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching P&L history:", error);
      res.status(500).json({ message: "Failed to fetch P&L history" });
    }
  });

  // Analytics: Get trading statistics
  app.get("/api/analytics/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trades = await storage.getUserTrades(userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate stats
      const totalTrades = trades.length;
      const buyTrades = trades.filter(t => t.type === 'BUY').length;
      const sellTrades = trades.filter(t => t.type === 'SELL').length;
      
      // Group trades by market to find wins/losses
      const marketTrades = new Map<string, { buys: number; sells: number; buyValue: number; sellValue: number }>();
      
      for (const trade of trades) {
        const key = `${trade.marketId}-${trade.outcome}`;
        const existing = marketTrades.get(key) || { buys: 0, sells: 0, buyValue: 0, sellValue: 0 };
        const value = parseFloat(trade.shares) * parseFloat(trade.price);
        
        if (trade.type === 'BUY') {
          existing.buys += parseFloat(trade.shares);
          existing.buyValue += value;
        } else {
          existing.sells += parseFloat(trade.shares);
          existing.sellValue += value;
        }
        
        marketTrades.set(key, existing);
      }
      
      // Calculate realized P&L for closed positions
      let realizedPnL = 0;
      let winningTrades = 0;
      let losingTrades = 0;
      
      for (const [, data] of marketTrades) {
        const soldShares = Math.min(data.buys, data.sells);
        if (soldShares > 0) {
          const avgBuyPrice = data.buyValue / data.buys;
          const avgSellPrice = data.sellValue / data.sells;
          const pnl = soldShares * (avgSellPrice - avgBuyPrice);
          realizedPnL += pnl;
          
          if (pnl > 0) winningTrades++;
          else if (pnl < 0) losingTrades++;
        }
      }
      
      const winRate = winningTrades + losingTrades > 0 
        ? Math.round((winningTrades / (winningTrades + losingTrades)) * 100)
        : 0;
      
      // Calculate total portfolio value
      const currentBalance = parseFloat(user.balance);
      const positions = await storage.getUserPositions(userId);
      const positionValue = positions.reduce((acc, p) => 
        acc + (parseFloat(p.shares) * parseFloat(p.avgPrice)), 0);
      const totalValue = currentBalance + positionValue;
      const totalPnL = totalValue - 10000; // Starting balance is 10000
      
      res.json({
        totalTrades,
        buyTrades,
        sellTrades,
        winningTrades,
        losingTrades,
        winRate,
        realizedPnL: Math.round(realizedPnL * 100) / 100,
        totalPnL: Math.round(totalPnL * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        currentBalance: Math.round(currentBalance * 100) / 100
      });
    } catch (error) {
      console.error("Error fetching analytics stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Analytics: Get top trades (biggest wins and losses)
  app.get("/api/analytics/top-trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trades = await storage.getUserTrades(userId);
      
      // Find paired buy/sell trades to calculate P&L per trade
      const completedTrades: { marketTitle: string; outcome: string; pnl: number; date: string }[] = [];
      const openPositions = new Map<string, { shares: number; avgPrice: number; marketTitle: string; outcome: string }>();
      
      // Sort by timestamp (oldest first)
      const sortedTrades = [...trades].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      for (const trade of sortedTrades) {
        const key = `${trade.marketId}-${trade.outcome}`;
        const shares = parseFloat(trade.shares);
        const price = parseFloat(trade.price);
        
        if (trade.type === 'BUY') {
          const existing = openPositions.get(key);
          if (existing) {
            const totalShares = existing.shares + shares;
            const totalCost = (existing.shares * existing.avgPrice) + (shares * price);
            existing.avgPrice = totalCost / totalShares;
            existing.shares = totalShares;
          } else {
            openPositions.set(key, { shares, avgPrice: price, marketTitle: trade.marketTitle, outcome: trade.outcome });
          }
        } else {
          // SELL - calculate P&L
          const existing = openPositions.get(key);
          if (existing && existing.shares >= shares) {
            const pnl = shares * (price - existing.avgPrice);
            completedTrades.push({
              marketTitle: trade.marketTitle,
              outcome: trade.outcome,
              pnl: Math.round(pnl * 100) / 100,
              date: new Date(trade.timestamp).toLocaleDateString()
            });
            
            existing.shares -= shares;
            if (existing.shares <= 0) {
              openPositions.delete(key);
            }
          }
        }
      }
      
      // Sort by P&L
      const sorted = completedTrades.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
      const topWins = sorted.filter(t => t.pnl > 0).slice(0, 5);
      const topLosses = sorted.filter(t => t.pnl < 0).slice(0, 5);
      
      res.json({ topWins, topLosses });
    } catch (error) {
      console.error("Error fetching top trades:", error);
      res.status(500).json({ message: "Failed to fetch top trades" });
    }
  });

  // Analytics: Get market exposure breakdown
  app.get("/api/analytics/exposure", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const positions = await storage.getUserPositions(userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate exposure per market
      const exposureByMarket = new Map<string, number>();
      
      for (const pos of positions) {
        const value = parseFloat(pos.shares) * parseFloat(pos.avgPrice);
        const existing = exposureByMarket.get(pos.marketId) || 0;
        exposureByMarket.set(pos.marketId, existing + value);
      }
      
      const totalValue = parseFloat(user.balance) + 
        positions.reduce((acc, p) => acc + (parseFloat(p.shares) * parseFloat(p.avgPrice)), 0);
      
      const exposure = Array.from(exposureByMarket.entries()).map(([marketId, value]) => ({
        marketId,
        value: Math.round(value * 100) / 100,
        percentage: Math.round((value / totalValue) * 100)
      }));
      
      // Sort by value descending
      exposure.sort((a, b) => b.value - a.value);
      
      res.json({
        exposure,
        cashPercentage: Math.round((parseFloat(user.balance) / totalValue) * 100),
        totalValue: Math.round(totalValue * 100) / 100
      });
    } catch (error) {
      console.error("Error fetching exposure:", error);
      res.status(500).json({ message: "Failed to fetch exposure" });
    }
  });

  // ===== PRICE ALERTS =====
  
  // Get user price alerts
  app.get("/api/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getUserPriceAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Create price alert
  app.post("/api/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId, marketTitle, outcome, targetPrice, condition } = req.body;

      if (!['ABOVE', 'BELOW'].includes(condition)) {
        return res.status(400).json({ message: "Condition must be ABOVE or BELOW" });
      }

      const alert = await storage.createPriceAlert(userId, marketId, marketTitle, outcome, targetPrice, condition);
      res.json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  // Cancel price alert
  app.delete("/api/alerts/:alertId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { alertId } = req.params;

      const alerts = await storage.getUserPriceAlerts(userId);
      const alert = alerts.find(a => a.id === alertId && a.status === 'ACTIVE');
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      await storage.updatePriceAlertStatus(alertId, 'CANCELLED');
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling alert:", error);
      res.status(500).json({ message: "Failed to cancel alert" });
    }
  });

  // ===== TAKE-PROFIT ORDERS =====
  
  // Get user take-profit orders
  app.get("/api/orders/takeprofit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserTakeProfits(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching take-profits:", error);
      res.status(500).json({ message: "Failed to fetch take-profit orders" });
    }
  });

  // Create take-profit order
  app.post("/api/orders/takeprofit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId, marketTitle, outcome, shares, targetPrice } = req.body;

      // Check user has sufficient shares
      const position = await storage.getPosition(userId, marketId, outcome);
      if (!position || parseFloat(position.shares) < parseFloat(shares)) {
        return res.status(400).json({ message: "Insufficient shares for take-profit order" });
      }

      const order = await storage.createTakeProfit(userId, marketId, marketTitle, outcome, shares, targetPrice);
      res.json(order);
    } catch (error) {
      console.error("Error creating take-profit:", error);
      res.status(500).json({ message: "Failed to create take-profit order" });
    }
  });

  // Cancel take-profit order
  app.delete("/api/orders/takeprofit/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { orderId } = req.params;

      const orders = await storage.getUserTakeProfits(userId);
      const order = orders.find(o => o.id === orderId && o.status === 'ACTIVE');
      
      if (!order) {
        return res.status(404).json({ message: "Take-profit order not found" });
      }

      await storage.updateTakeProfitStatus(orderId, 'CANCELLED');
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling take-profit:", error);
      res.status(500).json({ message: "Failed to cancel take-profit order" });
    }
  });

  // ===== TRADE NOTES =====
  
  // Get all trade notes for user
  app.get("/api/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await storage.getUserTradeNotes(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // Get note for specific trade
  app.get("/api/notes/:tradeId", isAuthenticated, async (req: any, res) => {
    try {
      const { tradeId } = req.params;
      const note = await storage.getTradeNote(tradeId);
      res.json(note || null);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  // Create or update trade note
  app.post("/api/notes/:tradeId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tradeId } = req.params;
      const { note } = req.body;

      if (!note || typeof note !== 'string') {
        return res.status(400).json({ message: "Note is required" });
      }

      // Check if note already exists
      const existingNote = await storage.getTradeNote(tradeId);
      
      if (existingNote) {
        await storage.updateTradeNote(existingNote.id, note);
        res.json({ ...existingNote, note });
      } else {
        const newNote = await storage.createTradeNote(userId, tradeId, note);
        res.json(newNote);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      res.status(500).json({ message: "Failed to save note" });
    }
  });

  // Delete trade note
  app.delete("/api/notes/:tradeId", isAuthenticated, async (req: any, res) => {
    try {
      const { tradeId } = req.params;
      
      const note = await storage.getTradeNote(tradeId);
      if (note) {
        await storage.deleteTradeNote(note.id);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // ===== WATCHLIST =====
  
  // Get user watchlist
  app.get("/api/watchlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getUserWatchlist(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  // Check if market is in watchlist
  app.get("/api/watchlist/:marketId/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId } = req.params;
      const isWatching = await storage.isInWatchlist(userId, marketId);
      res.json({ isWatching });
    } catch (error) {
      console.error("Error checking watchlist:", error);
      res.status(500).json({ message: "Failed to check watchlist" });
    }
  });

  // Add to watchlist
  app.post("/api/watchlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId, marketTitle } = req.body;

      // Check if already in watchlist
      const exists = await storage.isInWatchlist(userId, marketId);
      if (exists) {
        return res.status(400).json({ message: "Market already in watchlist" });
      }

      const item = await storage.addToWatchlist(userId, marketId, marketTitle);
      res.json(item);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  // Remove from watchlist (uses userId+marketId to avoid race conditions)
  app.delete("/api/watchlist/:marketId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId } = req.params;

      await storage.removeFromWatchlistByMarket(userId, marketId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // ===== TRAILING STOP-LOSS =====
  
  // Get user trailing stop-losses
  app.get("/api/orders/trailing-stoploss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserTrailingStopLosses(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching trailing stop-losses:", error);
      res.status(500).json({ message: "Failed to fetch trailing stop-losses" });
    }
  });

  // Create trailing stop-loss
  app.post("/api/orders/trailing-stoploss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId, marketTitle, outcome, shares, trailPercent, currentPrice } = req.body;

      // Input validation
      const sharesNum = parseFloat(shares);
      const trailPctNum = parseFloat(trailPercent);
      const priceNum = parseFloat(currentPrice);

      if (isNaN(sharesNum) || sharesNum <= 0) {
        return res.status(400).json({ message: "Invalid shares amount" });
      }
      if (isNaN(trailPctNum) || trailPctNum <= 0 || trailPctNum >= 100) {
        return res.status(400).json({ message: "Trail percent must be between 0 and 100" });
      }
      if (isNaN(priceNum) || priceNum <= 0 || priceNum > 1) {
        return res.status(400).json({ message: "Invalid current price" });
      }

      // Check user has sufficient shares
      const position = await storage.getPosition(userId, marketId, outcome);
      if (!position || parseFloat(position.shares) < sharesNum) {
        return res.status(400).json({ message: "Insufficient shares for trailing stop-loss" });
      }

      // Calculate initial trigger price (price * (1 - trailPercent/100))
      const triggerPrice = priceNum * (1 - trailPctNum / 100);

      const order = await storage.createTrailingStopLoss(
        userId, marketId, marketTitle, outcome, 
        sharesNum.toString(), trailPctNum.toString(), 
        priceNum.toFixed(4), triggerPrice.toFixed(4)
      );
      res.json(order);
    } catch (error) {
      console.error("Error creating trailing stop-loss:", error);
      res.status(500).json({ message: "Failed to create trailing stop-loss" });
    }
  });

  // Cancel trailing stop-loss
  app.delete("/api/orders/trailing-stoploss/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { orderId } = req.params;

      const orders = await storage.getUserTrailingStopLosses(userId);
      const order = orders.find(o => o.id === orderId && o.status === 'ACTIVE');
      
      if (!order) {
        return res.status(404).json({ message: "Trailing stop-loss not found" });
      }

      await storage.updateTrailingStopLossStatus(orderId, 'CANCELLED');
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling trailing stop-loss:", error);
      res.status(500).json({ message: "Failed to cancel trailing stop-loss" });
    }
  });

  // ===== BRACKET ORDERS =====
  
  // Get user bracket orders
  app.get("/api/orders/bracket", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserBracketOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching bracket orders:", error);
      res.status(500).json({ message: "Failed to fetch bracket orders" });
    }
  });

  // Create bracket order
  app.post("/api/orders/bracket", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { marketId, marketTitle, outcome, shares, takeProfitPrice, stopLossPrice } = req.body;

      // Input validation
      const sharesNum = parseFloat(shares);
      const tpPrice = parseFloat(takeProfitPrice);
      const slPrice = parseFloat(stopLossPrice);

      if (isNaN(sharesNum) || sharesNum <= 0) {
        return res.status(400).json({ message: "Invalid shares amount" });
      }
      if (isNaN(tpPrice) || tpPrice <= 0 || tpPrice > 1) {
        return res.status(400).json({ message: "Invalid take-profit price" });
      }
      if (isNaN(slPrice) || slPrice <= 0 || slPrice > 1) {
        return res.status(400).json({ message: "Invalid stop-loss price" });
      }

      // Check user has sufficient shares
      const position = await storage.getPosition(userId, marketId, outcome);
      if (!position || parseFloat(position.shares) < sharesNum) {
        return res.status(400).json({ message: "Insufficient shares for bracket order" });
      }

      // Validate take-profit is above stop-loss
      if (tpPrice <= slPrice) {
        return res.status(400).json({ message: "Take-profit price must be higher than stop-loss price" });
      }

      const order = await storage.createBracketOrder(
        userId, marketId, marketTitle, outcome, 
        sharesNum.toString(), tpPrice.toFixed(4), slPrice.toFixed(4)
      );
      res.json(order);
    } catch (error) {
      console.error("Error creating bracket order:", error);
      res.status(500).json({ message: "Failed to create bracket order" });
    }
  });

  // Cancel bracket order
  app.delete("/api/orders/bracket/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { orderId } = req.params;

      const orders = await storage.getUserBracketOrders(userId);
      const order = orders.find(o => o.id === orderId && o.status === 'ACTIVE');
      
      if (!order) {
        return res.status(404).json({ message: "Bracket order not found" });
      }

      await storage.updateBracketOrderStatus(orderId, 'CANCELLED');
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling bracket order:", error);
      res.status(500).json({ message: "Failed to cancel bracket order" });
    }
  });

  return httpServer;
}
