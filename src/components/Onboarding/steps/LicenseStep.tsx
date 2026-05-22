import { Key, Loader2 } from "lucide-react";
import { StepContainer } from "../shared/StepContainer";
import { OnboardingCard } from "../shared/OnboardingCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { activateLicense } from "@/lib/license";

export function LicenseStep({ onSuccess }: { onSuccess?: () => void }) {
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
    } catch (err: any) {
      setError(err.message || "Invalid license key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StepContainer>
      <div className="flex flex-col items-center text-center space-y-6 flex-1 justify-center py-2 max-w-sm mx-auto">
        <div className="relative group mt-2">
          <div className="w-16 h-16 dark:bg-neutral-900 bg-white rounded-2xl flex items-center justify-center border border-black/10 dark:border-white/10 shadow-lg">
            <Key className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r dark:from-white from-neutral-700 dark:via-neutral-200 via-neutral-600 dark:to-neutral-700 to-neutral-950 bg-clip-text text-transparent">
            Activate Kliky
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
            Enter your license key to unlock premium features. If you don't have one, you can skip this step.
          </p>
        </div>

        <div className="w-full space-y-3 mt-4">
          <OnboardingCard className="flex flex-col gap-3 border-none  text-left">
            <div className="space-y-1 gap-1 flex flex-col">
              <label className="text-xs font-bold dark:text-white tracking-wide">
                License Key
              </label>
              {error && (
                <p className="text-xs text-red-500 font-semibold">{error}</p>
              )}
              <input
                value={licenseKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full text-center tracking-widest font-mono text-sm uppercase dark:text-white  border border-black/10 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-3 py-2 outline-none"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={isLoading || !licenseKey.trim()}
              className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white border-0 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Verifying..." : "Verify License"}
            </Button>
          </OnboardingCard>
        </div>
      </div>
    </StepContainer>
  );
}
