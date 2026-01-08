import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, LogIn } from "lucide-react";

export default function AuthPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />

      <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-xl bg-card/80">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2 ring-1 ring-primary/20">
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold tracking-tight text-gradient">POLYTRADE</CardTitle>
            <CardDescription className="text-base">
              Paper trading prediction markets with live data
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Practice trading on prediction markets with $10,000 virtual balance
            </p>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <p>✓ Live market data</p>
              <p>✓ Limit & stop-loss orders</p>
              <p>✓ Portfolio tracking & P/L</p>
              <p>✓ No real money - 100% risk-free</p>
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 gap-2"
            size="lg"
          >
            <LogIn className="h-5 w-5" />
            Sign In with Replit
          </Button>

          <p className="text-xs text-center text-muted-foreground opacity-50">
            Powered by Polymarket Data • No Real Money Involved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
