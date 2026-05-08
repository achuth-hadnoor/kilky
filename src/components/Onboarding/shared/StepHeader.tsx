import { ReactNode } from "react";

interface StepHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  iconBgColor?: string;
}

export function StepHeader({ title, description, icon, iconBgColor = "bg-white/5" }: StepHeaderProps) {
  return (
    <div className="text-center space-y-2">
      {icon && (
        <div className={`w-20 h-20 ${iconBgColor} rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/10 text-black dark:text-white `}>
          {icon}
        </div>
      )}
      <h1 className={`font-black tracking-tight text-black dark:text-white ${icon ? "text-3xl" : "text-5xl"} `}>
        {title}
      </h1>
      <p className="text-gray-600 dark:text-zinc-400 text-sm">{description}</p>
    </div>
  );
}
