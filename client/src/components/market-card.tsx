import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { PolymarketEvent } from "@/lib/polymarket";
import { Link } from "wouter";
import { Users, Clock, Star } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/lib/store";
import { useState } from "react";

interface WatchlistItem {
  id: string;
  marketId: string;
  marketTitle: string;
}

interface MarketCardProps {
  market: PolymarketEvent;
  showFavoriteButton?: boolean;
  watchlist?: WatchlistItem[];
  onAddToWatchlist?: (marketId: string, marketTitle: string) => void;
  onRemoveFromWatchlist?: (marketId: string) => void;
}

export function MarketCard({ 
  market, 
  showFavoriteButton = true,
  watchlist: externalWatchlist,
  onAddToWatchlist: externalAdd,
  onRemoveFromWatchlist: externalRemove,
}: MarketCardProps) {
  const yesPrice = Math.round(parseFloat(market.outcomePrices[0]) * 100);
  const noPrice = Math.round(parseFloat(market.outcomePrices[1]) * 100);
  
  const useInternalHooks = externalWatchlist === undefined;
  
  const { data: internalWatchlist = [] } = useWatchlist();
  const internalAdd = useAddToWatchlist();
  const internalRemove = useRemoveFromWatchlist();
  
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  
  const watchlist = useInternalHooks ? internalWatchlist : externalWatchlist;
  const isInWatchlist = watchlist.some(w => w.marketId === market.id);
  
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLocalLoading(true);
    
    try {
      if (isInWatchlist) {
        if (externalRemove) {
          externalRemove(market.id);
        } else {
          await internalRemove.mutateAsync(market.id);
        }
      } else {
        if (externalAdd) {
          externalAdd(market.id, market.question);
        } else {
          await internalAdd.mutateAsync({ marketId: market.id, marketTitle: market.question });
        }
      }
    } finally {
      setIsLocalLoading(false);
    }
  };

  return (
    <Link href={`/market/${market.id}`}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm relative">
        {showFavoriteButton && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute top-2 right-2 h-8 w-8 p-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
              isInWatchlist && "opacity-100"
            )}
            onClick={handleFavoriteClick}
            disabled={isLocalLoading}
            data-testid={`favorite-button-${market.id}`}
          >
            <Star 
              className={cn(
                "h-4 w-4 transition-colors",
                isInWatchlist ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
              )} 
            />
          </Button>
        )}
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
