import { Store, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme-context";

interface SettingsPanelProps {
  hideMerchants: boolean;
  onHideMerchantsChange: (value: boolean) => void;
}

export function SettingsPanel({
  hideMerchants,
  onHideMerchantsChange,
}: SettingsPanelProps) {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure how your transaction data is displayed and processed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4" />
            Data Filtering
          </CardTitle>
          <CardDescription>
            Control which transactions appear in visualizations and tables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="hide-merchants" className="text-sm font-medium">
                Hide Merchant Transactions
              </Label>
              <p className="text-xs text-muted-foreground">
                Filter out transactions to/from known merchants (DoorDash, Uber, etc.)
              </p>
            </div>
            <Switch
              id="hide-merchants"
              checked={hideMerchants}
              onCheckedChange={onHideMerchantsChange}
              data-testid="switch-hide-merchants"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the visual appearance of the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="dark-mode" className="text-sm font-medium">
                Dark Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Switch between light and dark color themes.
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Venmo Flow Visualizer processes your transaction data entirely in your browser.
            No data is sent to any server — your financial information stays private and secure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
