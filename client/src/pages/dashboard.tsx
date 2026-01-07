import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { fetchMarkets } from "@/lib/polymarket";
import { MarketCard } from "@/components/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { data: markets, isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets
  });

  const [search, setSearch] = useState("");

  const filteredMarkets = markets?.filter(m => 
    m.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Live Markets</h2>
            <p className="text-muted-foreground">Trade on the outcome of real-world events.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search markets..." 
              className="pl-10 bg-card border-border/60" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets?.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
            {filteredMarkets?.length === 0 && (
               <div className="col-span-full text-center py-20 text-muted-foreground">
                 No markets found matching "{search}"
               </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
