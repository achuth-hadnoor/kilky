import { Button } from "@/components/ui/button";
import { Rocket } from 'lucide-react';

interface AboutSectionProps {
  appVersion: string;
  platformName: string;
}

export function AboutSection({ appVersion, platformName }: AboutSectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center py-8 text-center space-y-6">
        <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl flex items-center justify-center text-white">
          <Rocket className="w-12 h-12" />
        </div>
        <div>
          <h3 className="text-3xl font-bold tracking-tight">kliky</h3>
          <p className="text-indigo-500 font-medium">Version {appVersion} Platinum</p>
        </div>

        <div className="max-w-xs text-sm text-black/40 dark:text-white/40">
          Handcrafted with precision for mechanical keyboard enthusiasts worldwide.
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="rounded-xl border-black/10 dark:border-white/10 px-6">Release Notes</Button>
          <Button variant="outline" className="rounded-xl border-black/10 dark:border-white/10 px-6">Check for Updates</Button>
        </div>
      </div>

      <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
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
      </div>
    </div>
  );
}
