import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, RotateCcw, X, Cpu, Zap, Activity } from "lucide-react";

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
  speedVolumeScaling,
  handleSpeedScalingChange,
  handleResetSettings,
}: AdvancedSectionProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const bufferOptions = [64, 128, 256, 512];

  // Auto-reset the confirmation state after 5 seconds of inactivity
  useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 5000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  if (isLoading) {
    return <AdvancedSectionSkeleton />;
  }

  // Determine description tag for buffer sizes
  const getBufferBadge = (size: number) => {
    switch (size) {
      case 64:
        return { label: "Ultra Low (Pro Audio)", color: "text-emerald-500 bg-emerald-500/10" };
      case 128:
        return { label: "Low Latency (Recommended)", color: "text-red-500 bg-red-500/10" };
      case 256:
        return { label: "Balanced Latency", color: "text-amber-500 bg-amber-500/10" };
      case 512:
        return { label: "Conservative (Low CPU)", color: "text-zinc-500 bg-zinc-500/10" };
      default:
        return { label: "Custom", color: "text-zinc-500 bg-zinc-500/10" };
    }
  };

  const bufferBadge = getBufferBadge(bufferSize);

  return (
    <div className="space-y-8 select-none">
      <div>
        <h3 className="text-2xl font-semibold mb-2">Advanced Engine</h3>
        <p className="text-sm text-muted-foreground">Technical settings for low-level audio processing.</p>
      </div>

      <div className="space-y-4">
        {/* Speed-based volume scaling */}
        <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-foreground">
              <Activity className="w-4 h-4 text-red-500" />
              <Label className="text-base cursor-pointer">Speed-based Volume</Label>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Dynamically increase volume as you type faster.</p>
          </div>
          <Switch
            checked={speedVolumeScaling}
            onCheckedChange={handleSpeedScalingChange}
            className="focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50"
          />
        </div>

        {/* Hardware acceleration */}
        <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-foreground">
              <Cpu className="w-4 h-4 text-red-500" />
              <Label className="text-base cursor-pointer">Hardware Acceleration</Label>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Use GPU to offload audio rendering tasks.</p>
          </div>
          <Switch
            checked={hardwareAcceleration}
            onCheckedChange={handleHardwareAccelerationToggle}
            className="focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50"
          />
        </div>

        {/* Buffer Size & Latency Description */}
        <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/50 transition-all duration-300">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground">
              <Zap className="w-4 h-4 text-red-500" />
              <Label className="text-base cursor-pointer">Audio Buffer Size</Label>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground leading-relaxed">Balance between latency and CPU usage.</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${bufferBadge.color}`}>
                {bufferBadge.label}
              </span>
            </div>
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
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 ${
                      bufferSize === opt
                        ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                        : "bg-secondary hover:bg-secondary/80 text-foreground"
                    }`}
                  >
                    {opt}ms
                  </button>
                ))}
              </div>
            ) : (
              <>
                <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg">
                  {bufferSize}ms
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-red-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80"
                  onClick={() => setIsChanging(true)}
                >
                  Change
                </Button>
              </>
            )}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* FACTORY RESET CONTAINER WITH CONFIRMATION STATE */}
        <div className="pt-4">
          {confirmReset ? (
            <div className="flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-200">
              <Button
                variant="destructive"
                className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 border border-red-600 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/15"
                onClick={() => {
                  handleResetSettings();
                  setConfirmReset(false);
                }}
              >
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>Yes, Reset Everything!</span>
              </Button>
              <Button
                variant="outline"
                className="w-12 h-12 rounded-2xl border-border hover:bg-secondary text-foreground flex items-center justify-center cursor-pointer"
                onClick={() => setConfirmReset(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/40 rounded-2xl h-12 font-semibold flex items-center justify-center gap-2 cursor-pointer transition focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Settings to Factory</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
