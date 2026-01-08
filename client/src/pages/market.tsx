import { Layout } from "@/components/layout";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchMarket } from "@/lib/polymarket";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TradeDialog } from "@/components/trade-dialog";
import { OrderBook } from "@/components/order-book";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Share2, Info, Bell, Target } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePositions, useCreatePriceAlert, useCreateTakeProfit } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MarketPage() {
  const [, params] = useRoute("/market/:id");
  const { toast } = useToast();
  
  const { data: market, isLoading } = useQuery({
    queryKey: ['market', params?.id],
    queryFn: () => fetchMarket(params?.id || ""),
    enabled: !!params?.id,
    refetchInterval: 3000
  });
  
  const { data: positions = [] } = usePositions();
  const createPriceAlert = useCreatePriceAlert();
  const createTakeProfit = useCreateTakeProfit();

  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeOutcome, setTradeOutcome] = useState<"YES" | "NO">("YES");
  
  // Price alert state
  const [alertOutcome, setAlertOutcome] = useState<string>("YES");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCondition, setAlertCondition] = useState<string>("BELOW");
  
  // Take-profit state
  const [tpOutcome, setTpOutcome] = useState<string>("YES");
  const [tpPrice, setTpPrice] = useState("");
  const [tpShares, setTpShares] = useState("");
  
  // Get user positions for this market
  const marketPositions = positions.filter(p => p.marketId === params?.id);
  const hasYesPosition = marketPositions.some(p => p.outcome === 'YES' && parseFloat(p.shares) > 0);
  const hasNoPosition = marketPositions.some(p => p.outcome === 'NO' && parseFloat(p.shares) > 0);
  const yesPosition = marketPositions.find(p => p.outcome === 'YES');
  const noPosition = marketPositions.find(p => p.outcome === 'NO');
  
  const handleCreateAlert = () => {
    if (!market || !alertPrice) return;
    createPriceAlert.mutate({
      marketId: market.id,
      marketTitle: market.question,
      outcome: alertOutcome,
      targetPrice: alertPrice,
      condition: alertCondition
    });
    setAlertPrice("");
  };
  
  const handleCreateTakeProfit = () => {
    if (!market || !tpPrice || !tpShares) return;
    createTakeProfit.mutate({
      marketId: market.id,
      marketTitle: market.question,
      outcome: tpOutcome,
      shares: tpShares,
      targetPrice: tpPrice
    });
    setTpPrice("");
    setTpShares("");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!market) return <Layout><div>Market not found</div></Layout>;

  const yesPrice = parseFloat(market.outcomePrices[0]);
  const noPrice = parseFloat(market.outcomePrices[1]);
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20">
        <Link href="/">
          <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Button>
        </Link>

        <div className="grid gap-8">
          {/* Header */}
          <div className="flex gap-6 items-start">
             {market.icon && (
               <div className="bg-card p-4 rounded-2xl shadow-sm border border-border/50 hidden md:block">
                 <img src={market.icon} alt="" className="w-16 h-16 object-contain" />
               </div>
             )}
             <div className="flex-1 space-y-4">
               <div className="flex items-start justify-between">
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight">{market.question}</h1>
               </div>
               
               <div className="flex items-center gap-4 text-sm text-muted-foreground">
                 <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                   <Info className="h-3 w-3" /> Ends {format(new Date(market.endDate), 'MMM d, yyyy')}
                 </span>
                 <span className="font-mono text-xs">Vol: ${(market.volume / 1000000).toFixed(2)}M</span>
                 <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground" onClick={handleShare}>
                   <Share2 className="h-4 w-4" />
                 </Button>
               </div>
             </div>
          </div>

          {/* Main Trading Card */}
          <Card className="border-border/60 shadow-lg overflow-hidden">
             <CardContent className="p-0">
               <div className="flex flex-col md:flex-row h-full">
                 {/* YES Option */}
                 <div className="flex-1 p-6 md:p-8 bg-linear-to-b from-green-500/5 to-transparent hover:from-green-500/10 transition-colors border-b md:border-b-0 md:border-r border-border/40 relative group">
                    <div className="absolute top-4 right-4 text-green-600/20 group-hover:text-green-600/40 font-black text-6xl select-none transition-colors">YES</div>
                    <div className="relative z-10 space-y-6">
                      <div>
                        <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Price</div>
                        <div className="text-5xl font-mono font-bold text-green-700 dark:text-green-300 tracking-tighter">{yesPercent}¢</div>
                      </div>
                      <Button 
                        size="lg" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-14 shadow-lg shadow-green-900/20"
                        onClick={() => { setTradeOutcome("YES"); setTradeOpen(true); }}
                      >
                        Trade YES
                      </Button>
                    </div>
                 </div>

                 {/* NO Option */}
                 <div className="flex-1 p-6 md:p-8 bg-linear-to-b from-red-500/5 to-transparent hover:from-red-500/10 transition-colors relative group">
                    <div className="absolute top-4 right-4 text-red-600/20 group-hover:text-red-600/40 font-black text-6xl select-none transition-colors">NO</div>
                    <div className="relative z-10 space-y-6">
                      <div>
                        <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Price</div>
                        <div className="text-5xl font-mono font-bold text-red-700 dark:text-red-300 tracking-tighter">{noPercent}¢</div>
                      </div>
                      <Button 
                        size="lg" 
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg h-14 shadow-lg shadow-red-900/20"
                        onClick={() => { setTradeOutcome("NO"); setTradeOpen(true); }}
                      >
                        Trade NO
                      </Button>
                    </div>
                 </div>
               </div>
               
               <div className="p-6 bg-muted/20 border-t border-border/40">
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-green-700 dark:text-green-400">{yesPercent}% chance</span>
                    <span className="text-red-700 dark:text-red-400">{noPercent}% chance</span>
                  </div>
                  <Progress value={yesPercent} className="h-3 bg-red-200 dark:bg-red-900/30" indicatorClassName="bg-green-500" />
               </div>
             </CardContent>
          </Card>

          {/* Order Book */}
          <OrderBook marketId={market.id} />

          {/* Advanced Orders */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Price Alert */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  Set Price Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Outcome</Label>
                    <Select value={alertOutcome} onValueChange={setAlertOutcome}>
                      <SelectTrigger className="h-9" data-testid="alert-outcome-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Condition</Label>
                    <Select value={alertCondition} onValueChange={setAlertCondition}>
                      <SelectTrigger className="h-9" data-testid="alert-condition-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABOVE">Goes above</SelectItem>
                        <SelectItem value="BELOW">Falls below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Target Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.99"
                    placeholder="e.g., 0.50"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    className="h-9"
                    data-testid="alert-price-input"
                  />
                </div>
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={handleCreateAlert}
                  disabled={!alertPrice || createPriceAlert.isPending}
                  data-testid="create-alert-button"
                >
                  <Bell className="h-3 w-3 mr-2" />
                  Create Alert
                </Button>
              </CardContent>
            </Card>

            {/* Take-Profit */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Set Take-Profit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(hasYesPosition || hasNoPosition) ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Position</Label>
                        <Select value={tpOutcome} onValueChange={setTpOutcome}>
                          <SelectTrigger className="h-9" data-testid="tp-outcome-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {hasYesPosition && <SelectItem value="YES">YES ({yesPosition?.shares} shares)</SelectItem>}
                            {hasNoPosition && <SelectItem value="NO">NO ({noPosition?.shares} shares)</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Shares to Sell</Label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="Shares"
                          value={tpShares}
                          onChange={(e) => setTpShares(e.target.value)}
                          className="h-9"
                          data-testid="tp-shares-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Target Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="0.99"
                        placeholder="e.g., 0.75"
                        value={tpPrice}
                        onChange={(e) => setTpPrice(e.target.value)}
                        className="h-9"
                        data-testid="tp-price-input"
                      />
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      size="sm"
                      onClick={handleCreateTakeProfit}
                      disabled={!tpPrice || !tpShares || createTakeProfit.isPending}
                      data-testid="create-tp-button"
                    >
                      <Target className="h-3 w-3 mr-2" />
                      Set Take-Profit
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    You need to own shares in this market to set a take-profit order.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Probability History Chart */}
          <Card>
            <CardHeader>
               <CardTitle className="text-base font-medium flex items-center gap-2">
                  Probability History
               </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={market.history}>
                     <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <XAxis dataKey="time" hide />
                     <YAxis domain={[0, 1]} hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Probability']}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        strokeWidth={2}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <TradeDialog 
        market={market} 
        open={tradeOpen} 
        onOpenChange={setTradeOpen} 
        defaultOutcome={tradeOutcome} 
      />
    </Layout>
  );
}
