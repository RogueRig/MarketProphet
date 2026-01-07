import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";

import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import MarketPage from "@/pages/market";
import Portfolio from "@/pages/portfolio";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/login" />;
}

function Router() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/market/:id" component={() => <ProtectedRoute component={MarketPage} />} />
      <Route path="/portfolio" component={() => <ProtectedRoute component={Portfolio} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
