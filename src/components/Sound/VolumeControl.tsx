import { Slider } from "@/components/ui/slider";

interface VolumeControlProps {
  volume: number;
  onVolumeUpdate: (val: number[]) => void;
  showPercentage?: boolean;
  className?: string;
}

export function VolumeControl({
  volume,
  onVolumeUpdate,
  showPercentage = true,
  className = ""
}: VolumeControlProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/80">Volume</span>
        {showPercentage && (
          <span className="text-sm font-mono text-foreground/80">
            {Math.round(volume * 100)}%
          </span>
        )}
      </div>
      <Slider
        value={[volume]}
        max={1}
        step={0.01}
        onValueChange={onVolumeUpdate}
        className="py-2 cursor-pointer [&_[data-slot=slider-range]]:bg-red-500 [&_[data-slot=slider-thumb]]:bg-red-500 dark:[&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-red-500/40 dark:[&_[data-slot=slider-thumb]]:border-transparent transition"
      />
    </div>
  );
}
