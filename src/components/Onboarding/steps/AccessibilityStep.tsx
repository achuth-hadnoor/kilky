import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Keyboard } from "lucide-react";
import { StepContainer } from "../shared/StepContainer";
import { StepHeader } from "../shared/StepHeader";
import { OnboardingCard } from "../shared/OnboardingCard";


interface AccessibilityStepProps {
  hasPermission: boolean;
  onRequestPermission: () => void;
  platformName: string;
}

const TEST_QUOTES = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing is a rhythmic dance between thought and action.",
  "Every keystroke is a beat in the melody of your digital life.",
  "In the click of a key, a new idea is born."
];

export function AccessibilityStep({
  hasPermission,
  onRequestPermission,
  platformName,
}: AccessibilityStepProps) {
  const isMac = platformName === "macos";
  const [quote] = useState(() => TEST_QUOTES[Math.floor(Math.random() * TEST_QUOTES.length)]);
  const [typedText, setTypedText] = useState("");

  return (
    <StepContainer>
      <StepHeader
        title="Input Monitoring Access"
        description="Enable system permissions to allow key press listening"
        icon={
          hasPermission ? (
            <ShieldCheck className="w-8 h-8 dark:text-emerald-500 text-green-600" />
          ) : (
            <ShieldAlert className="w-8 h-8 dark:text-amber-400 text-amber-600 animate-pulse" />
          )
        }
        iconBgColor={hasPermission ? "dark:bg-emerald-500/10 bg-green-500/10" : "dark:bg-amber-500/10 bg-amber-500/20"}
      />

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 mt-4 pb-10">
        {/* Permission Switch Card */}
        {isMac ? (
          <OnboardingCard
            className={`space-y-4 border-none p-5 transition-all duration-500 relative overflow-hidden ${hasPermission
              ? "dark:bg-emerald-500/10 bg-green-500/20 dark:border-emerald-500/20 border-green-500/20 dark:text-emerald-300 text-green-800"
              : "dark:bg-amber-500/10 bg-amber-500/20 dark:border-amber-500/20 border-amber-500/30 dark:text-amber-300 text-amber-900"
              }`}
          >
            {/* Glow backing */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 opacity-30 transition-colors duration-500 ${hasPermission ? "dark:bg-emerald-500 bg-green-500" : "dark:bg-amber-500 bg-amber-500"
                }`}
            />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${hasPermission ? "dark:bg-emerald-500/20 bg-green-500/20" : "dark:bg-amber-500/20 bg-amber-500/20"
                    }`}
                >
                  <Shield className={`w-6 h-6 ${hasPermission ? "dark:text-emerald-400 text-green-600" : "dark:text-amber-400 text-amber-600"}`} />
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    System Permission Status
                  </p>
                  <h4 className="text-sm font-extrabold dark:text-white text-neutral-900">
                    {hasPermission ? "Access Granted & Active" : "Access Authorization Required"}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${hasPermission ? "dark:bg-emerald-500/20 dark:text-emerald-400 bg-green-500/20 text-green-700" : "dark:bg-amber-500/20 dark:text-amber-400 bg-amber-500/20 text-amber-700"
                  }`}>
                  {hasPermission ? "Live" : "Pending"}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed text-left relative z-10">
              {hasPermission
                ? "Excellent! Input Monitoring is active. Cliky is ready to monitor keystrokes globally."
                : "macOS requires you to enable Input Monitoring for Cliky in System Settings so it can play sounds system-wide."}
            </p>

            {!hasPermission && (
              <button
                onClick={onRequestPermission}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold tracking-wide transition-all duration-300 dark:shadow-lg dark:shadow-orange-950/40 shadow-md shadow-orange-500/25 relative z-10 active:scale-[0.98]"
              >
                Open System Settings
              </button>
            )}
          </OnboardingCard>
        ) : (
          <OnboardingCard className="space-y-4 border-none p-5 dark:bg-emerald-500/10 bg-green-500/20 dark:text-emerald-300 text-green-800">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl dark:bg-emerald-500/20 bg-green-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6 dark:text-emerald-400 text-green-600" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Operating System Ready
                </p>
                <h4 className="text-sm font-extrabold dark:text-white text-neutral-900">
                  No Additional Permission Needed
                </h4>
              </div>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed text-left">
              Keyboard events are natively supported on your platform. You're ready to proceed to the next step!
            </p>
          </OnboardingCard>
        )}

        {/* Live typing test area */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1 px-1">
            <Keyboard className="w-4 h-4 text-neutral-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Live Status Typing Tester</span>
          </div>

          <OnboardingCard
            className={`p-0 overflow-hidden bg-black/5 dark:bg-white/5 dark:border-zinc-800 border-zinc-300 relative h-36 group focus-within:ring-2 transition-all duration-300 ${hasPermission
              ? "dark:focus-within:ring-emerald-500/30 focus-within:ring-green-500/30 dark:hover:border-emerald-500/20 hover:border-green-500/20"
              : "dark:focus-within:ring-amber-500/20 focus-within:ring-amber-500/30 dark:hover:border-zinc-800 hover:border-zinc-300"
              }`}
          >
            {/* Ghost Text Layer */}
            <div className="absolute inset-0 p-4 text-xs font-medium leading-relaxed select-none pointer-events-none whitespace-pre-wrap break-all opacity-15 text-neutral-500">
              {quote}
            </div>

            {/* User Text Layer */}
            <textarea
              autoFocus={hasPermission}
              disabled={!hasPermission && isMac}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className={`absolute inset-0 w-full h-full p-4 bg-transparent text-xs font-medium leading-relaxed resize-none focus:outline-none whitespace-pre-wrap break-all ${hasPermission
                ? "text-green-600 dark:text-emerald-300 cursor-text"
                : "dark:text-neutral-500 text-neutral-400 cursor-not-allowed placeholder-neutral-400 dark:placeholder-neutral-600"
                }`}
              spellCheck={false}
            />

            <div className="absolute bottom-2 right-3 text-[9px] uppercase tracking-tighter font-extrabold dark:text-neutral-600 text-neutral-400 group-focus-within:opacity-0 transition-opacity">
              {hasPermission ? "Start typing to test" : "Awaiting Input Monitoring Access"}
            </div>
          </OnboardingCard>
        </div>
      </div>
    </StepContainer>
  );
}
