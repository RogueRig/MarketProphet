import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { PolymarketEvent } from "@/lib/polymarket";
import { Link } from "wouter";
import { TrendingUp, Users, Clock } from "lucide-react";
import { format } from "date-fns";

export function MarketCard({ market }: { market: PolymarketEvent }) {
  const yesPrice = Math.round(parseFloat(market.outcomePrices[0]) * 100);
  const noPrice = Math.round(parseFloat(market.outcomePrices[1]) * 100);

  return (
    <Link href={`/market/${market.id}`}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-0">
          <div className="h-1 w-full bg-linear-to-r from-muted to-muted group-hover:from-primary group-hover:to-purple-500 transition-all duration-500" />
        </CardHeader>
        <CardContent className="p-6 flex-1 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
             {market.icon && (
               <img src={market.icon} alt="" className="w-10 h-10 object-contain rounded-full bg-muted/20 p-1" />
             )}
             <div className="flex-1">
               <h3 className="font-medium text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                 {market.question}
               </h3>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
             <div className="relative overflow-hidden rounded-md bg-green-500/10 border border-green-500/20 p-3 hover:bg-green-500/20 transition-colors">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">YES</div>
                <div className="text-2xl font-mono font-bold text-green-700 dark:text-green-300">{yesPrice}%</div>
             </div>
             <div className="relative overflow-hidden rounded-md bg-red-500/10 border border-red-500/20 p-3 hover:bg-red-500/20 transition-colors">
                <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">NO</div>
                <div className="text-2xl font-mono font-bold text-red-700 dark:text-red-300">{noPrice}%</div>
             </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between text-xs text-muted-foreground border-t border-border/30 mt-4 bg-muted/5">
          <div className="flex items-center gap-1 mt-3">
            <Users className="h-3 w-3" />
            <span>${(market.volume / 1000000).toFixed(1)}m Vol</span>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <Clock className="h-3 w-3" />
            <span>Ends {format(new Date(market.endDate), 'MMM d')}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
