import { Label } from "@/components/ui/label";
import { Zap } from 'lucide-react';
import { ShortcutRecorder } from "../../shared/ShortcutRecorder";
import { Shortcut } from "../../shared/utils";

interface HotkeysSectionProps {
  recordingAction: string | null;
  shortcuts: Record<string, Shortcut>;
  previewShortcut: string | null;
  setRecordingAction: (action: string | null) => void;
  setPreviewShortcut: (shortcut: string | null) => void;
  setBackendRecording: (recording: boolean) => void;
  handleClearShortcut: (action: string) => void;
  hyperKeyEnabled: boolean;
}

export function HotkeysSection({
  recordingAction,
  shortcuts,
  previewShortcut,
  setRecordingAction,
  setPreviewShortcut,
  setBackendRecording,
  handleClearShortcut,
  hyperKeyEnabled,
}: HotkeysSectionProps) {
  return (
    <div className="space-y-8 ">
      <div>
        <h3 className="text-2xl font-semibold mb-2">Global Hotkeys</h3>
        <p className="text-sm text-black/40 dark:text-white/40">Control kliky from any application with custom key combinations.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div className="space-y-1">
              <Label className="text-base font-semibold">Caps Lock Hyper Key</Label>
              <p className="text-xs text-black/40 dark:text-white/40">Hold Caps Lock to trigger ⌘ + ⌥ + ⌃ + ⇧ instantly.</p>
            </div>
          </div>
        </div>

        <ShortcutRecorder
          action="toggle_engine"
          label="Toggle Engine"
          description="Instantly enable or disable all keyboard sounds."
          recordingAction={recordingAction}
          shortcuts={shortcuts}
          previewShortcut={previewShortcut}
          onRecord={(action, next) => {
            setRecordingAction(next ? action : null);
            setPreviewShortcut(null);
            setBackendRecording(next);
          }}
          onClear={handleClearShortcut}
          hyperKeyEnabled={hyperKeyEnabled}
        />

        <div className="opacity-40 grayscale pointer-events-none">
          <ShortcutRecorder
            action="volume_up"
            label="Volume Up"
            description="Increase engine volume by 5."
            recordingAction={recordingAction}
            shortcuts={shortcuts}
            previewShortcut={previewShortcut}
            onRecord={() => { }}
            onClear={() => { }}
          />
        </div>

        <div className="opacity-40 grayscale pointer-events-none">
          <ShortcutRecorder
            action="volume_down"
            label="Volume Down"
            description="Decrease engine volume by 5."
            recordingAction={recordingAction}
            shortcuts={shortcuts}
            previewShortcut={previewShortcut}
            onRecord={() => { }}
            onClear={() => { }}
          />
        </div>
      </div>

      <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10 text-center">
        <p className="text-[10px] uppercase tracking-widest font-bold text-black/20 dark:text-white/20">More shortcuts coming soon</p>
      </div>
    </div>
  );
}
