import { ReactNode } from "react";

interface StepContainerProps {
  children: ReactNode;
}

export function StepContainer({ children }: StepContainerProps) {

  return (
    <div className={`space-y-8 flex flex-col justify-between py-10 px-5 flex-1  duration-700 overflow-y-auto w-screen`}>
      {children}
    </div>
  );
}
