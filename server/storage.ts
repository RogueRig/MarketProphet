import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  positions,
  trades,
  limitOrders,
  stopLossOrders,
  notifications,
  type User,
  type Position,
  type Trade,
  type LimitOrder,
  type StopLossOrder,
  type Notification,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;
  updateUserSettings(userId: string, maxAllocationPerMarket: number): Promise<void>;
  
  // Position operations
  getUserPositions(userId: string): Promise<Position[]>;
  getPosition(userId: string, marketId: string, outcome: string): Promise<Position | undefined>;
  createPosition(userId: string, marketId: string, outcome: string, shares: string, avgPrice: string): Promise<Position>;
  updatePosition(positionId: string, shares: string, avgPrice: string): Promise<void>;
  deletePosition(positionId: string): Promise<void>;
  
  // Trade operations
  getUserTrades(userId: string): Promise<Trade[]>;
  createTrade(userId: string, marketId: string, marketTitle: string, outcome: string, type: string, shares: string, price: string): Promise<Trade>;
  
  // Limit order operations
  getUserOrders(userId: string): Promise<LimitOrder[]>;
  getOpenOrdersForMarket(marketId: string): Promise<LimitOrder[]>;
  createLimitOrder(userId: string, marketId: string, marketTitle: string, outcome: string, type: string, shares: string, limitPrice: string): Promise<LimitOrder>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
  
  // Stop-loss operations
  getUserStopLosses(userId: string): Promise<StopLossOrder[]>;
  getActiveStopLossesForMarket(marketId: string): Promise<StopLossOrder[]>;
  createStopLoss(userId: string, marketId: string, marketTitle: string, outcome: string, shares: string, triggerPrice: string): Promise<StopLossOrder>;
  updateStopLossStatus(orderId: string, status: string): Promise<void>;
  
  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(userId: string, type: string, marketTitle: string, outcome: string, orderType: string, shares: string, price: string): Promise<Notification>;
  markNotificationRead(notificationId: string): Promise<void>;
  clearUserNotifications(userId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<void> {
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, userId));
  }

  async updateUserSettings(userId: string, maxAllocationPerMarket: number): Promise<void> {
    await db.update(users).set({ maxAllocationPerMarket }).where(eq(users.id, userId));
  }

  // Position operations
  async getUserPositions(userId: string): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.userId, userId));
  }

  async getPosition(userId: string, marketId: string, outcome: string): Promise<Position | undefined> {
    const [position] = await db.select().from(positions)
      .where(and(
        eq(positions.userId, userId),
        eq(positions.marketId, marketId),
        eq(positions.outcome, outcome)
      ));
    return position;
  }

  async createPosition(userId: string, marketId: string, outcome: string, shares: string, avgPrice: string): Promise<Position> {
    const [position] = await db.insert(positions).values({
      userId,
      marketId,
      outcome,
      shares,
      avgPrice
    }).returning();
    return position;
  }

  async updatePosition(positionId: string, shares: string, avgPrice: string): Promise<void> {
    await db.update(positions).set({ shares, avgPrice }).where(eq(positions.id, positionId));
  }

  async deletePosition(positionId: string): Promise<void> {
    await db.delete(positions).where(eq(positions.id, positionId));
  }

  // Trade operations
  async getUserTrades(userId: string): Promise<Trade[]> {
    return await db.select().from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.timestamp));
  }

  async createTrade(userId: string, marketId: string, marketTitle: string, outcome: string, type: string, shares: string, price: string): Promise<Trade> {
    const [trade] = await db.insert(trades).values({
      userId,
      marketId,
      marketTitle,
      outcome,
      type,
      shares,
      price
    }).returning();
    return trade;
  }

  // Limit order operations
  async getUserOrders(userId: string): Promise<LimitOrder[]> {
    return await db.select().from(limitOrders)
      .where(eq(limitOrders.userId, userId))
      .orderBy(desc(limitOrders.timestamp));
  }

  async getOpenOrdersForMarket(marketId: string): Promise<LimitOrder[]> {
    return await db.select().from(limitOrders)
      .where(and(
        eq(limitOrders.marketId, marketId),
        eq(limitOrders.status, 'OPEN')
      ));
  }

  async createLimitOrder(userId: string, marketId: string, marketTitle: string, outcome: string, type: string, shares: string, limitPrice: string): Promise<LimitOrder> {
    const [order] = await db.insert(limitOrders).values({
      userId,
      marketId,
      marketTitle,
      outcome,
      type,
      shares,
      limitPrice
    }).returning();
    return order;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await db.update(limitOrders).set({ status }).where(eq(limitOrders.id, orderId));
  }

  // Stop-loss operations
  async getUserStopLosses(userId: string): Promise<StopLossOrder[]> {
    return await db.select().from(stopLossOrders)
      .where(eq(stopLossOrders.userId, userId))
      .orderBy(desc(stopLossOrders.timestamp));
  }

  async getActiveStopLossesForMarket(marketId: string): Promise<StopLossOrder[]> {
    return await db.select().from(stopLossOrders)
      .where(and(
        eq(stopLossOrders.marketId, marketId),
        eq(stopLossOrders.status, 'ACTIVE')
      ));
  }

  async createStopLoss(userId: string, marketId: string, marketTitle: string, outcome: string, shares: string, triggerPrice: string): Promise<StopLossOrder> {
    const [stopLoss] = await db.insert(stopLossOrders).values({
      userId,
      marketId,
      marketTitle,
      outcome,
      shares,
      triggerPrice
    }).returning();
    return stopLoss;
  }

  async updateStopLossStatus(orderId: string, status: string): Promise<void> {
    await db.update(stopLossOrders).set({ status }).where(eq(stopLossOrders.id, orderId));
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.timestamp));
  }

  async createNotification(userId: string, type: string, marketTitle: string, outcome: string, orderType: string, shares: string, price: string): Promise<Notification> {
    const [notification] = await db.insert(notifications).values({
      userId,
      type,
      marketTitle,
      outcome,
      orderType,
      shares,
      price
    }).returning();
    return notification;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
  }

  async clearUserNotifications(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }
}

export const storage = new DbStorage();
