import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/lib/store";
import { 
  LayoutDashboard, 
  PieChart, 
  LogOut, 
  TrendingUp, 
  Menu,
  Settings,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationsDropdown } from "./notifications-dropdown";
import { SettingsDialog } from "./settings-dialog";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const balance = profile ? parseFloat(profile.balance) : 0;
  const email = user?.email || '';

  const navItems = [
    { href: "/", label: "Markets", icon: LayoutDashboard },
    { href: "/portfolio", label: "Portfolio", icon: PieChart },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border/10">
        <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-gradient">POLYTRADE</span>
        </h1>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-auto border-t border-border/10">
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm mb-4">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
            Buying Power
          </div>
          <div className="text-2xl font-mono font-bold text-foreground flex items-center gap-1">
            <span className="text-muted-foreground text-lg">$</span>
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex items-center justify-between px-2 mb-2">
           <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Logged in as</span>
              <span className="text-sm font-medium truncate max-w-[140px]" title={email}>{email}</span>
           </div>
           <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} title="Settings">
                <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border/40 fixed h-full bg-background/50 backdrop-blur-xl z-20">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-20 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
         <h1 className="text-lg font-bold tracking-tighter flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="text-gradient">POLYTRADE</span>
        </h1>
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop notification bell */}
      <div className="hidden md:flex fixed top-4 right-4 z-30">
        <NotificationsDropdown />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen w-full">
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
