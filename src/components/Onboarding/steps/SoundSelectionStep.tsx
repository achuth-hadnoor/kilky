import { Shield, AlertCircle } from "lucide-react";
import { OnboardingCard } from "../shared/OnboardingCard";
import { StepContainer } from "../shared/StepContainer";
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
      <div className="flex flex-col items-center py-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl border-2 border-black/5 dark:border-white/5">
          <img src="/icon.png" alt="Kliky Logo" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tighter">kliky</h1>
          <p className="text-sm text-black/40 dark:text-white/40">Select your typing sound profile</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Permission Section */}
        {isMac
          && <OnboardingCard className="space-y-4 bg-lime-300/10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {hasPermission ? <Shield className="w-4 h-4 text-lime-600 dark:text-green-400" /> : <AlertCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />}
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
        <OnboardingCard className="space-y-4 bg-black/5 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400"> Enable Kliky</span>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={enableKliky}
            />
          </div>
        </OnboardingCard>
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

    </StepContainer>
  );
}
