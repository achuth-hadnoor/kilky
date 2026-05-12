import { Rocket, Keyboard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StepHeader } from "../shared/StepHeader";
import { OnboardingCard } from "../shared/OnboardingCard";
import { StepContainer } from "../shared/StepContainer";
import { ShortcutRecorder } from "../../shared/ShortcutRecorder";
import { Shortcut } from "../../shared/utils";

interface LaunchSettingsStepProps {
  isAutostart: boolean;
  onAutoLaunchChange: (checked: boolean) => void;
  shortcuts: Record<string, Shortcut>;
  recordingAction: string | null;
  previewShortcut: string | null;
  onRecord: (action: string, isRecording: boolean) => void;
  onClear: (action: string) => void;
  hyperKeyEnabled: boolean;
}

export function LaunchSettingsStep({
  isAutostart,
  onAutoLaunchChange,
  shortcuts,
  recordingAction,
  previewShortcut,
  onRecord,
  onClear,
  hyperKeyEnabled,
}: LaunchSettingsStepProps) {
  return (
    <StepContainer>
      <StepHeader
        title="Final Step"
        description="Configure how Kliky starts"
        icon={<Rocket className="w-10 h-10 text-blue-400" />}
        iconBgColor="bg-blue-500/10"
      />

      <div className="space-y-4">
        {/* Startup Setting */}
        <OnboardingCard className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <p className="text-sm font-bold text-black dark:text-white">Launch at Startup</p>
            <p className="text-[10px] text-zinc-500 text-left">Automatically start when you log in</p>
          </div>
          <Switch checked={isAutostart} onCheckedChange={onAutoLaunchChange} />
        </OnboardingCard>

        {/* Hyper Key Setting */}
        <OnboardingCard className="flex items-center justify-between p-6 bg-indigo-500/5 border-indigo-500/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-black dark:text-white">Hyper Key (Caps Lock)</p>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500 text-white uppercase tracking-tighter">Enabled</span>
            </div>
            <p className="text-[10px] text-zinc-500 text-left">Use Caps Lock as ⌘+⌥+⌃+⇧ for powerful shortcuts</p>
          </div>
        </OnboardingCard>

        {/* Global Shortcut Setting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Global Hotkey</span>
          </div>
          <ShortcutRecorder
            action="toggle_engine"
            label="Toggle Engine"
            description="Enable or disable sounds from anywhere."
            recordingAction={recordingAction}
            shortcuts={shortcuts}
            previewShortcut={previewShortcut}
            onRecord={onRecord}
            onClear={onClear}
            onboarding={true}
            hyperKeyEnabled={hyperKeyEnabled}
          />
        </div>
      </div>

    </StepContainer>
  );
}
