import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Rocket, Shield, AlertCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface GeneralSectionProps {
  enabled: boolean;
  handleToggle: (checked: boolean) => void;
  isAutostart: boolean;
  handleAutoLaunchChange: (checked: boolean) => void;
  selectedDevice: string;
  handleDeviceChange: (device: string) => void;
  audioDevices: string[];
  hasPermission: boolean;
  platformName: string;
}

export function GeneralSection({
  enabled,
  handleToggle,
  isAutostart,
  handleAutoLaunchChange,
  selectedDevice,
  handleDeviceChange,
  audioDevices,
  hasPermission,
  platformName,
}: GeneralSectionProps) {
  const isMac = platformName === "macos";

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-semibold mb-2">General Settings</h3>
        <p className="text-sm text-black/40 dark:text-white/40">Configure how kliky behaves on your system.</p>
      </div>

      <div className="space-y-6">
        {isMac && (
          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {hasPermission ? (
                  <Shield className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                )}
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400">
                  {hasPermission ? "Accessibility Access Enabled" : "Accessibility Access Required"}
                </span>
              </div>
              <div className="flex flex-col">
                <Label className="text-base">System Permissions</Label>
                <p className="text-xs text-black/40 dark:text-white/40 leading-tight">
                  {hasPermission
                    ? "Permissions are granted and Kliky can detect key presses."
                    : "Kliky needs accessibility access to detect key presses."}
                </p>
              </div>
            </div>
            <Switch
              checked={hasPermission}
              disabled={hasPermission}
              onCheckedChange={(checked) => {
                if (checked && !hasPermission) {
                  invoke("request_permissions");
                }
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <Label className="text-base">Enable Kliky</Label>
            <p className="text-xs text-black/40 dark:text-white/40">Turn all keyboard sounds on or off globally.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </div>

        <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <Label className="text-base">Launch at Startup</Label>
            <p className="text-xs text-black/40 dark:text-white/40">Automatically start kliky when you log in.</p>
          </div>
          <Switch checked={isAutostart} onCheckedChange={handleAutoLaunchChange} />
        </div>

        <div className="flex flex-col gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <Label className="text-base">Audio Output Device</Label>
            <p className="text-xs text-black/40 dark:text-white/40">Choose where the keyboard sounds will play.</p>
          </div>
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full p-2.5 bg-black/10 dark:bg-white/10 rounded-xl border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
          >
            <option value="">Default System Device</option>
            {audioDevices.map((device) => (
              <option key={device} value={device}>{device}</option>
            ))}
          </select>
        </div>

        {import.meta.env.DEV && (
          <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 space-y-4">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Welcome Experience (Dev)</Label>
              <p className="text-xs text-black/40 dark:text-white/40">Re-run the setup guide to configure your sounds and permissions.</p>
            </div>
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl border-dashed hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center gap-2 group"
              onClick={() => invoke('show_onboarding')}
            >
              <Rocket className="w-4 h-4 text-black/40 dark:text-white/40 group-hover:text-indigo-500 transition-colors" />
              <span>Launch Onboarding Flow</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
