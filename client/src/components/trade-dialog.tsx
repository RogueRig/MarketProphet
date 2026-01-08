import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useUserProfile, 
  usePositions, 
  useOrders, 
  useMarketTrade, 
  usePlaceLimitOrder, 
  usePlaceStopLoss,
  getMarketExposure,
  canInvestInMarket 
} from "@/lib/store";
import { PolymarketEvent } from "@/lib/polymarket";
import { Loader2, AlertTriangle } from "lucide-react";

interface TradeDialogProps {
  market: PolymarketEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOutcome?: "YES" | "NO";
}

export function TradeDialog({ market, open, onOpenChange, defaultOutcome = "YES" }: TradeDialogProps) {
  const [outcome, setOutcome] = useState<"YES" | "NO">(defaultOutcome);
  const [shares, setShares] = useState<string>("10");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [orderMode, setOrderMode] = useState<"market" | "limit" | "stop-loss">("market");
  
  const { data: profile } = useUserProfile();
  const { data: positions = [] } = usePositions();
  const { data: orders = [] } = useOrders();
  
  const marketTrade = useMarketTrade();
  const placeLimitOrder = usePlaceLimitOrder();
  const placeStopLoss = usePlaceStopLoss();

  const balance = profile ? parseFloat(profile.balance) : 0;
  const maxAllocationPerMarket = profile?.maxAllocationPerMarket || 25;

  // Reset outcome when dialog opens with new default
  useEffect(() => {
    setOutcome(defaultOutcome);
  }, [defaultOutcome, open]);

  const currentPrice = outcome === "YES" ? parseFloat(market.outcomePrices[0]) : parseFloat(market.outcomePrices[1]);
  const orderPrice = orderMode === "limit" && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const numShares = parseFloat(shares) || 0;
  const totalCost = numShares * orderPrice;
  
  // Check allocation limit
  const currentExposure = getMarketExposure(market.id, positions, orders);
  const maxAllowed = (maxAllocationPerMarket / 100) * 10000;
  const wouldExceedLimit = (currentExposure + totalCost) > maxAllowed;
  const remainingAllocation = Math.max(0, maxAllowed - currentExposure);

  // Get current position for stop-loss
  const currentPosition = positions.find(p => p.marketId === market.id && p.outcome === outcome);
  const currentPositionShares = currentPosition ? parseFloat(currentPosition.shares) : 0;
  
  const isSubmitting = marketTrade.isPending || placeLimitOrder.isPending || placeStopLoss.isPending;
  
  const handleTrade = async (type: "BUY" | "SELL") => {
    try {
      if (orderMode === "limit") {
        if (!orderPrice || orderPrice <= 0 || orderPrice >= 1) {
          throw new Error("Invalid limit price");
        }
        await placeLimitOrder.mutateAsync({
          marketId: market.id,
          marketTitle: market.question,
          outcome,
          type,
          shares: numShares,
          limitPrice: orderPrice,
        });
      } else if (orderMode === "stop-loss") {
        const triggerPrice = parseFloat(stopLossPrice);
        if (!triggerPrice || triggerPrice <= 0 || triggerPrice >= 1) {
          throw new Error("Invalid stop-loss price");
        }
        await placeStopLoss.mutateAsync({
          marketId: market.id,
          marketTitle: market.question,
          outcome,
          shares: numShares,
          triggerPrice,
        });
      } else {
        await marketTrade.mutateAsync({
          marketId: market.id,
          marketTitle: market.question,
          outcome,
          type,
          shares: numShares,
          price: currentPrice,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl leading-relaxed">{market.question}</DialogTitle>
          <DialogDescription>
            Current Market Price: <span className="font-mono font-bold text-foreground">${currentPrice.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Order Mode Selector */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          <Button 
            variant={orderMode === "market" ? "default" : "ghost"} 
            size="sm" 
            className="flex-1"
            onClick={() => setOrderMode("market")}
          >
            Market
          </Button>
          <Button 
            variant={orderMode === "limit" ? "default" : "ghost"} 
            size="sm" 
            className="flex-1"
            onClick={() => setOrderMode("limit")}
          >
            Limit
          </Button>
          <Button 
            variant={orderMode === "stop-loss" ? "default" : "ghost"} 
            size="sm" 
            className="flex-1"
            onClick={() => setOrderMode("stop-loss")}
          >
            Stop-Loss
          </Button>
        </div>

        <Tabs defaultValue="buy" className="w-full">
          {orderMode !== "stop-loss" && (
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
          )}

          <div className="space-y-4 py-2">
            <div className="flex gap-2 mb-4">
               <Button 
                  variant={outcome === "YES" ? "default" : "outline"} 
                  className={`flex-1 ${outcome === "YES" ? 'bg-green-600 hover:bg-green-700' : 'hover:border-green-500/50'}`}
                  onClick={() => setOutcome("YES")}
               >
                 YES
               </Button>
               <Button 
                  variant={outcome === "NO" ? "default" : "outline"} 
                  className={`flex-1 ${outcome === "NO" ? 'bg-red-600 hover:bg-red-700' : 'hover:border-red-500/50'}`}
                  onClick={() => setOutcome("NO")}
               >
                 NO
               </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Number of Shares</label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={shares} 
                  onChange={(e) => setShares(e.target.value)}
                  className="pl-10 font-mono text-lg"
                  min="1"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  #
                </div>
              </div>
              {orderMode === "stop-loss" && currentPosition && (
                <p className="text-xs text-muted-foreground">
                  You have {currentPositionShares} {outcome} shares to protect
                </p>
              )}
            </div>

            {orderMode === "limit" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-muted-foreground">Limit Price ($)</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={limitPrice} 
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="pl-8 font-mono text-lg"
                    placeholder={currentPrice.toFixed(2)}
                    step="0.01"
                    min="0.01"
                    max="0.99"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </div>
                </div>
              </div>
            )}

            {orderMode === "stop-loss" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-muted-foreground">Trigger Price (Sell if drops to)</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={stopLossPrice} 
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    className="pl-8 font-mono text-lg"
                    placeholder={(currentPrice * 0.8).toFixed(2)}
                    step="0.01"
                    min="0.01"
                    max="0.99"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically sells your shares if the price falls to this level
                </p>
              </div>
            )}

            {orderMode !== "stop-loss" && (
              <>
                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/50">
                  <span className="text-sm text-muted-foreground">Est. Total</span>
                  <span className="font-mono font-bold text-lg">${totalCost.toFixed(2)}</span>
                </div>

                {wouldExceedLimit && (
                  <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Exceeds {maxAllocationPerMarket}% allocation limit. 
                      Remaining: ${remainingAllocation.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center px-1 text-xs text-muted-foreground">
                  <span>Balance: ${balance.toFixed(2)}</span>
                  <span>Market exposure: ${currentExposure.toFixed(2)} / ${maxAllowed.toFixed(0)}</span>
                </div>
              </>
            )}
          </div>

          {orderMode === "stop-loss" ? (
            <div className="mt-4">
              <Button 
                className="w-full font-bold bg-orange-600 hover:bg-orange-700" 
                size="lg" 
                onClick={() => handleTrade("SELL")} 
                disabled={isSubmitting || numShares <= 0 || !stopLossPrice || !currentPosition || currentPositionShares < numShares}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Set Stop-Loss"}
              </Button>
            </div>
          ) : (
            <>
              <TabsContent value="buy" className="mt-4">
                <Button 
                  className="w-full font-bold" 
                  size="lg" 
                  onClick={() => handleTrade("BUY")} 
                  disabled={isSubmitting || totalCost > balance || numShares <= 0 || wouldExceedLimit}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : orderMode === "limit" ? "Place Limit Buy" : "Buy Market"}
                </Button>
              </TabsContent>
              
              <TabsContent value="sell" className="mt-4">
                <Button 
                  variant="secondary" 
                  className="w-full font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400" 
                  size="lg" 
                  onClick={() => handleTrade("SELL")}
                  disabled={isSubmitting || numShares <= 0}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : orderMode === "limit" ? "Place Limit Sell" : "Sell Market"}
                </Button>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
