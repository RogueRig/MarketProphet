import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("10000.00"),
  maxAllocationPerMarket: integer("max_allocation_per_market").notNull().default(25),
});

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
  type: text("type").notNull(), // 'LIMIT_FILL' or 'STOP_LOSS'
  marketTitle: text("market_title").notNull(),
  outcome: text("outcome").notNull(),
  orderType: text("order_type").notNull(), // 'BUY' or 'SELL'
  shares: decimal("shares", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 4 }).notNull(),
  read: boolean("read").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, balance: true, maxAllocationPerMarket: true });
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, timestamp: true });
export const insertLimitOrderSchema = createInsertSchema(limitOrders).omit({ id: true, status: true, timestamp: true });
export const insertStopLossOrderSchema = createInsertSchema(stopLossOrders).omit({ id: true, status: true, timestamp: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, read: true, timestamp: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type LimitOrder = typeof limitOrders.$inferSelect;
export type StopLossOrder = typeof stopLossOrders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
