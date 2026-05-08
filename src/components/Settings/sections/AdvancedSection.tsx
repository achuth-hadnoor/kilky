import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AdvancedSectionProps {
  bufferSize: number;
  handleBufferSizeChange: (size: number) => void;
  hardwareAcceleration: boolean;
  handleHardwareAccelerationToggle: (enabled: boolean) => void;
  handleResetSettings: () => void;
}

export function AdvancedSection({
  bufferSize,
  handleBufferSizeChange,
  hardwareAcceleration,
  handleHardwareAccelerationToggle,
  handleResetSettings,
}: AdvancedSectionProps) {
  const [isChanging, setIsChanging] = useState(false);
  const bufferOptions = [64, 128, 256, 512];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-semibold mb-2">Advanced Engine</h3>
        <p className="text-sm text-black/40 dark:text-white/40">Technical settings for low-level audio processing.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <Label className="text-base">Hardware Acceleration</Label>
            <p className="text-xs text-black/40 dark:text-white/40">Use GPU to offload audio rendering tasks.</p>
          </div>
          <Switch
            checked={hardwareAcceleration}
            onCheckedChange={handleHardwareAccelerationToggle}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 transition-all duration-300">
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
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${bufferSize === opt
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                  >
                    {opt}ms
                  </button>
                ))}
              </div>
            ) : (
              <>
                <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg">{bufferSize}ms</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold tracking-widest text-black/40 hover:text-indigo-500"
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
            className="w-full border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/40 rounded-2xl h-12 font-semibold"
            onClick={handleResetSettings}
          >
            Reset All Settings to Factory
          </Button>
        </div>
      </div>
    </div>
  );
}
