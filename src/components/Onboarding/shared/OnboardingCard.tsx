import { ReactNode } from "react";

interface OnboardingCardProps {
  children: ReactNode;
  className?: string;
}

export function OnboardingCard({ children, className = "" }: OnboardingCardProps) {
  return (
    <div className={`px-2 py-2 bg-white/5 rounded-xl border border-white/5 ${className}`}>
      {children}
    </div>
  );
}
