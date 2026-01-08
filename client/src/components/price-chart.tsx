import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format, subDays, subHours } from "date-fns";

interface PriceChartProps {
  marketId: string;
  currentYesPrice: number;
  timeRange?: '1D' | '1W' | '1M' | '3M';
}

function generateHistoricalData(currentPrice: number, timeRange: string) {
  const data = [];
  let points: number;
  let getDate: (i: number) => Date;
  
  switch (timeRange) {
    case '1D':
      points = 24;
      getDate = (i) => subHours(new Date(), points - i);
      break;
    case '1W':
      points = 7 * 24;
      getDate = (i) => subHours(new Date(), points - i);
      break;
    case '1M':
      points = 30;
      getDate = (i) => subDays(new Date(), points - i);
      break;
    case '3M':
      points = 90;
      getDate = (i) => subDays(new Date(), points - i);
      break;
    default:
      points = 30;
      getDate = (i) => subDays(new Date(), points - i);
  }

  const seed = currentPrice * 1000;
  let price = currentPrice * 0.85 + (seed % 10) * 0.01;
  
  for (let i = 0; i < points; i++) {
    const volatility = 0.02 + Math.sin(i * 0.3) * 0.01;
    const trend = (currentPrice - price) / (points - i) * 0.3;
    const noise = (Math.sin(seed + i * 2.7) * 0.5 + Math.cos(seed * 0.3 + i * 1.3) * 0.5) * volatility;
    
    price = Math.max(0.01, Math.min(0.99, price + trend + noise));
    
    const date = getDate(i);
    data.push({
      date: date.getTime(),
      price: price,
      displayDate: timeRange === '1D' || timeRange === '1W' 
        ? format(date, 'MMM d HH:mm')
        : format(date, 'MMM d'),
    });
  }
  
  data.push({
    date: new Date().getTime(),
    price: currentPrice,
    displayDate: format(new Date(), timeRange === '1D' || timeRange === '1W' ? 'MMM d HH:mm' : 'MMM d'),
  });
  
  return data;
}

export function PriceChart({ marketId, currentYesPrice, timeRange = '1M' }: PriceChartProps) {
  const data = useMemo(() => {
    return generateHistoricalData(currentYesPrice, timeRange);
  }, [currentYesPrice, timeRange, marketId]);

  const minPrice = Math.min(...data.map(d => d.price)) * 0.95;
  const maxPrice = Math.max(...data.map(d => d.price)) * 1.05;
  
  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Price History</CardTitle>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{(priceChange * 100).toFixed(1)}¢ ({priceChangePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradient-${marketId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value * 100)}¢`}
                width={40}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                        <p className="text-xs text-muted-foreground">{data.displayDate}</p>
                        <p className="text-sm font-mono font-bold">{Math.round(data.price * 100)}¢</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fill={`url(#gradient-${marketId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
