import { ChevronRight, Speaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepHeader } from "../shared/StepHeader";
import { OnboardingCard } from "../shared/OnboardingCard";
import { StepContainer } from "../shared/StepContainer";

interface PermissionsStepProps {
  hasPermission: boolean;
  audioDevices: string[];
  selectedDevice: string;
  onDeviceChange: (device: string) => void;
  onNext: () => void;
}

export function PermissionsStep({
  hasPermission,
  audioDevices,
  selectedDevice,
  onDeviceChange,
  onNext,
}: PermissionsStepProps) {

  return (
    <StepContainer>
      <StepHeader
        title="Audio Output"
        description="Select where you want to hear your typing sounds"
        icon={<Speaker className="w-10 h-10 text-emerald-200 dark:text-emerald-500" />}
        iconBgColor="bg-emerald-500 dark:bg-emerald-500/10"
      />

      <div className="space-y-4 ">
        {/* Audio Device Section */}
        <OnboardingCard className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Speaker className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold dark:text-zinc-500 text-zinc-500">Audio Output</span>
          </div>
          <select
            value={selectedDevice}
            onChange={(e) => onDeviceChange(e.target.value)}
            className="w-full p-3 bg-white/5 rounded-xl border dark:border-white/10 border-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer dark:text-white text-zinc-900"
          >
            <option value="" className="bg-zinc-900 text-white">Default System Device</option>
            {audioDevices.map((device) => (
              <option key={device} value={device} className="bg-zinc-900 text-white">
                {device}
              </option>
            ))}
          </select>
        </OnboardingCard>
        <Button
          className="w-full h-14 rounded-2xl bg-white text-black font-bold text-lg hover:bg-zinc-200 "
          onClick={onNext}
          disabled={!hasPermission}
        >
          Next Step
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

    </StepContainer>
  );
}
