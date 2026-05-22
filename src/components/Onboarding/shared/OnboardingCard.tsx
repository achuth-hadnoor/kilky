import { ReactNode } from "react";

interface OnboardingCardProps {
  children: ReactNode;
  className?: string;
}

export function OnboardingCard({ children, className = "" }: OnboardingCardProps) {
  return (
    <div className={`${className} px-2 py-2 rounded-xl border border-zinc-400 dark:border-white/5 `}>
      {children}
    </div>
  );
}
