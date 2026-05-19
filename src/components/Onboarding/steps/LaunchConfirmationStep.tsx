import { CheckCircle2, Volume2, KeyRound, Play, AppWindow } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StepContainer } from "../shared/StepContainer";
import { OnboardingCard } from "../shared/OnboardingCard";

interface LaunchConfirmationStepProps {
  activePack: string;
  volume: number;
  hyperKeyEnabled: boolean;
  autostartEnabled: boolean;
  onAutostartToggle: (checked: boolean) => void;
  toggleEngineShortcut: string | null;
  finish: () => void;
}

export function LaunchConfirmationStep({
  activePack,
  volume,
  hyperKeyEnabled,
  autostartEnabled,
  onAutostartToggle,
  toggleEngineShortcut,
  finish,
}: LaunchConfirmationStepProps) {
  const volumePercentage = Math.round(volume * 100);

  return (
    <StepContainer>
      <div className="flex flex-col items-center text-center space-y-3 flex-1 justify-center py-2 max-w-md mx-auto">
        {/* Animated Check Emblem */}
        <div className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-75 animate-pulse"></div>
          <div className="relative w-20 h-20 dark:bg-neutral-950 bg-white rounded-full flex items-center justify-center border dark:border-emerald-500/30 border-emerald-500/40 shadow-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r dark:from-white from-neutral-700 dark:via-neutral-200 via-neutral-600 dark:to-neutral-700 to-neutral-950 bg-clip-text text-transparent">
            You're All Set!
          </h1>
          <p className="text-xs dark:text-neutral-400 text-neutral-500 max-w-xs mx-auto leading-relaxed">
            Kliky is fully configured and ready to elevate your desktop experience.
          </p>
        </div>

        {/* Configuration Summary Card */}
        <div className="w-full space-y-3 ">
          <div className="text-left px-1">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-neutral-500">Your Setup Details</span>
          </div>

          <OnboardingCard className="p-4 dark:bg-neutral-900/40 bg-neutral-400/20 border-neutral-800/80 rounded-2xl space-y-3.5 text-left">
            {/* Sound Pack */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 dark:text-neutral-400 text-neutral-600">
                <Volume2 className="w-4 h-4 dark:text-indigo-400 text-indigo-600" />
                <span>Sound Profile</span>
              </div>
              <span className="font-bold dark:text-white text-neutral-950">{activePack} ({volumePercentage}%)</span>
            </div>

            {/* Hyper Key */}
            <div className="flex items-center justify-between text-xs border-t dark:border-white/5 border-neutral-200 pt-3">
              <div className="flex items-center gap-2.5 dark:text-neutral-400 text-neutral-600">
                <KeyRound className="w-4 h-4 dark:text-amber-400 text-amber-600" />
                <span>Hyper Key (Caps Lock)</span>
              </div>
              <span className="font-bold dark:text-white text-neutral-950">{hyperKeyEnabled ? "⚡️ Enabled" : "Disabled"}</span>
            </div>

            {/* Toggle engine shortcut */}
            <div className="flex items-center justify-between text-xs border-t dark:border-white/5 border-neutral-200 pt-3">
              <div className="flex items-center gap-2.5 dark:text-neutral-400 text-neutral-600">
                <AppWindow className="w-4 h-4 dark:text-blue-400 text-blue-600" />
                <span>Global Toggle</span>
              </div>
              <span className="font-mono text-[10px] dark:bg-white/10 bg-neutral-200 px-2 py-0.5 rounded dark:text-white text-neutral-950 font-bold">
                {toggleEngineShortcut
                  ? toggleEngineShortcut.replace('⌘⇧⌥⌃', `⚡️ + `).replace('Win+Shift+Alt+Ctrl', '⚡️ ')
                  : "None Assigned"}
              </span>
            </div>
          </OnboardingCard>

          {/* Autostart setting toggle */}
          <OnboardingCard className="flex items-center justify-between p-4 dark:bg-neutral-900/40 bg-neutral-400/20 border-neutral-800/80 rounded-2xl text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold dark:text-white text-neutral-900">Start Cliky at Login</h4>
              <p className="text-[10px] dark:text-neutral-400 text-neutral-500">Launch silently when your computer starts.</p>
            </div>
            <Switch checked={autostartEnabled} onCheckedChange={onAutostartToggle} />
          </OnboardingCard>
        </div>

        {/* Big CTAs */}
        <div className="w-full pt-2">
          <button
            onClick={finish}
            className="w-full py-4 px-6 rounded-2xl dark:bg-white bg-black  font-bold text-sm tracking-wider dark:shadow-xl dark:shadow-indigo-950/40 shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] text-white dark:text-black"
          >
            <Play className="w-4 h-4 fill-white dark:fill-black" />
            <span>Launch Cliky</span>
          </button>
        </div>
      </div>
    </StepContainer>
  );
}
