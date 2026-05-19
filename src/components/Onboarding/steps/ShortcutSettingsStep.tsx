import { Keyboard, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StepHeader } from "../shared/StepHeader";
import { OnboardingCard } from "../shared/OnboardingCard";
import { StepContainer } from "../shared/StepContainer";
import { ShortcutRecorder } from "../../shared/ShortcutRecorder";
import { Shortcut } from "../../../types";

interface ShortcutSettingsStepProps {
  shortcuts: Record<string, Shortcut>;
  recordingAction: string | null;
  previewShortcut: string | null;
  onRecord: (action: string, isRecording: boolean) => void;
  onClear: (action: string) => void;
  hyperKeyEnabled: boolean;
  onHyperKeyToggle: (checked: boolean) => void;
}

export function ShortcutSettingsStep({
  shortcuts,
  recordingAction,
  previewShortcut,
  onRecord,
  onClear,
  hyperKeyEnabled,
  onHyperKeyToggle,
}: ShortcutSettingsStepProps) {
  return (
    <StepContainer>
      <StepHeader
        title="Shortcut & Hyper Key"
        description="Configure powerful keyboard integrations"
        icon={<Keyboard className="w-8 h-8 dark:text-blue-400 text-blue-600" />}
        iconBgColor="dark:bg-blue-500/10 bg-blue-500/15"
      />

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 mt-4 pb-10">
        {/* Hyper Key Setting */}
        <OnboardingCard className="flex items-center justify-between p-5 dark:bg-indigo-500/5 bg-indigo-500/10 dark:border-indigo-500/20 border-indigo-500/30 rounded-2xl">
          <div className="space-y-1 text-left flex-1 mr-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 dark:text-indigo-400 text-indigo-600" />
              <p className="text-sm font-bold dark:text-white text-neutral-900">Hyper Key (Caps Lock)</p>
            </div>
            <p className="text-[10px] dark:text-neutral-400 text-neutral-500 leading-normal">
              Remap Caps Lock to ⌘+⌥+⌃+⇧. Pressing Caps Lock + any key triggers powerful hotkeys without finger stretching.
            </p>
          </div>
          <Switch checked={hyperKeyEnabled} onCheckedChange={onHyperKeyToggle} />
        </OnboardingCard>

        {/* Global Shortcut Setting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1 px-1">
            <Keyboard className="w-4 h-4 text-neutral-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Global Engine Toggle</span>
          </div>

          <OnboardingCard className="p-1 dark:bg-neutral-900/40 bg-neutral-400/20 border-neutral-800/80 rounded-2xl">
            <ShortcutRecorder
              action="toggle_engine"
              label="Toggle Engine"
              description="Enable or disable keyboard sounds from anywhere."
              recordingAction={recordingAction}
              shortcuts={shortcuts}
              previewShortcut={previewShortcut}
              onRecord={onRecord}
              onClear={onClear}
              onboarding={true}
              hyperKeyEnabled={hyperKeyEnabled}
            />
          </OnboardingCard>
        </div>
      </div>
    </StepContainer>
  );
}
