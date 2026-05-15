import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface AboutSectionProps {
  appVersion: string;
  handleCheckUpdates: () => Promise<void>;
}

export function AboutSection({ appVersion, handleCheckUpdates }: AboutSectionProps) {
  const [isChecking, setIsChecking] = useState(false);

  const onCheck = async () => {
    setIsChecking(true);
    await handleCheckUpdates();
    setIsChecking(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-center py-8 text-center space-y-6">
        <div className="w-28 h-28 rounded-[32px] overflow-hidden shadow-2xl flex items-center justify-center bg-white dark:bg-zinc-900 border-4 border-black/5 dark:border-white/5">
          <img src="/icon.png" alt="Kliky Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-4xl font-bold tracking-tighter">kliky</h3>
          <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest">Version {appVersion}</p>
        </div>

        <div className="max-w-xs text-sm text-black/40 dark:text-white/40">
          Handcrafted with precision for mechanical keyboard enthusiasts worldwide.
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-black/10 dark:border-white/10 px-6">Release Notes</Button>
          <Button
            variant="outline"
            className="rounded-xl border-black/10 dark:border-white/10 px-6 min-w-[160px]"
            onClick={onCheck}
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Check for Updates"
            )}
          </Button>
        </div>
      </div>

      {/* <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-black/20 dark:text-white/20 mb-4">
          <span>Diagnostics</span>
          <span className="text-green-500">System Healthy</span>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-black/40 dark:text-white/40">Audio Engine</span>
            <span className="font-mono">Rodio 0.17</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/40 dark:text-white/40">Platform</span>
            <span className="font-mono">{platformName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/40 dark:text-white/40">License</span>
            <span className="font-mono text-indigo-500">Premium Lifetime</span>
          </div>
        </div>
      </div> */}
    </div>
  );
}
