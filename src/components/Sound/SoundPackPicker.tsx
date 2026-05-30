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

  // Helper to determine badge color and label based on description
  const getBadgeSpecs = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes("linear")) {
      return {
        label: "Linear",
        classes: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
      };
    } else if (d.includes("tactile")) {
      return {
        label: "Tactile",
        classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      };
    } else if (d.includes("clicky")) {
      return {
        label: "Clicky",
        classes: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
      };
    } else {
      return {
        label: "Retro",
        classes: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
      };
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {SOUND_PACKS.map((pack) => {
        const specs = getBadgeSpecs(pack.desc);
        const isActive = activePack === pack.id;
        const isPreviewing = previewingPack === pack.id;

        return (
          <button
            key={pack.id}
            onClick={() => onPackChange(pack.id)}
            className={`flex items-center justify-between w-full p-2 pr-3 rounded-xl border cursor-pointer duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-white/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black/50 ${
              isActive
                ? "bg-red-500/5 dark:bg-red-500/10 border-red-500/50 shadow-sm scale-[1.01]"
                : "bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:border-border"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {/* Icon Container with active pulse */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-xs relative transition duration-200 ${
                isActive 
                  ? "bg-red-500 text-white" 
                  : "bg-muted text-foreground/75 group-hover:bg-background"
              }`}>
                {isPreviewing ? (
                  // Bouncing visualizer bars when previewing
                  <div className="flex items-end gap-[1.5px] h-3">
                    <span className={`w-[2px] rounded-full animate-bounce h-full ${isActive ? 'bg-white' : 'bg-red-500'}`} style={{ animationDuration: '0.6s', animationDelay: '0.1s' }} />
                    <span className={`w-[2px] rounded-full animate-bounce h-3/4 ${isActive ? 'bg-white' : 'bg-red-500'}`} style={{ animationDuration: '0.6s', animationDelay: '0.3s' }} />
                    <span className={`w-[2px] rounded-full animate-bounce h-full ${isActive ? 'bg-white' : 'bg-red-500'}`} style={{ animationDuration: '0.6s', animationDelay: '0.2s' }} />
                  </div>
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                {isActive && !isPreviewing && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-background dark:border-zinc-950 flex items-center justify-center">
                    <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                  </span>
                )}
              </div>

              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-xs text-foreground truncate max-w-[70px] sm:max-w-none">{pack.name}</p>
                  <span className={`text-[8px] px-1 py-0.2 rounded-full font-bold uppercase tracking-wider scale-95 ${specs.classes}`}>
                    {specs.label}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground line-clamp-1">{pack.desc}</p>
              </div>
            </div>

            {/* Play Preview Button */}
            <Button
              size="icon"
              variant="ghost"
              className={`w-7 h-7 rounded-full border border-border bg-background/50 hover:bg-red-500 hover:text-white text-foreground focus-visible:ring-2 focus-visible:ring-red-500 ${
                isPreviewing ? "opacity-100 bg-red-500 text-white" : "opacity-0 group-hover:opacity-100"
              }`}
              onClick={(e) => onPlayPreview(e, pack.id)}
            >
              {isPreviewing ? (
                <Square className="w-2 h-2 fill-current" />
              ) : (
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              )}
            </Button>
          </button>
        );
      })}

      {/* Disabled Placeholder button */}
      <button
        className="flex items-center justify-between w-full p-2 pr-3 rounded-xl border border-dashed border-border/80 bg-transparent opacity-60 cursor-not-allowed"
        disabled
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground/45">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="text-left space-y-0.5">
            <p className="font-bold text-xs text-muted-foreground/60">More</p>
            <p className="text-[9px] text-muted-foreground/45">coming soon</p>
          </div>
        </div>
      </button>
    </div>
  );
}
