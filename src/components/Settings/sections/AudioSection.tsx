import { VolumeControl } from "../../Sound/VolumeControl";
import { SoundPackPicker } from "../../Sound/SoundPackPicker";

interface AudioSectionProps {
  volume: number;
  handleVolumeUpdate: (vol: number[]) => void;
  activePack: string;
  previewingPack: string | null;
  handlePackChange: (pack: string) => void;
  handlePlayPreview: (e: React.MouseEvent, id: string) => void;
}

export function AudioSection({
  volume,
  handleVolumeUpdate,
  activePack,
  previewingPack,
  handlePackChange,
  handlePlayPreview,
}: AudioSectionProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-semibold mb-2">Sound Profiles</h3>
        <p className="text-sm text-black/40 dark:text-white/40">Select the acoustic profile that matches your setup.</p>
      </div>

      <div className="py-2 px-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
        <VolumeControl
          volume={volume}
          onVolumeUpdate={handleVolumeUpdate}
        />
      </div>

      <SoundPackPicker
        activePack={activePack}
        previewingPack={previewingPack}
        onPackChange={handlePackChange}
        onPlayPreview={handlePlayPreview}
      />
    </div>
  );
}
