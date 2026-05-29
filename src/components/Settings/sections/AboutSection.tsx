import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Key } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { activateLicense } from '../../../lib/license';

interface AboutSectionProps {
  appVersion: string;
  handleCheckUpdates: () => Promise<void>;
}

export function AboutSection({ appVersion, handleCheckUpdates }: AboutSectionProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const onCheck = async () => {
    setIsChecking(true);
    await handleCheckUpdates();
    setIsChecking(false);
  };

  const handleSupport = async () => {
    // Replace this URL with your actual Polar.sh product or storefront URL
    await openUrl('https://buy.polar.sh/polar_cl_O7avncCbfK2g8xhHOIF2cKRo1Gw9YsvmUVmja28WeJ3');
  };

  const handleActivate = async () => {
    setError("");
    setSuccess(false);
    setIsActivating(true);
    try {
      await activateLicense(licenseKey);
      setSuccess(true);
      setLicenseKey("");
      // Force a full reload to apply license
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid license key");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col items-center pt-8 text-center space-y-6">
        <div className="w-28 h-28 rounded-[32px] overflow-hidden shadow-2xl flex items-center justify-center bg-white dark:bg-zinc-900 border-4 border-black/5 dark:border-white/5">
          <img src="/icon.png" alt="Kliky Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-4xl font-bold tracking-tighter">kliky</h3>
          <p className="text-red-500 font-bold text-xs uppercase tracking-widest">Version {appVersion}</p>
        </div>

        <div className="max-w-xs text-sm text-black/40 dark:text-white/40">
          Handcrafted with precision for mechanical keyboard enthusiasts worldwide.
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-black/10 dark:border-white/10 px-6 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50" onClick={() => openUrl('https://github.com/achuthhadnoor/kliky/releases')}>Release Notes</Button>
          <Button
            variant="outline"
            className="rounded-xl border-black/10 dark:border-white/10 px-6 min-w-[160px] cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50"
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

      <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
          <Key className="w-6 h-6" />
        </div>
        <div className="space-y-1 w-full max-w-sm">
          <h4 className="font-semibold text-lg">Activate License</h4>
          <p className="text-sm text-black/60 dark:text-white/60 mb-4">
            Enter your license key to permanently unlock all premium features.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
            {success && <p className="text-xs text-emerald-500 font-semibold">Activated successfully! Reloading...</p>}
            <input
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full text-center tracking-widest font-mono text-sm uppercase dark:text-white border border-black/10 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl px-3 py-3 outline-none bg-white dark:bg-black/20"
              disabled={isActivating || success}
            />
            <Button
              className="w-full rounded-xl bg-neutral-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white transition-all flex items-center justify-center gap-2 mt-1"
              onClick={handleActivate}
              disabled={isActivating || !licenseKey.trim() || success}
            >
              {isActivating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isActivating ? "Verifying..." : "Verify Key"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/10 dark:from-red-500/20 dark:to-red-500/20 rounded-3xl border border-red-500/20 dark:border-red-500/30 flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-lg">Support Kliky</h4>
          <p className="text-sm text-black/60 dark:text-white/60 max-w-[260px]">
            Kliky is fully free and open source. If you love the app, consider supporting its development!
          </p>
        </div>
        <Button
          className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0 px-8 cursor-pointer shadow-lg shadow-red-500/25 transition-all hover:scale-105"
          onClick={handleSupport}
        >
          Pay What You Want
        </Button>
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
            <span className="font-mono text-red-500">Premium Lifetime</span>
          </div>
        </div>
      </div> */}
    </div>
  );
}
