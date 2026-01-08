import { useOrders } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface OrderBookProps {
  marketId: string;
}

export function OrderBook({ marketId }: OrderBookProps) {
  const { data: orders = [] } = useOrders();
  
  const openOrders = orders.filter(o => o.marketId === marketId && o.status === 'OPEN');
  
  const buyOrders = openOrders
    .filter(o => o.type === 'BUY')
    .sort((a, b) => parseFloat(b.limitPrice) - parseFloat(a.limitPrice));
  
  const sellOrders = openOrders
    .filter(o => o.type === 'SELL')
    .sort((a, b) => parseFloat(a.limitPrice) - parseFloat(b.limitPrice));

  // Aggregate orders by price level
  const aggregateBuys = buyOrders.reduce((acc, order) => {
    const price = parseFloat(order.limitPrice);
    const shares = parseFloat(order.shares);
    const key = `${order.outcome}-${price.toFixed(2)}`;
    if (!acc[key]) {
      acc[key] = { outcome: order.outcome, price, totalShares: 0 };
    }
    acc[key].totalShares += shares;
    return acc;
  }, {} as Record<string, { outcome: 'YES' | 'NO'; price: number; totalShares: number }>);

  const aggregateSells = sellOrders.reduce((acc, order) => {
    const price = parseFloat(order.limitPrice);
    const shares = parseFloat(order.shares);
    const key = `${order.outcome}-${price.toFixed(2)}`;
    if (!acc[key]) {
      acc[key] = { outcome: order.outcome, price, totalShares: 0 };
    }
    acc[key].totalShares += shares;
    return acc;
  }, {} as Record<string, { outcome: 'YES' | 'NO'; price: number; totalShares: number }>);

  const buyLevels = Object.values(aggregateBuys).sort((a, b) => b.price - a.price);
  const sellLevels = Object.values(aggregateSells).sort((a, b) => a.price - b.price);

  if (openOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Order Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No open orders for this market
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Order Book
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Buy Side */}
          <div>
            <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 uppercase tracking-wider">
              Bids (Buy Orders)
            </div>
            <div className="space-y-1">
              {buyLevels.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">No bids</div>
              ) : (
                buyLevels.slice(0, 5).map((level, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between items-center text-sm px-2 py-1.5 rounded bg-green-500/10 border border-green-500/20"
                  >
                    <span className={`text-xs font-medium ${level.outcome === 'YES' ? 'text-green-600' : 'text-red-600'}`}>
                      {level.outcome}
                    </span>
                    <span className="font-mono text-green-700 dark:text-green-300">
                      ${level.price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {level.totalShares} shares
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sell Side */}
          <div>
            <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 uppercase tracking-wider">
              Asks (Sell Orders)
            </div>
            <div className="space-y-1">
              {sellLevels.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">No asks</div>
              ) : (
                sellLevels.slice(0, 5).map((level, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between items-center text-sm px-2 py-1.5 rounded bg-red-500/10 border border-red-500/20"
                  >
                    <span className={`text-xs font-medium ${level.outcome === 'YES' ? 'text-green-600' : 'text-red-600'}`}>
                      {level.outcome}
                    </span>
                    <span className="font-mono text-red-700 dark:text-red-300">
                      ${level.price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {level.totalShares} shares
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
