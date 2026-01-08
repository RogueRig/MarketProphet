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

  return httpServer;
}
