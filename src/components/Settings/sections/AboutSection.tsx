import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Key, Cpu } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { activateLicense } from "../../../lib/license";

interface AboutSectionProps {
  appVersion: string;
  platformName: string;
  isActivated: boolean;
  isSetappBuild: boolean;
  handleCheckUpdates: () => Promise<void>;
}

export function AboutSection({ appVersion, platformName, isActivated, isSetappBuild, handleCheckUpdates }: AboutSectionProps) {
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
    await openUrl("https://kliky.achuth.dev");
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
    <div className="space-y-6 pb-8 select-none">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center pt-6 text-center space-y-5">
        <div className="w-24 h-24 rounded-[28px] overflow-hidden shadow-xl flex items-center justify-center bg-card border border-border/80 transition duration-300 hover:rotate-3">
          <img src="/icon.png" alt="Kliky Logo" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-extrabold tracking-tighter text-foreground">kliky</h3>
          <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
            v{appVersion}
          </span>
        </div>

        <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
          Handcrafted with precision for mechanical keyboard enthusiasts worldwide.
        </p>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl px-5 h-10 border-border text-foreground hover:bg-secondary cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500" 
            onClick={() => openUrl("https://kliky.achuth.dev")}
          >
            Website
          </Button>
          {/* Setapp manages its own updates — hide the updater button in Setapp builds */}
          {!isSetappBuild && (
            <Button
              variant="outline"
              className="rounded-xl px-5 h-10 min-w-[150px] border-border text-foreground hover:bg-secondary cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500"
              onClick={onCheck}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-red-500" />
                  Checking...
                </>
              ) : (
                "Check Updates"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* License / Setapp Section */}
      {isSetappBuild ? (
        // Setapp build: replace the license key UI with a Setapp subscription badge
        <div className="p-6 bg-card border border-border/60 rounded-2xl flex flex-col items-center text-center space-y-4 transition duration-200 hover:scale-[1.005] hover:shadow-xs">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
            <Key className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-base text-foreground">Setapp Subscription</h4>
            <p className="text-xs text-muted-foreground">
              Your access to Kliky is managed by your Setapp subscription.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active via Setapp
          </div>
        </div>
      ) : (
      <div className="p-6 bg-card border border-border/60 rounded-2xl flex flex-col items-center text-center space-y-4 transition duration-200 hover:scale-[1.005] hover:shadow-xs">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          isActivated 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
            : "bg-red-500/10 border-red-500/20 text-red-500"
        }`}>
          <Key className="w-5 h-5" />
        </div>
        <div className="space-y-1 w-full max-w-sm">
          <h4 className="font-bold text-base text-foreground">
            {isActivated ? "License Active" : "Activate License"}
          </h4>
          <p className="text-xs text-muted-foreground">
            {isActivated 
              ? "Your Kliky premium lifetime license is active. Thank you for your support!" 
              : "Enter your license key to permanently unlock all premium features."}
          </p>
          
          {!isActivated && (
            <div className="flex flex-col gap-2 mt-4 text-left">
              {error && (
                <div className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs px-3.5 py-2.5 rounded-xl text-center font-bold animate-pulse">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs px-3.5 py-2.5 rounded-xl text-center font-bold">
                  Activated successfully! Reloading...
                </div>
              )}
              
              <input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full text-center tracking-widest font-mono text-xs uppercase text-foreground border border-border focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10 rounded-xl px-3 py-3 outline-none bg-muted/30 transition-all placeholder:text-muted-foreground/40 placeholder:tracking-normal"
                disabled={isActivating || success}
              />
              <Button
                className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all flex items-center justify-center gap-2 mt-1 shadow-sm h-10 border-0 cursor-pointer disabled:bg-red-500/50"
                onClick={handleActivate}
                disabled={isActivating || !licenseKey.trim() || success}
              >
                {isActivating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isActivating ? "Verifying License..." : "Activate Product"}
              </Button>
            </div>
          )}
          
          {isActivated && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Premium Lifetime Enabled
            </div>
          )}
        </div>
      </div>
      )}
      {/* Support Card */}
      <div className="p-6 bg-red-500/5 dark:bg-red-500/10 rounded-2xl border border-red-500/15 dark:border-red-500/20 flex flex-col items-center text-center space-y-4 transition duration-200 hover:scale-[1.005]">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-red-500">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-base text-foreground">Support Kliky</h4>
          <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
            If you love the premium typing experience and want to support our active development, feel free to contribute!
          </p>
        </div>
        <Button
          className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0 px-8 cursor-pointer shadow-md shadow-red-500/20 transition hover:scale-105 h-10"
          onClick={handleSupport}
        >
          Pay What You Want
        </Button>
      </div>

      {/* Diagnostics / Restoration Panel */}
      <div className="p-6 bg-card border border-border/60 rounded-2xl transition duration-200 hover:scale-[1.005] hover:shadow-xs">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-4">
          <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> Diagnostics</span>
          <span className="text-emerald-500 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> System Active
          </span>
        </div>
        <div className="space-y-3.5 text-xs text-muted-foreground">
          <div className="flex justify-between items-center border-b border-border/40 pb-2 last:border-0 last:pb-0">
            <span>Platform</span>
            <span className="font-mono font-semibold text-foreground bg-muted/80 px-2 py-0.5 rounded capitalize">{platformName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border/40 pb-2 last:border-0 last:pb-0">
            <span>License Status</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${
              isActivated 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}>
              {isActivated ? "Premium Lifetime" : "Free Trial Mode"}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
