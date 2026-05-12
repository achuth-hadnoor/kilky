import { ReactNode } from "react";

interface StepContainerProps {
  children: ReactNode;
}

export function StepContainer({ children }: StepContainerProps) {

  return (
    <div className={`flex flex-col h-full pt-5 px-5 flex-1 duration-700 w-screen min-h-0`}>
      {children}
    </div>
  );
}
