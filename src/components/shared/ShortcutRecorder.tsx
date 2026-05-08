import { Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface Shortcut {
  key_code: number;
  modifiers: number;
  display: string;
}

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

export const getMacosKeyName = (code: number) => {
  // Modifier keys (don't return a name for them to prevent standalone modifier shortcuts)
  if ([54, 55, 56, 57, 58, 59, 60, 61, 62, 63].includes(code)) return null;

  const map: Record<number, string> = {
    0: 'A', 1: 'S', 2: 'D', 3: 'F', 4: 'H', 5: 'G', 6: 'Z', 7: 'X', 8: 'C', 9: 'V',
    11: 'B', 12: 'Q', 13: 'W', 14: 'E', 15: 'R', 16: 'Y', 17: 'T', 18: '1', 19: '2',
    20: '3', 21: '4', 22: '6', 23: '5', 24: '=', 25: '9', 26: '7', 27: '-', 28: '8',
    29: '0', 30: ']', 31: 'O', 32: 'U', 33: '[', 34: 'I', 35: 'P', 36: 'Return', 37: 'L', 38: 'J',
    39: "'", 40: 'K', 41: ';', 42: '\\', 43: ',', 44: '/', 45: 'N', 46: 'M', 47: '.',
    48: 'Tab', 49: 'Space', 50: '`', 51: 'Delete', 53: 'Esc', 71: 'Clear',
    123: '←', 124: '→', 125: '↓', 126: '↑',
    96: 'F5', 97: 'F6', 98: 'F7', 99: 'F3', 100: 'F8', 101: 'F9', 103: 'F11', 105: 'F13', 107: 'F14', 109: 'F10', 111: 'F12', 113: 'F15',
  };
  return map[code] || `K${code}`;
};

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
    <div className={`flex gap-4 p-2 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 transition-all hover:bg-black/[0.07] dark:hover:bg-white/[0.07] ${onboarding ? 'flex-col' : 'flex-row items-center justify-betwee'}`}>
      <div className={`space-y-1 ${onboarding ? 'items-start justify-start' : 'items-center justify-center'}`}>
        <Label className="text-base font-semibold">{label}</Label>
        <p className="text-xs text-black/40 dark:text-white/40">{description}</p>
      </div>
      <div className="flex justify-between items-center gap-2">
        {shortcut && !isRecording && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-black/20 dark:text-white/20 hover:text-red-500 transition-colors"
            onClick={() => onClear(action)}
          >
            Clear
          </Button>
        )}
        <Button
          variant="outline"
          className={`min-w-[140px] h-10 font-mono text-xs transition-all relative overflow-hidden ${isRecording ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20' : 'hover:border-black/20 dark:hover:border-white/20'}`}
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
