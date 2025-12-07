import { useState, useEffect } from "react";
import { Store, Moon, Sun, Save, RotateCcw, Trash2, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme-context";
import { format } from "date-fns";

interface SettingsPanelProps {
  hideMerchants: boolean;
  onHideMerchantsChange: (value: boolean) => void;
  onSaveSession?: () => boolean;
  onLoadSession?: () => boolean;
  onClearSession?: () => void;
  sessionInfo?: { savedAt: Date; transactionCount: number } | null;
  hasUnsavedChanges?: boolean;
}

export function SettingsPanel({
  hideMerchants,
  onHideMerchantsChange,
  onSaveSession,
  onLoadSession,
  onClearSession,
  sessionInfo,
  hasUnsavedChanges,
}: SettingsPanelProps) {
  const { darkMode, setDarkMode } = useTheme();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = () => {
    if (onSaveSession?.()) {
      setSaveMessage("Session saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage("Failed to save session");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleLoad = () => {
    if (onLoadSession?.()) {
      setSaveMessage("Session restored!");
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage("No saved session found");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleClear = () => {
    onClearSession?.();
    setSaveMessage("Saved session cleared");
    setTimeout(() => setSaveMessage(null), 3000);
  };

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
            <Save className="h-4 w-4" />
            Session Management
          </CardTitle>
          <CardDescription>
            Save your current session to restore later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              <span>
                Last saved: {format(sessionInfo.savedAt, "MMM d, yyyy h:mm a")}
              </span>
              <Badge variant="secondary" className="text-xs">
                {sessionInfo.transactionCount} transactions
              </Badge>
            </div>
          )}

          {hasUnsavedChanges && (
            <Badge variant="outline" className="mb-4">
              You have unsaved changes
            </Badge>
          )}

          {saveMessage && (
            <div className="py-2 px-3 bg-muted rounded-md text-sm mb-4">
              {saveMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSave}
              data-testid="button-save-session"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Session
            </Button>
            <Button
              variant="outline"
              onClick={handleLoad}
              disabled={!sessionInfo}
              data-testid="button-load-session"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Session
            </Button>
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={!sessionInfo}
              data-testid="button-clear-session"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Saved
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Sessions are stored locally in your browser. They include all uploaded transactions,
            aliases, filters, and settings.
          </p>
        </CardContent>
      </Card>

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
            Transaction Flow Visualizer processes your data entirely in your browser.
            No data is sent to any server — your financial information stays private and secure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
