import { useState } from "react";
import { Speaker, ChevronRight } from "lucide-react";
import { StepHeader } from "../shared/StepHeader";
import { OnboardingCard } from "../shared/OnboardingCard";
import { StepContainer } from "../shared/StepContainer";

interface PermissionsStepProps {
  audioDevices: string[];
  selectedDevice: string;
  onDeviceChange: (device: string) => void;
}

const QUOTES = [
  "The quick brown fox jumps over the lazy dog.",
  "Every keystroke is a beat in the melody of your digital life.",
  "Typing is a rhythmic dance between thought and action.",
  "In the click of a key, a new idea is born.",
  "Words are a thin veneer over a vast deep of silence.",
  "Simplicity is the ultimate sophistication."
];

export function PermissionsStep({
  audioDevices,
  selectedDevice,
  onDeviceChange,
}: PermissionsStepProps) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [typedText, setTypedText] = useState("");

  return (
    <StepContainer>
      <StepHeader
        title="Test & Output"
        description="Type the ghost text below to test your sounds"
        icon={<Speaker className="w-8 h-8 text-emerald-500" />}
        iconBgColor="bg-emerald-500/10"
      />

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 mt-4 pb-10">
        {/* Testing Area */}
        <OnboardingCard className="p-0 overflow-hidden bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 relative h-32 group focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
          {/* Ghost Text Layer */}
          <div
            className="absolute inset-0 p-4 text-md font-medium leading-relaxed select-none pointer-events-none whitespace-pre-wrap break-all opacity-20 dark:opacity-10 text-black dark:text-white"
          >
            {quote}
          </div>

          {/* User Text Layer */}
          <textarea
            autoFocus
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder=""
            className="absolute inset-0 w-full h-full p-4 bg-transparent text-md font-medium leading-relaxed resize-none focus:outline-none text-indigo-600 dark:text-indigo-400 whitespace-pre-wrap break-all"
            spellCheck={false}
          />

          <div className="absolute bottom-2 right-3 text-[9px] uppercase tracking-tighter font-bold text-black/20 dark:text-white/20 group-focus-within:opacity-0 transition-opacity">
            Start typing to test
          </div>
        </OnboardingCard>

        {/* Audio Device Section */}
        <OnboardingCard className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold dark:text-zinc-500 text-zinc-500">Audio Output Device</span>
          </div>
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e) => onDeviceChange(e.target.value)}
              className="w-full p-3 bg-black/5 dark:bg-white/5 rounded-xl border dark:border-white/10 border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer dark:text-white text-zinc-900"
            >
              <option value="" className="bg-white dark:bg-zinc-900 text-black dark:text-white">Default System Device</option>
              {audioDevices.map((device) => (
                <option key={device} value={device} className="bg-white dark:bg-zinc-900 text-black dark:text-white">
                  {device}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </OnboardingCard>

      </div>
    </StepContainer>
  );
}