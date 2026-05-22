import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AdvancedSectionProps {
  isLoading?: boolean;
  bufferSize: number;
  handleBufferSizeChange: (size: number) => void;
  hardwareAcceleration: boolean;
  handleHardwareAccelerationToggle: (enabled: boolean) => void;
  speedVolumeScaling: boolean;
  handleSpeedScalingChange: (enabled: boolean) => void;
  handleResetSettings: () => void;
}

export function AdvancedSectionSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-black/10 dark:bg-white/10 rounded-lg mb-2" />
        <div className="h-4 w-72 bg-black/5 dark:bg-white/5 rounded-lg" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5" />
        ))}
      </div>
    </div>
  );
}

export function AdvancedSection({
  isLoading,
  bufferSize,
  handleBufferSizeChange,
  hardwareAcceleration,
  handleHardwareAccelerationToggle,
  // Speed Scaling hidden for v2
  // speedVolumeScaling,
  // handleSpeedScalingChange,
  handleResetSettings,
}: AdvancedSectionProps) {
  const [isChanging, setIsChanging] = useState(false);
  const bufferOptions = [64, 128, 256, 512];

  if (isLoading) {
    return <AdvancedSectionSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-semibold mb-2">Advanced Engine</h3>
        <p className="text-sm text-black/40 dark:text-white/40">Technical settings for low-level audio processing.</p>
      </div>

      <div className="space-y-4">
        {/* Speed-based Volume hidden for future release
        <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <Label className="text-base">Speed-based Volume</Label>
            <p className="text-xs text-black/40 dark:text-white/40">Dynamically increase volume as you type faster.</p>
          </div>
          <Switch
            checked={speedVolumeScaling}
            onCheckedChange={handleSpeedScalingChange}
          />
        </div>
        */}

        <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <Label className="text-base">Hardware Acceleration</Label>
            <p className="text-xs text-black/40 dark:text-white/40">Use GPU to offload audio rendering tasks.</p>
          </div>
          <Switch
            checked={hardwareAcceleration}
            onCheckedChange={handleHardwareAccelerationToggle}
            className="focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 duration-300">
          <div className="space-y-1">
            <Label className="text-base">Buffer Size</Label>
            <p className="text-xs text-black/40 dark:text-white/40">Balance between latency and CPU usage.</p>
          </div>
          <div className="flex items-center gap-3">
            {isChanging ? (
              <div className="flex gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                {bufferOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      handleBufferSizeChange(opt);
                      setIsChanging(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 ${bufferSize === opt
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                      : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                  >
                    {opt}ms
                  </button>
                ))}
              </div>
            ) : (
              <>
                <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">{bufferSize}ms</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold tracking-widest text-black/40 hover:text-red-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80"
                  onClick={() => setIsChanging(true)}
                >
                  Change
                </Button>
              </>
            )}
          </div>
        </div>

        <Separator className="bg-black/5 dark:bg-white/5" />

        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/40 rounded-2xl h-12 font-semibold cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50"
            onClick={handleResetSettings}
          >
            Reset All Settings to Factory
          </Button>
        </div>
      </div>
    </div>
  );
}
