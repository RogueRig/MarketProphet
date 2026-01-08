import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  usePnLHistory, 
  useAnalyticsStats, 
  useTopTrades, 
  useExposure 
} from "@/lib/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, PieChartIcon } from "lucide-react";

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function StatCard({ title, value, icon: Icon, trend, trendValue }: {
  title: string;
  value: string | number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trendValue && (
              <p className={`text-sm mt-1 ${
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 
                'text-muted-foreground'
              }`}>
                {trendValue}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${
            trend === 'up' ? 'bg-green-100 text-green-600' :
            trend === 'down' ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: pnlHistory, isLoading: pnlLoading } = usePnLHistory();
  const { data: stats, isLoading: statsLoading } = useAnalyticsStats();
  const { data: topTrades, isLoading: topTradesLoading } = useTopTrades();
  const { data: exposure, isLoading: exposureLoading } = useExposure();

  const isLoading = pnlLoading || statsLoading || topTradesLoading || exposureLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const winLossData = stats ? [
    { name: 'Wins', value: stats.winningTrades, color: '#10B981' },
    { name: 'Losses', value: stats.losingTrades, color: '#EF4444' },
  ].filter(d => d.value > 0) : [];

  const exposurePieData = exposure ? [
    ...exposure.exposure.map((e, i) => ({
      name: e.marketId.slice(0, 20) + (e.marketId.length > 20 ? '...' : ''),
      value: e.percentage,
      fill: COLORS[i % COLORS.length]
    })),
    { name: 'Cash', value: exposure.cashPercentage, fill: '#6B7280' }
  ].filter(d => d.value > 0) : [];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" data-testid="analytics-title">Performance Analytics</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Portfolio Value"
            value={stats ? formatCurrency(stats.totalValue) : '$0'}
            icon={DollarSign}
            trend={stats && stats.totalPnL >= 0 ? 'up' : 'down'}
            trendValue={stats ? `${stats.totalPnL >= 0 ? '+' : ''}${formatCurrency(stats.totalPnL)} total P&L` : undefined}
          />
          <StatCard
            title="Realized P&L"
            value={stats ? formatCurrency(stats.realizedPnL) : '$0'}
            icon={stats && stats.realizedPnL >= 0 ? TrendingUp : TrendingDown}
            trend={stats && stats.realizedPnL >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Win Rate"
            value={stats ? `${stats.winRate}%` : '0%'}
            icon={Target}
            trend={stats && stats.winRate >= 50 ? 'up' : stats && stats.winRate > 0 ? 'down' : 'neutral'}
            trendValue={stats ? `${stats.winningTrades} wins / ${stats.losingTrades} losses` : undefined}
          />
          <StatCard
            title="Total Trades"
            value={stats?.totalTrades || 0}
            icon={BarChart3}
            trend="neutral"
            trendValue={stats ? `${stats.buyTrades} buys / ${stats.sellTrades} sells` : undefined}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                P&L Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pnlHistory && pnlHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pnlHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'P&L']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pnl" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>No trading history yet. Make some trades to see your P&L chart!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Portfolio Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exposurePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={exposurePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {exposurePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>No positions yet. Start trading to see your allocation!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Top Winning Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topTrades?.topWins && topTrades.topWins.length > 0 ? (
                <div className="space-y-3">
                  {topTrades.topWins.map((trade, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg" data-testid={`top-win-${i}`}>
                      <div>
                        <p className="font-medium text-sm">{trade.marketTitle}</p>
                        <p className="text-xs text-muted-foreground">{trade.outcome} - {trade.date}</p>
                      </div>
                      <p className="font-bold text-green-600">+{formatCurrency(trade.pnl)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                  <p>No completed trades yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="h-5 w-5" />
                Top Losing Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topTrades?.topLosses && topTrades.topLosses.length > 0 ? (
                <div className="space-y-3">
                  {topTrades.topLosses.map((trade, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg" data-testid={`top-loss-${i}`}>
                      <div>
                        <p className="font-medium text-sm">{trade.marketTitle}</p>
                        <p className="text-xs text-muted-foreground">{trade.outcome} - {trade.date}</p>
                      </div>
                      <p className="font-bold text-red-600">{formatCurrency(trade.pnl)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                  <p>No losing trades yet - keep it up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {exposure && exposure.exposure.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Market Exposure Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exposure.exposure} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                  <YAxis 
                    dataKey="marketId" 
                    type="category" 
                    width={150}
                    tickFormatter={(v) => v.length > 20 ? v.slice(0, 20) + '...' : v}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value}% (${formatCurrency(exposure.exposure.find(e => e.percentage === value)?.value || 0)})`, 'Exposure']}
                  />
                  <Bar dataKey="percentage" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
