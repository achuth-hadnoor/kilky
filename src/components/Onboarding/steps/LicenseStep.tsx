import { Key, Loader2 } from "lucide-react";
import { StepContainer } from "../shared/StepContainer";
import { OnboardingCard } from "../shared/OnboardingCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { activateLicense } from "@/lib/license";

export function LicenseStep({
  onSuccess,
  trialInfo,
  onStartTrial
}: {
  onSuccess?: () => void,
  trialInfo?: { isTrialStarted: boolean; isTrialActive: boolean; daysLeft: number },
  onStartTrial?: () => void
}) {
  const [licenseKey, setLicenseKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");
    setIsLoading(true);
    try {
      await activateLicense(licenseKey);
      console.log("License successfully activated!");
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid license key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StepContainer>
      <div className="flex flex-col items-center text-center space-y-6 flex-1 justify-center py-2 max-w-sm mx-auto">
        <div className="relative group mt-2">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative w-16 h-16 dark:bg-zinc-900 bg-white rounded-2xl flex items-center justify-center border border-red-500/20 shadow-xl">
            <Key className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r dark:from-white from-neutral-700 dark:via-neutral-200 via-neutral-600 dark:to-neutral-700 to-neutral-950 bg-clip-text text-transparent">
            Activate Kliky
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
            {trialInfo?.isTrialStarted
              ? trialInfo?.isTrialActive
                ? `You have ${trialInfo.daysLeft} days left in your free trial. Enter a license key to unlock permanently.`
                : "Your 7-day free trial has expired. Please enter a license key to continue using Kliky."
              : "Enter your license key to unlock premium features, or start a 7-day free trial!"}
          </p>
        </div>

        <div className="w-full space-y-3 mt-4">
          <OnboardingCard className="flex flex-col gap-4 border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-xl text-left p-6">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold dark:text-white tracking-wide uppercase text-black/60 dark:text-white/60">
                License Key
              </label>
              {error && (
                <p className="text-xs text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded-md">{error}</p>
              )}
              <input
                value={licenseKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full text-center tracking-widest font-mono text-sm uppercase dark:text-white border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl px-4 py-3 outline-none transition-all"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex flex-col gap-2 pt-1">
              <Button
                onClick={handleVerify}
                disabled={isLoading || !licenseKey.trim()}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold tracking-wide border-0 shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "Verifying..." : "Verify License"}
              </Button>

              {trialInfo && !trialInfo.isTrialStarted && onStartTrial && (
                <Button
                  variant="outline"
                  onClick={onStartTrial}
                  className="w-full h-11 rounded-xl bg-white dark:bg-zinc-900 border border-red-500/20 hover:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/5 transition-all flex items-center justify-center font-bold tracking-wide active:scale-[0.98]"
                >
                  Start 7-Day Free Trial
                </Button>
              )}
            </div>
          </OnboardingCard>
        </div>
      </div>
    </StepContainer>
  );
}
