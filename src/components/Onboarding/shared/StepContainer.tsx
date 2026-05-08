import { ReactNode } from "react";

interface StepContainerProps {
  children: ReactNode;
  animation?: "slide-up" | "slide-right";
}

export function StepContainer({ children, animation = "slide-up" }: StepContainerProps) {
  const animationClass = animation === "slide-up"
    ? "animate-in fade-in slide-in-from-bottom-5"
    : "animate-in fade-in slide-in-from-right-5";

  return (
    <div className={`space-y-8 flex flex-col justify-between p-10 flex-1 ${animationClass} duration-700 overflow-y-auto w-screen`}>
      {children}
    </div>
  );
}
