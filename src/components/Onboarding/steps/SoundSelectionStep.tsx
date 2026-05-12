import { Shield } from "lucide-react";
import { OnboardingCard } from "../shared/OnboardingCard";
import { StepContainer } from "../shared/StepContainer";
import { StepHeader } from "../shared/StepHeader";
import { VolumeControl } from "../../Sound/VolumeControl";
import { SoundPackPicker } from "../../Sound/SoundPackPicker";
import { Switch } from "@/components/ui/switch";

interface SoundSelectionStepProps {
  enabled: boolean;
  enableKliky: () => void;
  activePack: string;
  previewingPack: string | null;
  volume: number;
  onPackChange: (id: string) => void;
  onPlayPreview: (e: React.MouseEvent, id: string) => void;
  onVolumeUpdate: (val: number[]) => void;
  hasPermission: boolean;
  onRequestPermission: () => void;
  platformName: string;
}

export function SoundSelectionStep({
  enabled,
  enableKliky,
  activePack,
  previewingPack,
  volume,
  onPackChange,
  onPlayPreview,
  onVolumeUpdate,
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
        icon={<img src="/icon.png" alt="Kliky Logo" className="w-full h-full object-cover" />}
      />

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 py-2">
        {/* Permission Section */}
        {isMac && (
          <OnboardingCard className={`space-y-4 border-none transition-colors duration-500 ${hasPermission ? 'bg-green-400/20 dark:bg-lime-400/10 text-lime-800 dark:text-green-600' : 'bg-orange-400/20 dark:bg-amber-400/10 text-amber-800 dark:text-amber-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 " />
                <div className="space-y-0.5 text-left">
                  <p className="text-[10px] font-bold ">
                    {hasPermission ? "Access Granted: Keystroke listening is active" : "Accessibility Access Required"}
                  </p>
                </div>
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
          </OnboardingCard>
        )}

        {/* Master Toggle and Volume */}
        <OnboardingCard className="space-y-2 bg-black/5 dark:bg-white/5 border-none">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Audio Engine</p>
              <p className="text-[10px] text-zinc-400">Master sound toggle</p>
            </div>
            <Switch checked={enabled} onCheckedChange={enableKliky} />
          </div>
          <div className="pt-2 border-t border-black/5 dark:border-white/5">
            <VolumeControl volume={volume} onVolumeUpdate={onVolumeUpdate} />
          </div>
        </OnboardingCard>

        {/* Pack Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2 px-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Sound Profiles</p>
          </div>
          <SoundPackPicker
            activePack={activePack}
            previewingPack={previewingPack}
            onPackChange={onPackChange}
            onPlayPreview={onPlayPreview}
          />
        </div>
      </div>
    </StepContainer>
  );
}
