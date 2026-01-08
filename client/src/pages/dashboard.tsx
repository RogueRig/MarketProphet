import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { fetchMarkets } from "@/lib/polymarket";
import { MarketCard } from "@/components/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Filter, RefreshCw, X, TrendingUp, Clock, DollarSign, BarChart3, Star } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useWatchlist } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: markets, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets,
    refetchInterval: 5000
  });
  
  const { data: watchlist = [] } = useWatchlist();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("volume-desc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minVolume, setMinVolume] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!markets) return ["all"];
    const cats = new Set(markets.map(m => m.category));
    return ["all", ...Array.from(cats)];
  }, [markets]);

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    
    return markets.filter(m => {
      const matchesSearch = m.question.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || m.category === category;
      
      const yesPrice = parseFloat(m.outcomePrices[0]) * 100;
      const matchesPriceRange = yesPrice >= priceRange[0] && yesPrice <= priceRange[1];
      
      const matchesVolume = m.volume >= minVolume;
      
      if (quickFilter === "trending") {
        if (m.volume < 5000000) return false;
      }
      if (quickFilter === "ending-soon") {
        const daysUntilEnd = (new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilEnd > 30) return false;
      }
      if (quickFilter === "high-volume") {
        if (m.volume < 8000000) return false;
      }
      if (quickFilter === "volatile") {
        const price = parseFloat(m.outcomePrices[0]);
        if (price < 0.35 || price > 0.65) return false;
      }
      if (quickFilter === "favorites") {
        if (!watchlist.some(w => w.marketId === m.id)) return false;
      }
      
      return matchesSearch && matchesCategory && matchesPriceRange && matchesVolume;
    }).sort((a, b) => {
      if (sort === "volume-desc") return b.volume - a.volume;
      if (sort === "volume-asc") return a.volume - b.volume;
      if (sort === "date-asc") return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      if (sort === "date-desc") return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      if (sort === "price-desc") return parseFloat(b.outcomePrices[0]) - parseFloat(a.outcomePrices[0]);
      if (sort === "price-asc") return parseFloat(a.outcomePrices[0]) - parseFloat(b.outcomePrices[0]);
      return 0;
    });
  }, [markets, search, category, sort, priceRange, minVolume, quickFilter, watchlist]);

  const activeFiltersCount = [
    category !== "all",
    priceRange[0] > 0 || priceRange[1] < 100,
    minVolume > 0,
    quickFilter !== null,
    search.length > 0
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch("");
    setCategory("all");
    setPriceRange([0, 100]);
    setMinVolume(0);
    setQuickFilter(null);
    setSort("volume-desc");
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
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
                className="pl-10 pr-10 bg-card border-border/60" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="search-markets-input"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearch("")}
                  data-testid="clear-search-button"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={quickFilter === "trending" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === "trending" ? null : "trending")}
              className="h-8"
              data-testid="filter-trending"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Button>
            <Button
              variant={quickFilter === "ending-soon" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === "ending-soon" ? null : "ending-soon")}
              className="h-8"
              data-testid="filter-ending-soon"
            >
              <Clock className="h-3 w-3 mr-1" />
              Ending Soon
            </Button>
            <Button
              variant={quickFilter === "high-volume" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === "high-volume" ? null : "high-volume")}
              className="h-8"
              data-testid="filter-high-volume"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              High Volume
            </Button>
            <Button
              variant={quickFilter === "volatile" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === "volatile" ? null : "volatile")}
              className="h-8"
              data-testid="filter-volatile"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              50/50 Markets
            </Button>
            <Button
              variant={quickFilter === "favorites" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === "favorites" ? null : "favorites")}
              className="h-8"
              data-testid="filter-favorites"
            >
              <Star className={`h-3 w-3 mr-1 ${quickFilter === "favorites" ? "fill-current" : ""}`} />
              Favorites ({watchlist.length})
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px] h-9" data-testid="category-select">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c === "all" ? "All Categories" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] h-9" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume-desc">Volume (High-Low)</SelectItem>
                <SelectItem value="volume-asc">Volume (Low-High)</SelectItem>
                <SelectItem value="price-desc">YES Price (High-Low)</SelectItem>
                <SelectItem value="price-asc">YES Price (Low-High)</SelectItem>
                <SelectItem value="date-asc">Ending Soonest</SelectItem>
                <SelectItem value="date-desc">Ending Latest</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs"
              data-testid="toggle-advanced-filters"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced
            </Button>

            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground"
                onClick={clearAllFilters}
                data-testid="clear-all-filters"
              >
                Clear All ({activeFiltersCount})
              </Button>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-xs text-muted-foreground"
              onClick={() => refetch()}
              data-testid="force-refresh"
            >
              Force Refresh
            </Button>
          </div>

          <Collapsible open={showAdvanced}>
            <CollapsibleContent className="space-y-4 pt-2 pb-4 px-4 bg-card/50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">YES Price Range: {priceRange[0]}% - {priceRange[1]}%</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={(v) => setPriceRange(v as [number, number])}
                    min={0}
                    max={100}
                    step={5}
                    className="py-2"
                    data-testid="price-range-slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% (Unlikely)</span>
                    <span>50% (Toss-up)</span>
                    <span>100% (Likely)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Minimum Volume: {formatVolume(minVolume)}</Label>
                  <Slider
                    value={[minVolume]}
                    onValueChange={(v) => setMinVolume(v[0])}
                    min={0}
                    max={10000000}
                    step={500000}
                    className="py-2"
                    data-testid="min-volume-slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>$5M</span>
                    <span>$10M+</span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {search && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{search}"
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch("")} />
                </Badge>
              )}
              {category !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Category: {category}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setCategory("all")} />
                </Badge>
              )}
              {quickFilter && (
                <Badge variant="secondary" className="gap-1">
                  {quickFilter.replace("-", " ")}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setQuickFilter(null)} />
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 100) && (
                <Badge variant="secondary" className="gap-1">
                  Price: {priceRange[0]}%-{priceRange[1]}%
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange([0, 100])} />
                </Badge>
              )}
              {minVolume > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Min Volume: {formatVolume(minVolume)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setMinVolume(0)} />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Favorites Section */}
        {!isLoading && watchlist.length > 0 && quickFilter !== "favorites" && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  Your Favorites
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickFilter("favorites")}
                  className="text-xs"
                  data-testid="view-all-favorites"
                >
                  View All ({watchlist.length})
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {markets?.filter(m => watchlist.some(w => w.marketId === m.id)).slice(0, 3).map((market) => (
                  <Link key={market.id} href={`/market/${market.id}`}>
                    <div className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        {market.icon && (
                          <img src={market.icon} alt="" className="w-8 h-8 object-contain rounded-full bg-muted/20 p-1" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{market.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-green-500">
                              YES {Math.round(parseFloat(market.outcomePrices[0]) * 100)}%
                            </span>
                            <span className="text-xs text-muted-foreground">|</span>
                            <span className="text-xs font-mono text-red-500">
                              NO {Math.round(parseFloat(market.outcomePrices[1]) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} found</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => (
              <MarketCard 
                key={market.id} 
                market={market}
                watchlist={watchlist}
              />
            ))}
            {filteredMarkets.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed rounded-lg">
                <p className="mb-4">No markets found matching your filters</p>
                <Button variant="outline" size="sm" onClick={clearAllFilters} data-testid="no-results-clear-filters">
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
