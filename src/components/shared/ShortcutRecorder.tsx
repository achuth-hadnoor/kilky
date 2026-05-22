import { Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shortcut, getMacosKeyName } from "./utils";

interface ShortcutRecorderProps {
  action: string;
  label: string;
  description: string;
  recordingAction: string | null;
  shortcuts: Record<string, Shortcut>;
  previewShortcut: string | null;
  onRecord: (action: string, isRecording: boolean) => void;
  onClear: (action: string) => void;
  hyperKeyEnabled?: boolean;
  onboarding?: boolean;
}


export const ShortcutRecorder = ({
  action,
  label,
  description,
  recordingAction,
  shortcuts,
  previewShortcut,
  onRecord,
  onClear,
  onboarding = false,
}: ShortcutRecorderProps) => {
  const isRecording = recordingAction === action;
  const shortcut = shortcuts[action];

  return (
    <div className={`flex gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-black/[0.07] dark:hover:bg-white/[0.07] transition-all duration-200 ${onboarding ? 'flex-col' : 'flex-row items-center justify-between'}`}>
      <div className={`space-y-1 ${onboarding ? 'items-start justify-start' : 'items-center justify-center'}`}>
        <Label className="text-base font-semibold text-black dark:text-white">{label}</Label>
        <p className="text-xs text-black/40 dark:text-white/40">{description}</p>
      </div>
      <div className="flex justify-between items-center gap-2">
        {shortcut && !isRecording && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-black/20 dark:text-white/20 hover:text-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-white/80"
            onClick={() => onClear(action)}
          >
            Clear
          </Button>
        )}
        <Button
          variant="outline"
          className={`min-w-[140px] h-10 font-mono text-xs cursor-pointer relative overflow-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50 ${isRecording ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20' : 'hover:border-black/20 dark:hover:border-white/20'}`}
          onClick={() => onRecord(action, !isRecording)}
        >
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>{previewShortcut || 'Recording...'}</span>
            </div>
          ) : (
            <div className={shortcut ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-black/40 dark:text-white/40'}>
              {shortcut ? (
                shortcut.modifiers === 15 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] tracking-tight uppercase">
                      <Zap className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" />
                    </div>
                    <span>+ {getMacosKeyName(shortcut.key_code)}</span>
                  </div>
                ) : (
                  <span className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" >{shortcut.display}</span>
                )
              ) : (
                'Record Shortcut'
              )}
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};
