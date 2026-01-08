import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  positions,
  trades,
  limitOrders,
  stopLossOrders,
  notifications,
  priceAlerts,
  takeProfitOrders,
  tradeNotes,
  watchlist,
  trailingStopLoss,
  bracketOrders,
  recurringOrders,
  type User,
  type Position,
  type Trade,
  type LimitOrder,
  type StopLossOrder,
  type Notification,
  type PriceAlert,
  type TakeProfitOrder,
  type TradeNote,
  type WatchlistItem,
  type TrailingStopLoss,
  type BracketOrder,
  type RecurringOrder,
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
  
  // Price alert operations
  getUserPriceAlerts(userId: string): Promise<PriceAlert[]>;
  getActivePriceAlertsForMarket(marketId: string): Promise<PriceAlert[]>;
  createPriceAlert(userId: string, marketId: string, marketTitle: string, outcome: string, targetPrice: string, condition: string): Promise<PriceAlert>;
  updatePriceAlertStatus(alertId: string, status: string): Promise<void>;
  
  // Take-profit order operations
  getUserTakeProfits(userId: string): Promise<TakeProfitOrder[]>;
  getActiveTakeProfitsForMarket(marketId: string): Promise<TakeProfitOrder[]>;
  createTakeProfit(userId: string, marketId: string, marketTitle: string, outcome: string, shares: string, targetPrice: string): Promise<TakeProfitOrder>;
  updateTakeProfitStatus(orderId: string, status: string): Promise<void>;
  
  // Trade notes operations
  getTradeNote(tradeId: string): Promise<TradeNote | undefined>;
  getUserTradeNotes(userId: string): Promise<TradeNote[]>;
  createTradeNote(userId: string, tradeId: string, note: string): Promise<TradeNote>;
  updateTradeNote(noteId: string, note: string): Promise<void>;
  deleteTradeNote(noteId: string): Promise<void>;
  
  // Watchlist operations
  getUserWatchlist(userId: string): Promise<WatchlistItem[]>;
  addToWatchlist(userId: string, marketId: string, marketTitle: string): Promise<WatchlistItem>;
  removeFromWatchlist(watchlistId: string): Promise<void>;
  isInWatchlist(userId: string, marketId: string): Promise<boolean>;
  
  // Trailing stop-loss operations
  getUserTrailingStopLosses(userId: string): Promise<TrailingStopLoss[]>;
  getActiveTrailingStopLossesForMarket(marketId: string): Promise<TrailingStopLoss[]>;
  createTrailingStopLoss(userId: string, marketId: string, marketTitle: string, outcome: string, shares: string, trailPercent: string, highWaterMark: string, currentTrigger: string): Promise<TrailingStopLoss>;
  updateTrailingStopLossStatus(orderId: string, status: string): Promise<void>;
  updateTrailingStopLossTrigger(orderId: string, highWaterMark: string, currentTrigger: string): Promise<void>;
  
  // Bracket order operations
  getUserBracketOrders(userId: string): Promise<BracketOrder[]>;
  getActiveBracketOrdersForMarket(marketId: string): Promise<BracketOrder[]>;
  createBracketOrder(userId: string, marketId: string, marketTitle: string, outcome: string, shares: string, takeProfitPrice: string, stopLossPrice: string): Promise<BracketOrder>;
  updateBracketOrderStatus(orderId: string, status: string): Promise<void>;
  
  // Recurring order operations
  getUserRecurringOrders(userId: string): Promise<RecurringOrder[]>;
  createRecurringOrder(userId: string, marketId: string, marketTitle: string, outcome: string, amount: string, frequency: string, nextExecution: Date): Promise<RecurringOrder>;
  updateRecurringOrderStatus(orderId: string, status: string): Promise<void>;
  incrementRecurringOrderExecution(orderId: string, nextExecution: Date): Promise<void>;
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

  // Price alert operations
  async getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
    return await db.select().from(priceAlerts)
      .where(eq(priceAlerts.userId, userId))
      .orderBy(desc(priceAlerts.timestamp));
  }

  async getActivePriceAlertsForMarket(marketId: string): Promise<PriceAlert[]> {
    return await db.select().from(priceAlerts)
      .where(and(
        eq(priceAlerts.marketId, marketId),
        eq(priceAlerts.status, 'ACTIVE')
      ));
  }

  async createPriceAlert(userId: string, marketId: string, marketTitle: string, outcome: string, targetPrice: string, condition: string): Promise<PriceAlert> {
    const [alert] = await db.insert(priceAlerts).values({
      userId,
      marketId,
      marketTitle,
      outcome,
      targetPrice,
      condition
    }).returning();
    return alert;
  }

  async updatePriceAlertStatus(alertId: string, status: string): Promise<void> {
    await db.update(priceAlerts).set({ status }).where(eq(priceAlerts.id, alertId));
  }

  // Take-profit order operations
  async getUserTakeProfits(userId: string): Promise<TakeProfitOrder[]> {
    return await db.select().from(takeProfitOrders)
      .where(eq(takeProfitOrders.userId, userId))
      .orderBy(desc(takeProfitOrders.timestamp));
  }

  async getActiveTakeProfitsForMarket(marketId: string): Promise<TakeProfitOrder[]> {
    return await db.select().from(takeProfitOrders)
      .where(and(
        eq(takeProfitOrders.marketId, marketId),
        eq(takeProfitOrders.status, 'ACTIVE')
      ));
  }

  async createTakeProfit(userId: string, marketId: string, marketTitle: string, outcome: string, shares: string, targetPrice: string): Promise<TakeProfitOrder> {
    const [order] = await db.insert(takeProfitOrders).values({
      userId,
      marketId,
      marketTitle,
      outcome,
      shares,
      targetPrice
    }).returning();
    return order;
  }

  async updateTakeProfitStatus(orderId: string, status: string): Promise<void> {
    await db.update(takeProfitOrders).set({ status }).where(eq(takeProfitOrders.id, orderId));
  }

  // Trade notes operations
  async getTradeNote(tradeId: string): Promise<TradeNote | undefined> {
    const [note] = await db.select().from(tradeNotes).where(eq(tradeNotes.tradeId, tradeId));
    return note;
  }

  async getUserTradeNotes(userId: string): Promise<TradeNote[]> {
    return await db.select().from(tradeNotes)
      .where(eq(tradeNotes.userId, userId))
      .orderBy(desc(tradeNotes.timestamp));
  }

  async createTradeNote(userId: string, tradeId: string, note: string): Promise<TradeNote> {
    const [tradeNote] = await db.insert(tradeNotes).values({
      userId,
      tradeId,
      note
    }).returning();
    return tradeNote;
  }

  async updateTradeNote(noteId: string, note: string): Promise<void> {
    await db.update(tradeNotes).set({ note }).where(eq(tradeNotes.id, noteId));
  }

  async deleteTradeNote(noteId: string): Promise<void> {
    await db.delete(tradeNotes).where(eq(tradeNotes.id, noteId));
  }

  // Watchlist operations
  async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    return await db.select().from(watchlist)
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.timestamp));
  }

  async addToWatchlist(userId: string, marketId: string, marketTitle: string): Promise<WatchlistItem> {
    const [item] = await db.insert(watchlist).values({
      userId,
      marketId,
      marketTitle
    }).returning();
    return item;
  }

  async removeFromWatchlist(watchlistId: string): Promise<void> {
    await db.delete(watchlist).where(eq(watchlist.id, watchlistId));
  }

  async removeFromWatchlistByMarket(userId: string, marketId: string): Promise<void> {
    await db.delete(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.marketId, marketId)));
  }

  async isInWatchlist(userId: string, marketId: string): Promise<boolean> {
    const [item] = await db.select().from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.marketId, marketId)));
    return !!item;
  }

  // Trailing stop-loss operations
  async getUserTrailingStopLosses(userId: string): Promise<TrailingStopLoss[]> {
    return await db.select().from(trailingStopLoss)
      .where(eq(trailingStopLoss.userId, userId))
      .orderBy(desc(trailingStopLoss.timestamp));
  }

  async getActiveTrailingStopLossesForMarket(marketId: string): Promise<TrailingStopLoss[]> {
    return await db.select().from(trailingStopLoss)
      .where(and(
        eq(trailingStopLoss.marketId, marketId),
        eq(trailingStopLoss.status, 'ACTIVE')
      ));
  }

  async createTrailingStopLoss(userId: string, marketId: string, marketTitle: string, outcome: string, shares: string, trailPercent: string, highWaterMark: string, currentTrigger: string): Promise<TrailingStopLoss> {
    const [order] = await db.insert(trailingStopLoss).values({
      userId,
      marketId,
      marketTitle,
      outcome,
      shares,
      trailPercent,
      highWaterMark,
      currentTrigger
    }).returning();
    return order;
  }

  async updateTrailingStopLossStatus(orderId: string, status: string): Promise<void> {
    await db.update(trailingStopLoss).set({ status }).where(eq(trailingStopLoss.id, orderId));
  }

  async updateTrailingStopLossTrigger(orderId: string, highWaterMark: string, currentTrigger: string): Promise<void> {
    await db.update(trailingStopLoss).set({ highWaterMark, currentTrigger }).where(eq(trailingStopLoss.id, orderId));
  }

  // Bracket order operations
  async getUserBracketOrders(userId: string): Promise<BracketOrder[]> {
    return await db.select().from(bracketOrders)
      .where(eq(bracketOrders.userId, userId))
      .orderBy(desc(bracketOrders.timestamp));
  }

  async getActiveBracketOrdersForMarket(marketId: string): Promise<BracketOrder[]> {
    return await db.select().from(bracketOrders)
      .where(and(
        eq(bracketOrders.marketId, marketId),
        eq(bracketOrders.status, 'ACTIVE')
      ));
  }

  async createBracketOrder(userId: string, marketId: string, marketTitle: string, outcome: string, shares: string, takeProfitPrice: string, stopLossPrice: string): Promise<BracketOrder> {
    const [order] = await db.insert(bracketOrders).values({
      userId,
      marketId,
      marketTitle,
      outcome,
      shares,
      takeProfitPrice,
      stopLossPrice
    }).returning();
    return order;
  }

  async updateBracketOrderStatus(orderId: string, status: string): Promise<void> {
    await db.update(bracketOrders).set({ status }).where(eq(bracketOrders.id, orderId));
  }

  // Recurring order operations
  async getUserRecurringOrders(userId: string): Promise<RecurringOrder[]> {
    return await db.select().from(recurringOrders)
      .where(eq(recurringOrders.userId, userId))
      .orderBy(desc(recurringOrders.timestamp));
  }

  async createRecurringOrder(userId: string, marketId: string, marketTitle: string, outcome: string, amount: string, frequency: string, nextExecution: Date): Promise<RecurringOrder> {
    const [order] = await db.insert(recurringOrders).values({
      userId,
      marketId,
      marketTitle,
      outcome,
      amount,
      frequency,
      nextExecution
    }).returning();
    return order;
  }

  async updateRecurringOrderStatus(orderId: string, status: string): Promise<void> {
    await db.update(recurringOrders).set({ status }).where(eq(recurringOrders.id, orderId));
  }

  async incrementRecurringOrderExecution(orderId: string, nextExecution: Date): Promise<void> {
    const [order] = await db.select().from(recurringOrders).where(eq(recurringOrders.id, orderId));
    if (order) {
      await db.update(recurringOrders).set({ 
        totalExecuted: order.totalExecuted + 1,
        nextExecution 
      }).where(eq(recurringOrders.id, orderId));
    }
  }
}

export const storage = new DbStorage();
