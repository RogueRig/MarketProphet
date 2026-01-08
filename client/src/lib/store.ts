import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { isUnauthorizedError, redirectToLogin } from './auth-utils';
import { useToast } from '@/hooks/use-toast';

// Type definitions
export interface Position {
  id: string;
  marketId: string;
  outcome: 'YES' | 'NO';
  shares: string;
  avgPrice: string;
}

export interface Trade {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  type: 'BUY' | 'SELL';
  shares: string;
  price: string;
  timestamp: string;
}

export interface LimitOrder {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  type: 'BUY' | 'SELL';
  shares: string;
  limitPrice: string;
  timestamp: string;
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
}

export interface StopLossOrder {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  shares: string;
  triggerPrice: string;
  timestamp: string;
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
}

export interface OrderFillNotification {
  id: string;
  type: 'LIMIT_FILL' | 'STOP_LOSS';
  marketTitle: string;
  outcome: 'YES' | 'NO';
  orderType: 'BUY' | 'SELL';
  shares: string;
  price: string;
  timestamp: string;
  read: boolean;
}

export interface UserProfile {
  balance: string;
  maxAllocationPerMarket: number;
}

// API functions
async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetch('/api/user/profile', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchPositions(): Promise<Position[]> {
  const response = await fetch('/api/positions', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchTrades(): Promise<Trade[]> {
  const response = await fetch('/api/trades', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchOrders(): Promise<LimitOrder[]> {
  const response = await fetch('/api/orders/limit', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchStopLosses(): Promise<StopLossOrder[]> {
  const response = await fetch('/api/orders/stoploss', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchNotifications(): Promise<OrderFillNotification[]> {
  const response = await fetch('/api/notifications', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

// Query hooks
export function useUserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    queryFn: fetchUserProfile,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function usePositions() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<Position[]>({
    queryKey: ['/api/positions'],
    queryFn: fetchPositions,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useTrades() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    queryFn: fetchTrades,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<LimitOrder[]>({
    queryKey: ['/api/orders/limit'],
    queryFn: fetchOrders,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useStopLosses() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<StopLossOrder[]>({
    queryKey: ['/api/orders/stoploss'],
    queryFn: fetchStopLosses,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<OrderFillNotification[]>({
    queryKey: ['/api/notifications'],
    queryFn: fetchNotifications,
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for new notifications
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Mutation hooks
export function useMarketTrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      marketId: string;
      marketTitle: string;
      outcome: 'YES' | 'NO';
      type: 'BUY' | 'SELL';
      shares: number;
      price: number;
    }) => {
      const response = await fetch('/api/trade/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          marketId: data.marketId,
          marketTitle: data.marketTitle,
          outcome: data.outcome,
          type: data.type,
          shares: data.shares.toString(),
          price: data.price.toString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute trade');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      
      toast({
        title: `Market ${variables.type} Executed`,
        description: `${variables.type === 'BUY' ? 'Bought' : 'Sold'} ${variables.shares} ${variables.outcome} shares at $${variables.price.toFixed(2)}`,
        className: variables.type === 'BUY' 
          ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
          : 'bg-blue-500/10 border-blue-500/20',
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({
          title: 'Order Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function usePlaceLimitOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      marketId: string;
      marketTitle: string;
      outcome: 'YES' | 'NO';
      type: 'BUY' | 'SELL';
      shares: number;
      limitPrice: number;
    }) => {
      const response = await fetch('/api/orders/limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          marketId: data.marketId,
          marketTitle: data.marketTitle,
          outcome: data.outcome,
          type: data.type,
          shares: data.shares.toString(),
          limitPrice: data.limitPrice.toString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place limit order');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/limit'] });
      
      toast({
        title: 'Limit Order Placed',
        description: `${variables.type} limit order for ${variables.shares} ${variables.outcome} shares at $${variables.limitPrice.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({
          title: 'Order Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function usePlaceStopLoss() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      marketId: string;
      marketTitle: string;
      outcome: 'YES' | 'NO';
      shares: number;
      triggerPrice: number;
    }) => {
      const response = await fetch('/api/orders/stoploss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          marketId: data.marketId,
          marketTitle: data.marketTitle,
          outcome: data.outcome,
          shares: data.shares.toString(),
          triggerPrice: data.triggerPrice.toString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place stop-loss');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/stoploss'] });
      
      toast({
        title: 'Stop-Loss Order Placed',
        description: `Will sell ${variables.shares} ${variables.outcome} shares if price drops to $${variables.triggerPrice.toFixed(2)}`,
        className: 'bg-orange-500/10 border-orange-500/20',
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({
          title: 'Order Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/limit/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/limit'] });
      
      toast({
        title: 'Order Cancelled',
        description: 'Limit order has been cancelled',
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({
          title: 'Failed to Cancel',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function useCancelStopLoss() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/stoploss/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel stop-loss');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/stoploss'] });
      
      toast({
        title: 'Stop-Loss Removed',
        description: 'Stop-loss order has been cancelled',
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({
          title: 'Failed to Remove',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (maxAllocationPerMarket: number) => {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ maxAllocationPerMarket }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      
      toast({
        title: 'Settings Updated',
        description: 'Your trading settings have been saved',
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({
          title: 'Failed to Update',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

export function useClearNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear notifications');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: 'Notifications Cleared',
        description: 'All notifications have been removed',
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      }
    },
  });
}

// Analytics types
export interface PnLHistoryPoint {
  date: string;
  pnl: number;
}

export interface AnalyticsStats {
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  realizedPnL: number;
  totalPnL: number;
  totalValue: number;
  currentBalance: number;
}

export interface TopTrade {
  marketTitle: string;
  outcome: string;
  pnl: number;
  date: string;
}

export interface TopTrades {
  topWins: TopTrade[];
  topLosses: TopTrade[];
}

export interface MarketExposure {
  marketId: string;
  value: number;
  percentage: number;
}

export interface ExposureData {
  exposure: MarketExposure[];
  cashPercentage: number;
  totalValue: number;
}

// Analytics API functions
async function fetchPnLHistory(): Promise<PnLHistoryPoint[]> {
  const response = await fetch('/api/analytics/pnl-history', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchAnalyticsStats(): Promise<AnalyticsStats> {
  const response = await fetch('/api/analytics/stats', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchTopTrades(): Promise<TopTrades> {
  const response = await fetch('/api/analytics/top-trades', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchExposure(): Promise<ExposureData> {
  const response = await fetch('/api/analytics/exposure', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

// Analytics hooks
export function usePnLHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<PnLHistoryPoint[]>({
    queryKey: ['/api/analytics/pnl-history'],
    queryFn: fetchPnLHistory,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useAnalyticsStats() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<AnalyticsStats>({
    queryKey: ['/api/analytics/stats'],
    queryFn: fetchAnalyticsStats,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useTopTrades() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<TopTrades>({
    queryKey: ['/api/analytics/top-trades'],
    queryFn: fetchTopTrades,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useExposure() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<ExposureData>({
    queryKey: ['/api/analytics/exposure'],
    queryFn: fetchExposure,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Price Alert types
export interface PriceAlert {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: string;
  targetPrice: string;
  condition: 'ABOVE' | 'BELOW';
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
  timestamp: string;
}

// Take-Profit Order types
export interface TakeProfitOrder {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: string;
  shares: string;
  targetPrice: string;
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
  timestamp: string;
}

// Trade Note types
export interface TradeNote {
  id: string;
  tradeId: string;
  note: string;
  timestamp: string;
}

// Price Alerts API
async function fetchPriceAlerts(): Promise<PriceAlert[]> {
  const response = await fetch('/api/alerts', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

export function usePriceAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<PriceAlert[]>({
    queryKey: ['/api/alerts'],
    queryFn: fetchPriceAlerts,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCreatePriceAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: { marketId: string; marketTitle: string; outcome: string; targetPrice: string; condition: string }) => {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({ title: 'Price Alert Created', description: 'You will be notified when the price is reached' });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });
}

export function useCancelPriceAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to cancel alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({ title: 'Alert Cancelled' });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      }
    },
  });
}

// Take-Profit Orders API
async function fetchTakeProfits(): Promise<TakeProfitOrder[]> {
  const response = await fetch('/api/orders/takeprofit', { credentials: 'include' });
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

export function useTakeProfits() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<TakeProfitOrder[]>({
    queryKey: ['/api/orders/takeprofit'],
    queryFn: fetchTakeProfits,
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCreateTakeProfit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: { marketId: string; marketTitle: string; outcome: string; shares: string; targetPrice: string }) => {
      const response = await fetch('/api/orders/takeprofit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create take-profit order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/takeprofit'] });
      toast({ title: 'Take-Profit Order Created', description: 'Will automatically sell when price is reached' });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });
}

export function useCancelTakeProfit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/takeprofit/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to cancel take-profit order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/takeprofit'] });
      toast({ title: 'Take-Profit Cancelled' });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      }
    },
  });
}

// Trade Notes API
export function useTradeNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<TradeNote[]>({
    queryKey: ['/api/notes'],
    queryFn: async () => {
      const response = await fetch('/api/notes', { credentials: 'include' });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        redirectToLogin(toast);
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useSaveTradeNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ tradeId, note }: { tradeId: string; note: string }) => {
      const response = await fetch(`/api/notes/${tradeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note }),
      });
      
      if (!response.ok) throw new Error('Failed to save note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({ title: 'Note Saved' });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      }
    },
  });
}

export function useDeleteTradeNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (tradeId: string) => {
      const response = await fetch(`/api/notes/${tradeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({ title: 'Note Deleted' });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      }
    },
  });
}

// Helper functions for client-side calculations
export function getMarketExposure(
  marketId: string,
  positions: Position[],
  orders: LimitOrder[]
): number {
  let exposure = 0;
  
  // Current position value
  positions
    .filter(p => p.marketId === marketId)
    .forEach(p => {
      exposure += parseFloat(p.shares) * parseFloat(p.avgPrice);
    });
  
  // Open limit buy orders
  orders
    .filter(o => o.marketId === marketId && o.status === 'OPEN' && o.type === 'BUY')
    .forEach(o => {
      exposure += parseFloat(o.shares) * parseFloat(o.limitPrice);
    });
  
  return exposure;
}

export function canInvestInMarket(
  marketId: string,
  amount: number,
  maxAllocationPerMarket: number,
  positions: Position[],
  orders: LimitOrder[]
): boolean {
  const totalPortfolio = 10000; // Using initial balance as reference
  const maxAllowed = (maxAllocationPerMarket / 100) * totalPortfolio;
  const currentExposure = getMarketExposure(marketId, positions, orders);
  return (currentExposure + amount) <= maxAllowed;
}
