import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { PolymarketEvent } from "@/lib/polymarket";
import { Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [isLimitOrder, setIsLimitOrder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { buyShares, sellShares, placeLimitOrder, balance } = useStore();
  const { toast } = useToast();

  const currentPrice = outcome === "YES" ? parseFloat(market.outcomePrices[0]) : parseFloat(market.outcomePrices[1]);
  const orderPrice = isLimitOrder && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const numShares = parseFloat(shares) || 0;
  const totalCost = numShares * orderPrice;
  
  const handleTrade = async (type: "BUY" | "SELL") => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (isLimitOrder) {
        if (!orderPrice || orderPrice <= 0 || orderPrice >= 1) throw new Error("Invalid limit price");
        placeLimitOrder(market.id, market.question, outcome, type, numShares, orderPrice);
        toast({
          title: "Limit Order Placed",
          description: `${type} limit order for ${numShares} ${outcome} shares at $${orderPrice.toFixed(2)}`,
        });
      } else {
        if (type === "BUY") {
          buyShares(market.id, market.question, outcome, numShares, currentPrice);
          toast({
            title: "Market Buy Executed",
            description: `Bought ${numShares} ${outcome} shares at $${currentPrice.toFixed(2)}`,
            className: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300",
          });
        } else {
          sellShares(market.id, market.question, outcome, numShares, currentPrice);
          toast({
             title: "Market Sell Executed",
             description: `Sold ${numShares} ${outcome} shares at $${currentPrice.toFixed(2)}`,
          });
        }
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl leading-relaxed">{market.question}</DialogTitle>
          <DialogDescription>
            Current Market Price: <span className="font-mono font-bold text-foreground">${currentPrice.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 pb-2">
           <Switch id="limit-mode" checked={isLimitOrder} onCheckedChange={setIsLimitOrder} />
           <Label htmlFor="limit-mode">Limit Order Mode</Label>
        </div>

        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

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
            </div>

            {isLimitOrder && (
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

            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/50">
              <span className="text-sm text-muted-foreground">Est. Total</span>
              <span className="font-mono font-bold text-lg">${totalCost.toFixed(2)}</span>
            </div>

             <div className="flex justify-between items-center px-1">
              <span className="text-xs text-muted-foreground">Your Balance</span>
              <span className="font-mono text-xs">${balance.toFixed(2)}</span>
            </div>
          </div>

          <TabsContent value="buy" className="mt-4">
            <Button 
              className="w-full font-bold" 
              size="lg" 
              onClick={() => handleTrade("BUY")} 
              disabled={isSubmitting || (totalCost > balance && !isLimitOrder) || numShares <= 0}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isLimitOrder ? "Place Limit Buy" : "Buy Market"}
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
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isLimitOrder ? "Place Limit Sell" : "Sell Market"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
