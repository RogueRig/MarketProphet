import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, Trash2 } from "lucide-react";
import { format } from "date-fns";

export function NotificationsDropdown() {
  const { notifications, markNotificationRead, clearNotifications } = useStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-muted-foreground"
              onClick={() => clearNotifications()}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                onClick={() => markNotificationRead(notification.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-2 h-2 rounded-full ${notification.type === 'LIMIT_FILL' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <span className="font-medium text-sm flex-1">
                    {notification.type === 'LIMIT_FILL' ? 'Limit Order Filled' : 'Stop-Loss Triggered'}
                  </span>
                  {!notification.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="text-xs text-muted-foreground pl-4">
                  {notification.orderType} {notification.shares} {notification.outcome} @ ${notification.price.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground pl-4 truncate max-w-full">
                  {notification.marketTitle}
                </div>
                <div className="text-xs text-muted-foreground/60 pl-4">
                  {format(notification.timestamp, 'MMM d, HH:mm')}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
