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
        <div className={`w-20 h-20 ${iconBgColor} rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/10`}>
          {icon}
        </div>
      )}
      <h1 className={`font-black tracking-tight ${icon ? "text-3xl" : "text-5xl tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent"}`}>
        {title}
      </h1>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  );
}
