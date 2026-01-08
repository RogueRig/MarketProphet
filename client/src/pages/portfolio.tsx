import { Layout } from "@/components/layout";
import { 
  useUserProfile, 
  usePositions, 
  useTrades, 
  useOrders, 
  useStopLosses,
  useCancelOrder,
  useCancelStopLoss,
  usePriceAlerts,
  useCancelPriceAlert,
  useTakeProfits,
  useCancelTakeProfit,
  useTradeNotes,
  useSaveTradeNote,
  useWatchlist,
  useRemoveFromWatchlist,
  useTrailingStopLosses,
  useCancelTrailingStopLoss,
  useBracketOrders,
  useCancelBracketOrder,
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Wallet, ArrowUpRight, ArrowDownRight, History, ListFilter, ShieldAlert, Bell, Target, FileText, Edit2, Check, X, Star, TrendingDown, Layers } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { useQuery } from "@tanstack/react-query";
import { fetchMarkets } from "@/lib/polymarket";
import { format } from "date-fns";
import { useState } from "react";

export default function Portfolio() {
  const { data: profile } = useUserProfile();
  const { data: positions = [] } = usePositions();
  const { data: trades = [] } = useTrades();
  const { data: orders = [] } = useOrders();
  const { data: stopLossOrders = [] } = useStopLosses();
  const { data: priceAlerts = [] } = usePriceAlerts();
  const { data: takeProfits = [] } = useTakeProfits();
  const { data: tradeNotes = [] } = useTradeNotes();
  const { data: watchlistItems = [] } = useWatchlist();
  const { data: trailingStopLosses = [] } = useTrailingStopLosses();
  const { data: bracketOrders = [] } = useBracketOrders();
  
  const cancelOrder = useCancelOrder();
  const cancelStopLoss = useCancelStopLoss();
  const cancelPriceAlert = useCancelPriceAlert();
  const cancelTakeProfit = useCancelTakeProfit();
  const saveTradeNote = useSaveTradeNote();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const cancelTrailingStopLoss = useCancelTrailingStopLoss();
  const cancelBracketOrder = useCancelBracketOrder();
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  
  const { data: markets } = useQuery({ queryKey: ['markets'], queryFn: fetchMarkets, refetchInterval: 5000 });

  const balance = profile ? parseFloat(profile.balance) : 0;
  
  const activeAlerts = priceAlerts.filter(a => a.status === 'ACTIVE');
  const activeTakeProfits = takeProfits.filter(tp => tp.status === 'ACTIVE');
  const activeTrailingStops = trailingStopLosses.filter(t => t.status === 'ACTIVE');
  const activeBracketOrders = bracketOrders.filter(b => b.status === 'ACTIVE');
  
  const getTradeNote = (tradeId: string) => tradeNotes.find(n => n.tradeId === tradeId);
  
  const startEditingNote = (tradeId: string, existingNote?: string) => {
    setEditingNoteId(tradeId);
    setNoteText(existingNote || '');
  };
  
  const saveNote = (tradeId: string) => {
    if (noteText.trim()) {
      saveTradeNote.mutate({ tradeId, note: noteText.trim() });
    }
    setEditingNoteId(null);
    setNoteText('');
  };
  
  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const totalPositionValue = positions.reduce((acc, pos) => {
    const market = markets?.find(m => m.id === pos.marketId);
    let currentPrice = parseFloat(pos.avgPrice);
    if (market) {
      currentPrice = pos.outcome === 'YES' 
        ? parseFloat(market.outcomePrices[0]) 
        : parseFloat(market.outcomePrices[1]);
    }
    return acc + (parseFloat(pos.shares) * currentPrice);
  }, 0);

  const totalPortfolioValue = balance + totalPositionValue;
  const initialBalance = 10000;
  const totalPnL = totalPortfolioValue - initialBalance;
  const totalPnLPercent = (totalPnL / initialBalance) * 100;

  const openOrders = orders.filter(o => o.status === 'OPEN');
  const activeStopLosses = stopLossOrders.filter(o => o.status === 'ACTIVE');

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Balance</CardTitle>
              <div className="text-xs text-muted-foreground">Available</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total P/L</CardTitle>
              {totalPnL >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} ({totalPnLPercent.toFixed(2)}%)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open Limit Orders */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
             <ListFilter className="h-5 w-5 text-muted-foreground" />
             <h3 className="text-xl font-semibold">Open Orders ({openOrders.length})</h3>
           </div>
           <Card>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Type</TableHead>
                   <TableHead>Market</TableHead>
                   <TableHead>Outcome</TableHead>
                   <TableHead className="text-right">Shares</TableHead>
                   <TableHead className="text-right">Limit Price</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {openOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No open limit orders.
                      </TableCell>
                    </TableRow>
                 ) : (
                    openOrders.map(order => (
                      <TableRow key={order.id}>
                         <TableCell>
                           <span className={`text-xs font-bold uppercase ${order.type === 'BUY' ? 'text-green-500' : 'text-blue-500'}`}>
                            {order.type}
                           </span>
                         </TableCell>
                         <TableCell className="max-w-[200px] truncate">{order.marketTitle}</TableCell>
                         <TableCell>{order.outcome}</TableCell>
                         <TableCell className="text-right font-mono">{parseFloat(order.shares)}</TableCell>
                         <TableCell className="text-right font-mono">${parseFloat(order.limitPrice).toFixed(2)}</TableCell>
                         <TableCell className="text-right">
                           <Button 
                             variant="destructive" 
                             size="sm" 
                             onClick={() => cancelOrder.mutate(order.id)} 
                             className="h-7 text-xs"
                             disabled={cancelOrder.isPending}
                           >
                             Cancel
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
           </Card>
        </div>

        {/* Active Stop-Losses */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
             <ShieldAlert className="h-5 w-5 text-orange-500" />
             <h3 className="text-xl font-semibold">Active Stop-Losses ({activeStopLosses.length})</h3>
           </div>
           <Card>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Market</TableHead>
                   <TableHead>Outcome</TableHead>
                   <TableHead className="text-right">Shares</TableHead>
                   <TableHead className="text-right">Trigger Price</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {activeStopLosses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No active stop-loss orders.
                      </TableCell>
                    </TableRow>
                 ) : (
                    activeStopLosses.map(sl => (
                      <TableRow key={sl.id}>
                         <TableCell className="max-w-[200px] truncate">{sl.marketTitle}</TableCell>
                         <TableCell>{sl.outcome}</TableCell>
                         <TableCell className="text-right font-mono">{parseFloat(sl.shares)}</TableCell>
                         <TableCell className="text-right font-mono text-orange-500">${parseFloat(sl.triggerPrice).toFixed(2)}</TableCell>
                         <TableCell className="text-right">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => cancelStopLoss.mutate(sl.id)} 
                             className="h-7 text-xs"
                             disabled={cancelStopLoss.isPending}
                           >
                             Remove
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
           </Card>
        </div>

        {/* Active Take-Profits */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
             <Target className="h-5 w-5 text-green-500" />
             <h3 className="text-xl font-semibold">Take-Profit Orders ({activeTakeProfits.length})</h3>
           </div>
           <Card>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Market</TableHead>
                   <TableHead>Outcome</TableHead>
                   <TableHead className="text-right">Shares</TableHead>
                   <TableHead className="text-right">Target Price</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {activeTakeProfits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No active take-profit orders. Set one on a market page to auto-sell at your target.
                      </TableCell>
                    </TableRow>
                 ) : (
                    activeTakeProfits.map(tp => (
                      <TableRow key={tp.id} data-testid={`takeprofit-row-${tp.id}`}>
                         <TableCell className="max-w-[200px] truncate">{tp.marketTitle}</TableCell>
                         <TableCell>{tp.outcome}</TableCell>
                         <TableCell className="text-right font-mono">{parseFloat(tp.shares)}</TableCell>
                         <TableCell className="text-right font-mono text-green-500">${parseFloat(tp.targetPrice).toFixed(2)}</TableCell>
                         <TableCell className="text-right">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => cancelTakeProfit.mutate(tp.id)} 
                             className="h-7 text-xs"
                             disabled={cancelTakeProfit.isPending}
                             data-testid={`cancel-takeprofit-${tp.id}`}
                           >
                             Remove
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
           </Card>
        </div>

        {/* Price Alerts */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
             <Bell className="h-5 w-5 text-blue-500" />
             <h3 className="text-xl font-semibold">Price Alerts ({activeAlerts.length})</h3>
           </div>
           <Card>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Market</TableHead>
                   <TableHead>Outcome</TableHead>
                   <TableHead>Condition</TableHead>
                   <TableHead className="text-right">Target Price</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {activeAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No active price alerts. Set one on a market page to get notified.
                      </TableCell>
                    </TableRow>
                 ) : (
                    activeAlerts.map(alert => (
                      <TableRow key={alert.id} data-testid={`alert-row-${alert.id}`}>
                         <TableCell className="max-w-[200px] truncate">{alert.marketTitle}</TableCell>
                         <TableCell>{alert.outcome}</TableCell>
                         <TableCell>
                           <span className={`text-xs font-medium ${alert.condition === 'ABOVE' ? 'text-green-500' : 'text-red-500'}`}>
                             {alert.condition === 'ABOVE' ? 'Goes above' : 'Falls below'}
                           </span>
                         </TableCell>
                         <TableCell className="text-right font-mono text-blue-500">${parseFloat(alert.targetPrice).toFixed(2)}</TableCell>
                         <TableCell className="text-right">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => cancelPriceAlert.mutate(alert.id)} 
                             className="h-7 text-xs"
                             disabled={cancelPriceAlert.isPending}
                             data-testid={`cancel-alert-${alert.id}`}
                           >
                             Remove
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
           </Card>
        </div>

        {/* Watchlist */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
             <Star className="h-5 w-5 text-yellow-500" />
             <h3 className="text-xl font-semibold">Watchlist ({watchlistItems.length})</h3>
           </div>
           <Card>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Market</TableHead>
                   <TableHead className="text-right">Added</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {watchlistItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No markets in watchlist. Click the star on any market to add it.
                      </TableCell>
                    </TableRow>
                 ) : (
                    watchlistItems.map(item => (
                      <TableRow key={item.id} data-testid={`watchlist-row-${item.id}`}>
                         <TableCell>
                           <Link href={`/market/${item.marketId}`} className="hover:underline text-primary">
                             {item.marketTitle}
                           </Link>
                         </TableCell>
                         <TableCell className="text-right text-xs text-muted-foreground">
                           {format(new Date(item.timestamp), 'MMM d')}
                         </TableCell>
                         <TableCell className="text-right">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => removeFromWatchlist.mutate(item.marketId)} 
                             className="h-7 text-xs"
                             disabled={removeFromWatchlist.isPending}
                             data-testid={`remove-watchlist-${item.id}`}
                           >
                             Remove
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
           </Card>
        </div>

        {/* Trailing Stop-Losses */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
             <TrendingDown className="h-5 w-5 text-purple-500" />
             <h3 className="text-xl font-semibold">Trailing Stop-Losses ({activeTrailingStops.length})</h3>
           </div>
           <Card>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Market</TableHead>
                   <TableHead>Outcome</TableHead>
                   <TableHead className="text-right">Shares</TableHead>
                   <TableHead className="text-right">Trail %</TableHead>
                   <TableHead className="text-right">Current Trigger</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {activeTrailingStops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No trailing stop-losses. Set one on a market page.
                      </TableCell>
                    </TableRow>
                 ) : (
                    activeTrailingStops.map(ts => (
                      <TableRow key={ts.id} data-testid={`trailing-row-${ts.id}`}>
                         <TableCell className="max-w-[200px] truncate">{ts.marketTitle}</TableCell>
                         <TableCell>{ts.outcome}</TableCell>
                         <TableCell className="text-right font-mono">{parseFloat(ts.shares)}</TableCell>
                         <TableCell className="text-right font-mono text-purple-500">{parseFloat(ts.trailPercent)}%</TableCell>
                         <TableCell className="text-right font-mono">${parseFloat(ts.currentTrigger).toFixed(2)}</TableCell>
                         <TableCell className="text-right">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => cancelTrailingStopLoss.mutate(ts.id)} 
                             className="h-7 text-xs"
                             disabled={cancelTrailingStopLoss.isPending}
                             data-testid={`cancel-trailing-${ts.id}`}
                           >
                             Remove
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
           </Card>
        </div>

        {/* Bracket Orders */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
             <Layers className="h-5 w-5 text-indigo-500" />
             <h3 className="text-xl font-semibold">Bracket Orders ({activeBracketOrders.length})</h3>
           </div>
           <Card>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Market</TableHead>
                   <TableHead>Outcome</TableHead>
                   <TableHead className="text-right">Shares</TableHead>
                   <TableHead className="text-right">Take-Profit</TableHead>
                   <TableHead className="text-right">Stop-Loss</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {activeBracketOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No bracket orders. Set one on a market page to combine TP and SL.
                      </TableCell>
                    </TableRow>
                 ) : (
                    activeBracketOrders.map(bo => (
                      <TableRow key={bo.id} data-testid={`bracket-row-${bo.id}`}>
                         <TableCell className="max-w-[200px] truncate">{bo.marketTitle}</TableCell>
                         <TableCell>{bo.outcome}</TableCell>
                         <TableCell className="text-right font-mono">{parseFloat(bo.shares)}</TableCell>
                         <TableCell className="text-right font-mono text-green-500">${parseFloat(bo.takeProfitPrice).toFixed(2)}</TableCell>
                         <TableCell className="text-right font-mono text-red-500">${parseFloat(bo.stopLossPrice).toFixed(2)}</TableCell>
                         <TableCell className="text-right">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => cancelBracketOrder.mutate(bo.id)} 
                             className="h-7 text-xs"
                             disabled={cancelBracketOrder.isPending}
                             data-testid={`cancel-bracket-${bo.id}`}
                           >
                             Remove
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
           </Card>
        </div>

        {/* Positions Table */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Active Positions</h3>
          <Card>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No active positions. <Link href="/" className="text-primary hover:underline">Start trading</Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    positions.map((pos) => {
                      const market = markets?.find(m => m.id === pos.marketId);
                      const avgPrice = parseFloat(pos.avgPrice);
                      const shares = parseFloat(pos.shares);
                      const currentPrice = market 
                        ? (pos.outcome === 'YES' ? parseFloat(market.outcomePrices[0]) : parseFloat(market.outcomePrices[1]))
                        : avgPrice;
                      
                      const marketValue = shares * currentPrice;
                      const ret = (currentPrice - avgPrice) * shares;
                      const retPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                      
                      return (
                        <TableRow key={`${pos.marketId}-${pos.outcome}`}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {market?.question || `Market ${pos.marketId}`}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${pos.outcome === 'YES' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                              {pos.outcome}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{shares}</TableCell>
                          <TableCell className="text-right font-mono">${avgPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">${currentPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">${marketValue.toFixed(2)}</TableCell>
                          <TableCell className={`text-right font-mono ${ret >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {ret >= 0 ? '+' : ''}{ret.toFixed(2)} ({retPercent.toFixed(1)}%)
                          </TableCell>
                          <TableCell className="flex gap-1 items-center">
                            <Link href={`/market/${pos.marketId}`}>
                              <Button variant="ghost" size="sm">Trade</Button>
                            </Link>
                            <ShareButton 
                              type="position"
                              marketTitle={market?.question || `Market ${pos.marketId}`}
                              outcome={pos.outcome}
                              shares={shares.toString()}
                              pnl={ret.toFixed(2)}
                              marketId={pos.marketId}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
             </Table>
          </Card>
        </div>

        {/* Recent Trades with Notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <History className="h-5 w-5 text-muted-foreground" />
             <h3 className="text-xl font-semibold">Trade History</h3>
             <FileText className="h-4 w-4 text-muted-foreground ml-2" />
             <span className="text-sm text-muted-foreground">Click the note icon to add reasoning</span>
          </div>
          <Card>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No trades yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trades.slice(0, 20).map((trade) => {
                      const shares = parseFloat(trade.shares);
                      const price = parseFloat(trade.price);
                      const total = shares * price;
                      const existingNote = getTradeNote(trade.id);
                      const isEditing = editingNoteId === trade.id;
                      
                      return (
                        <TableRow key={trade.id} data-testid={`trade-row-${trade.id}`}>
                          <TableCell className="text-muted-foreground text-xs">
                            {format(new Date(trade.timestamp), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-bold uppercase ${trade.type === 'BUY' ? 'text-green-500' : 'text-blue-500'}`}>
                              {trade.type}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={trade.marketTitle}>
                            {trade.marketTitle}
                          </TableCell>
                          <TableCell>
                             <span className={`text-xs ${trade.outcome === 'YES' ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.outcome}
                             </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{shares}</TableCell>
                          <TableCell className="text-right font-mono">${price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            ${total.toFixed(2)}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="Add your reasoning..."
                                  className="h-7 text-xs"
                                  data-testid={`note-input-${trade.id}`}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={() => saveNote(trade.id)}
                                  data-testid={`save-note-${trade.id}`}
                                >
                                  <Check className="h-3 w-3 text-green-500" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={cancelEditingNote}
                                >
                                  <X className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            ) : existingNote ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground truncate" title={existingNote.note}>
                                  {existingNote.note}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={() => startEditingNote(trade.id, existingNote.note)}
                                  data-testid={`edit-note-${trade.id}`}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs text-muted-foreground"
                                onClick={() => startEditingNote(trade.id)}
                                data-testid={`add-note-${trade.id}`}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Add note
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <ShareButton 
                              type="trade"
                              marketTitle={trade.marketTitle}
                              outcome={trade.outcome}
                              price={price.toFixed(2)}
                              shares={shares.toString()}
                              side={trade.type}
                              marketId={trade.marketId}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
             </Table>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
