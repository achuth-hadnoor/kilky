import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AdvancedSection() {
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
          <Switch checked={true} />
        </div>

        <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <Label className="text-base">Buffer Size</Label>
            <p className="text-xs text-black/40 dark:text-white/40">Balance between latency and CPU usage.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-indigo-500">128ms</span>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-widest text-black/40">Change</Button>
          </div>
        </div>

        <Separator className="bg-black/5 dark:bg-white/5" />

        <div className="pt-4">
          <Button variant="outline" className="w-full border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/40 rounded-2xl h-12 font-semibold">
            Reset All Settings to Factory
          </Button>
        </div>
      </div>
    </div>
  );
}
