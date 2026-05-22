import { Speaker, Volume2, ChevronRight } from "lucide-react";
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
  audioDevices: string[];
  selectedDevice: string;
  onDeviceChange: (device: string) => void;
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
  audioDevices,
  selectedDevice,
  onDeviceChange,
}: SoundSelectionStepProps) {
  return (
    <StepContainer>
      <StepHeader
        title="Choose Sound Pack"
        description="Select and preview your system-wide sound profile"
        icon={<Speaker className="w-8 h-8 dark:text-red-400 text-red-600" />}
        iconBgColor="dark:bg-red-500/10 bg-red-500/15"
      />

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5 py-2 min-h-0">
        {/* Master Toggle and Volume */}
        <OnboardingCard className="space-y-3 dark:bg-neutral-900/40 bg-neutral-400/20 border-neutral-800/80 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Audio Engine Status</p>
              <h4 className="text-xs font-bold dark:text-white text-neutral-900">Enable Sound Engine</h4>
            </div>
            <Switch checked={enabled} onCheckedChange={enableKliky} />
          </div>
          <div className="pt-2 border-t dark:border-white/5 border-neutral-200">
            <VolumeControl volume={volume} onVolumeUpdate={onVolumeUpdate} />
          </div>
        </OnboardingCard>

        {/* Audio Device Section */}
        <OnboardingCard className="space-y-2.5 dark:bg-neutral-900/40 bg-neutral-400/20 border-neutral-800/80 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-left">
            <Volume2 className="w-4 h-4 text-neutral-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Audio Output Device</span>
          </div>
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e) => onDeviceChange(e.target.value)}
              className="w-full p-3 dark:bg-black/30 bg-white rounded-xl border dark:border-zinc-800 border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/30 appearance-none cursor-pointer dark:text-white text-neutral-900"
            >
              <option value="" className="dark:bg-zinc-950 bg-white dark:text-white text-neutral-900">Default System Device</option>
              {audioDevices.map((device) => (
                <option key={device} value={device} className="dark:bg-zinc-950 bg-white dark:text-white text-neutral-900">
                  {device}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 dark:text-white text-neutral-900">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </OnboardingCard>

        {/* Pack Selection */}
        <div className="space-y-3">
          <div className="flex items-center px-1">
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Sound Profiles</p>
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
