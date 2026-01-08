import { Layout } from "@/components/layout";
import { 
  useUserProfile, 
  usePositions, 
  useTrades, 
  useOrders, 
  useStopLosses,
  useCancelOrder,
  useCancelStopLoss 
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Wallet, ArrowUpRight, ArrowDownRight, History, ListFilter, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMarkets } from "@/lib/polymarket";
import { format } from "date-fns";

export default function Portfolio() {
  const { data: profile } = useUserProfile();
  const { data: positions = [] } = usePositions();
  const { data: trades = [] } = useTrades();
  const { data: orders = [] } = useOrders();
  const { data: stopLossOrders = [] } = useStopLosses();
  const cancelOrder = useCancelOrder();
  const cancelStopLoss = useCancelStopLoss();
  
  const { data: markets } = useQuery({ queryKey: ['markets'], queryFn: fetchMarkets, refetchInterval: 5000 });

  const balance = profile ? parseFloat(profile.balance) : 0;

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
                          <TableCell>
                            <Link href={`/market/${pos.marketId}`}>
                              <Button variant="ghost" size="sm">Trade</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
             </Table>
          </Card>
        </div>

        {/* Recent Trades */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <History className="h-5 w-5 text-muted-foreground" />
             <h3 className="text-xl font-semibold">Trade History</h3>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No trades yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trades.slice(0, 20).map((trade) => {
                      const shares = parseFloat(trade.shares);
                      const price = parseFloat(trade.price);
                      const total = shares * price;
                      
                      return (
                        <TableRow key={trade.id}>
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
