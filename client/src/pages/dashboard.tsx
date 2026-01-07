import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { fetchMarkets } from "@/lib/polymarket";
import { MarketCard } from "@/components/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Filter, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { data: markets, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets,
    refetchInterval: 5000 // Auto-refresh every 5s for live ticker effect
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("volume-desc");

  // Mock categories based on data
  const categories = ["all", "Crypto", "Economics", "Science", "Tech", "Gaming"];

  const filteredMarkets = markets?.filter(m => {
    const matchesSearch = m.question.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || m.category === category;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sort === "volume-desc") return b.volume - a.volume;
    if (sort === "volume-asc") return a.volume - b.volume;
    if (sort === "date-asc") return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    if (sort === "date-desc") return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
    return 0;
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
                Live Markets
                {isRefetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
              </h2>
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

          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume-desc">Volume (High-Low)</SelectItem>
                <SelectItem value="volume-asc">Volume (Low-High)</SelectItem>
                <SelectItem value="date-asc">Ending Soonest</SelectItem>
                <SelectItem value="date-desc">Ending Latest</SelectItem>
              </SelectContent>
            </Select>

            <Button 
               variant="ghost" 
               size="sm" 
               className="ml-auto text-xs text-muted-foreground"
               onClick={() => refetch()}
            >
               Force Refresh
            </Button>
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
               <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed rounded-lg">
                 No markets found matching filters
               </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
