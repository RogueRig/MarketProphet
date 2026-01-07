import { Layout } from "@/components/layout";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchMarket } from "@/lib/polymarket";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TradeDialog } from "@/components/trade-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Share2, Info, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function MarketPage() {
  const [, params] = useRoute("/market/:id");
  const { data: market, isLoading } = useQuery({
    queryKey: ['market', params?.id],
    queryFn: () => fetchMarket(params?.id || ""),
    enabled: !!params?.id
  });

  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeOutcome, setTradeOutcome] = useState<"YES" | "NO">("YES");
  const { toast } = useToast();

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
               <h1 className="text-3xl md:text-4xl font-bold leading-tight">{market.question}</h1>
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
                        Buy YES
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
                        Buy NO
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

          {/* Chart Placeholder */}
          <Card>
            <CardContent className="p-6 h-[300px] flex items-center justify-center text-muted-foreground bg-muted/5">
               <div className="text-center">
                 <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                 <p>Price History Chart (Mock)</p>
               </div>
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
