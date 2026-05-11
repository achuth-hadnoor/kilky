import { ChevronRight, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepHeader } from "../shared/StepHeader";
import { OnboardingCard } from "../shared/OnboardingCard";
import { StepContainer } from "../shared/StepContainer";
import { VolumeControl } from "../../Sound/VolumeControl";
import { SoundPackPicker } from "../../Sound/SoundPackPicker";
import { Switch } from "@/components/ui/switch";

interface SoundSelectionStepProps {
  activePack: string;
  previewingPack: string | null;
  volume: number;
  onPackChange: (id: string) => void;
  onPlayPreview: (e: React.MouseEvent, id: string) => void;
  onVolumeUpdate: (val: number[]) => void;
  onNext: () => void;
  hasPermission: boolean;
  onRequestPermission: () => void;
  platformName: string;
}

export function SoundSelectionStep({
  activePack,
  previewingPack,
  volume,
  onPackChange,
  onPlayPreview,
  onVolumeUpdate,
  onNext,
  hasPermission,
  onRequestPermission,
  platformName,
}: SoundSelectionStepProps) {
  const isMac = platformName === "macos";

  return (
    <StepContainer>
      <StepHeader
        title="kliky"
        description="Select your typing sound profile"
      />

      <div className="space-y-4">
        {/* Permission Section */}
        {isMac
          && <OnboardingCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {hasPermission ? <Shield className="w-4 h-4 text-green-400 dark:text-green-500" /> : <AlertCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />}
                  <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400"> {hasPermission ? "Accessibility Access Enabled" : "Enable Accessibility Access"}</span>
                </div>
                {/* <div className="flex flex-col">
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Accessibility Access</span>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Required to detect key presses and play sounds
                  </p>
                </div> */}
              </div>
              <Switch
                checked={hasPermission}
                disabled={hasPermission}
                onCheckedChange={(checked) => {
                  if (checked && !hasPermission) {
                    onRequestPermission();
                  }
                }}
              />
            </div>
          </OnboardingCard>}

        <OnboardingCard className="py-2 px-4">
          <VolumeControl
            volume={volume}
            onVolumeUpdate={onVolumeUpdate}
          />
        </OnboardingCard>

        <SoundPackPicker
          activePack={activePack}
          previewingPack={previewingPack}
          onPackChange={onPackChange}
          onPlayPreview={onPlayPreview}
        />
      </div>

      <Button
        className="w-full h-14 rounded-2xl bg-white text-black font-bold text-lg hover:bg-zinc-200 "
        onClick={onNext}
        disabled={!hasPermission}
      >
        Continue
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </StepContainer>
  );
}
