import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepHeader } from "../shared/StepHeader";
import { OnboardingCard } from "../shared/OnboardingCard";
import { StepContainer } from "../shared/StepContainer";
import { VolumeControl } from "../../Sound/VolumeControl";
import { SoundPackPicker } from "../../Sound/SoundPackPicker";

interface SoundSelectionStepProps {
  activePack: string;
  previewingPack: string | null;
  volume: number;
  onPackChange: (id: string) => void;
  onPlayPreview: (e: React.MouseEvent, id: string) => void;
  onVolumeUpdate: (val: number[]) => void;
  onNext: () => void;
}

export function SoundSelectionStep({
  activePack,
  previewingPack,
  volume,
  onPackChange,
  onPlayPreview,
  onVolumeUpdate,
  onNext,
}: SoundSelectionStepProps) {
  return (
    <StepContainer>
      <StepHeader
        title="kliky"
        description="Select your typing sound profile"
      />

      <div className="space-y-4">
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
      >
        Continue
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </StepContainer>
  );
}
