import { Volume2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOUND_PACKS } from "./types";

interface SoundPackPickerProps {
  activePack: string;
  previewingPack: string | null;
  onPackChange: (id: string) => void;
  onPlayPreview: (e: React.MouseEvent, id: string) => void;
}

export function SoundPackPicker({
  activePack,
  previewingPack,
  onPackChange,
  onPlayPreview,
}: SoundPackPickerProps) {

  return (
    <div className="grid grid-cols-2 gap-3">
      {SOUND_PACKS.map((pack) => (
        <button
          key={pack.id}
          onClick={() => onPackChange(pack.id)}
          className={`flex items-center justify-between w-full p-1 rounded-2xl border transition-all duration-200 group ${activePack === pack.id
            ? "bg-indigo-600/10 border-indigo-500/50 dark:bg-white/10 dark:border-white/20 shadow-xl"
            : "bg-black/5 border-transparent hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${pack.color} flex items-center justify-center text-white shadow-lg`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-black dark:text-white">{pack.name}</p>
              <p className="text-[10px] text-zinc-500">{pack.desc}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className={`w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-indigo-500 hover:text-white dark:hover:bg-white/20 text-black dark:text-white ${previewingPack === pack.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            onClick={(e) => onPlayPreview(e, pack.id)}
          >
            {previewingPack === pack.id ? (
              <Square className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </Button>
        </button>
      ))}
      <button
        className="flex items-center justify-between w-full p-1 rounded-2xl border transition-all duration-200 group border-dotted  border-black/20  dark:border-white/20 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl dark:bg-grey-600/10 bg-black/10 flex items-center justify-center text-black/40 dark:text-white/30 ">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-black/30 dark:text-white/40">More packs</p>
            <p className="text-[10px] text-zinc-500/50">coming soon</p>
          </div>
        </div>
      </button>
    </div>
  );
}
