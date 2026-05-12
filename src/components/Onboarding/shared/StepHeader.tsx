import { ReactNode } from "react";

interface StepHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  iconBgColor?: string;
}

export function StepHeader({ title, description, icon, iconBgColor = "bg-black/5 dark:bg-white/5" }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-4 py-4 shrink-0 border-b border-black/5 dark:border-white/5 mb-2">
      {icon && (
        <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-black/5 dark:border-white/5 flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
      )}
      <div className="text-left space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tighter text-black dark:text-white" data-tauri-drag-region>
          {title}
        </h1>
        <p className="text-[11px] text-black/40 dark:text-white/40">{description}</p>
      </div>
    </div>
  );
}
