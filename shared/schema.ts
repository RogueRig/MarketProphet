import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (required by Replit Auth)
export * from "./models/auth";
import { users } from "./models/auth";

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  outcome: text("outcome").notNull(), // 'YES' or 'NO'
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  avgPrice: decimal("avg_price", { precision: 10, scale: 4 }).notNull(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  type: text("type").notNull(), // 'BUY' or 'SELL'
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const limitOrders = pgTable("limit_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  type: text("type").notNull(), // 'BUY' or 'SELL'
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  limitPrice: decimal("limit_price", { precision: 10, scale: 4 }).notNull(),
  status: text("status").notNull().default('OPEN'), // 'OPEN', 'FILLED', 'CANCELLED'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const stopLossOrders = pgTable("stop_loss_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  triggerPrice: decimal("trigger_price", { precision: 10, scale: 4 }).notNull(),
  status: text("status").notNull().default('ACTIVE'), // 'ACTIVE', 'TRIGGERED', 'CANCELLED'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'LIMIT_FILL', 'STOP_LOSS', 'TAKE_PROFIT', 'PRICE_ALERT'
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  orderType: text("order_type").notNull(), // 'BUY' or 'SELL'
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 4 }).notNull(),
  read: boolean("read").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const priceAlerts = pgTable("price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 4 }).notNull(),
  condition: text("condition").notNull(), // 'ABOVE' or 'BELOW'
  status: text("status").notNull().default('ACTIVE'), // 'ACTIVE', 'TRIGGERED', 'CANCELLED'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const takeProfitOrders = pgTable("take_profit_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 4 }).notNull(),
  status: text("status").notNull().default('ACTIVE'), // 'ACTIVE', 'TRIGGERED', 'CANCELLED'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const tradeNotes = pgTable("trade_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tradeId: varchar("trade_id").notNull().references(() => trades.id, { onDelete: 'cascade' }),
  note: text("note").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const watchlist = pgTable("watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  marketTitle: text("market_title").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const trailingStopLoss = pgTable("trailing_stop_loss", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  trailPercent: decimal("trail_percent", { precision: 5, scale: 2 }).notNull(), // e.g., 5 for 5%
  highWaterMark: decimal("high_water_mark", { precision: 10, scale: 4 }).notNull(), // highest price seen
  currentTrigger: decimal("current_trigger", { precision: 10, scale: 4 }).notNull(), // calculated trigger price
  status: text("status").notNull().default('ACTIVE'), // 'ACTIVE', 'TRIGGERED', 'CANCELLED'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const bracketOrders = pgTable("bracket_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marketId: text("market_id").notNull(),
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  takeProfitPrice: decimal("take_profit_price", { precision: 10, scale: 4 }).notNull(),
  stopLossPrice: decimal("stop_loss_price", { precision: 10, scale: 4 }).notNull(),
  status: text("status").notNull().default('ACTIVE'), // 'ACTIVE', 'TP_TRIGGERED', 'SL_TRIGGERED', 'CANCELLED'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, timestamp: true });
export const insertLimitOrderSchema = createInsertSchema(limitOrders).omit({ id: true, status: true, timestamp: true });
export const insertStopLossOrderSchema = createInsertSchema(stopLossOrders).omit({ id: true, status: true, timestamp: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, read: true, timestamp: true });
export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({ id: true, status: true, timestamp: true });
export const insertTakeProfitOrderSchema = createInsertSchema(takeProfitOrders).omit({ id: true, status: true, timestamp: true });
export const insertTradeNoteSchema = createInsertSchema(tradeNotes).omit({ id: true, timestamp: true });
export const insertWatchlistSchema = createInsertSchema(watchlist).omit({ id: true, timestamp: true });
export const insertTrailingStopLossSchema = createInsertSchema(trailingStopLoss).omit({ id: true, status: true, timestamp: true });
export const insertBracketOrderSchema = createInsertSchema(bracketOrders).omit({ id: true, status: true, timestamp: true });

// Types
export type Position = typeof positions.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type LimitOrder = typeof limitOrders.$inferSelect;
export type StopLossOrder = typeof stopLossOrders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type TakeProfitOrder = typeof takeProfitOrders.$inferSelect;
export type TradeNote = typeof tradeNotes.$inferSelect;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type TrailingStopLoss = typeof trailingStopLoss.$inferSelect;
export type BracketOrder = typeof bracketOrders.$inferSelect;
