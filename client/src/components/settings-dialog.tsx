import { useState, useEffect } from "react";
import { useUserProfile, useUpdateSettings } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { data: profile } = useUserProfile();
  const updateSettings = useUpdateSettings();
  const [maxAllocation, setMaxAllocation] = useState(25);

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setMaxAllocation(profile.maxAllocationPerMarket);
    }
  }, [profile]);

  const handleSave = () => {
    updateSettings.mutate(maxAllocation, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Trading Settings
          </DialogTitle>
          <DialogDescription>
            Configure your trading preferences and risk limits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-allocation">Max Allocation Per Market</Label>
              <span className="text-sm font-mono font-bold text-primary">{maxAllocation}%</span>
            </div>
            <Slider
              id="max-allocation"
              min={5}
              max={100}
              step={5}
              value={[maxAllocation]}
              onValueChange={(value) => setMaxAllocation(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Limits how much of your $10,000 starting balance can be invested in any single market.
              At {maxAllocation}%, max investment per market is ${(maxAllocation / 100 * 10000).toFixed(0)}.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <h4 className="text-sm font-medium mb-2">Current Limits</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Max per market:</span>
                <span className="font-mono">${(maxAllocation / 100 * 10000).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Min diversification:</span>
                <span className="font-mono">{Math.ceil(100 / maxAllocation)} markets</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
