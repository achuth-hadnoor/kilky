import { Sparkles, Zap, Keyboard, Volume2 } from "lucide-react";
import { StepContainer } from "../shared/StepContainer";
import { OnboardingCard } from "../shared/OnboardingCard";

export function WelcomeStep() {
  const features = [
    {
      icon: <Volume2 className="w-5 h-5 text-indigo-500" />,
      title: "Rich Typing Sound Profiles",
      description: "Choose from vintage typewriters, crisp mechanical switches, bubbles, and more."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: "Near-Zero Latency",
      description: "High-performance native audio engine optimized for seamless, real-time typing feedback."
    },
    {
      icon: <Keyboard className="w-5 h-5 text-emerald-500" />,
      title: "System-Wide Caps Lock Hyper Key",
      description: "Transform your Caps Lock key into a supercharged global hotkey modifier."
    }
  ];

  return (
    <StepContainer>
      <div className="flex flex-col items-center text-center space-y-6 flex-1 justify-center py-2 max-w-sm mx-auto">
        {/* Animated glowing app emblem */}
        <div className="relative group mt-2">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <div className="relative w-20 h-20  dark:bg-neutral-950 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
            <img src="/icon.png" alt="Kliky Logo" className="w-16 h-16 object-cover rounded-xl" onError={(e) => {
              // Fallback if icon.png isn't there
              e.currentTarget.style.display = 'none';
            }} />
            <Sparkles className="w-10 h-10 text-indigo-400 absolute animate-bounce" style={{ display: 'none' }} id="logo-fallback" />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r dark:from-white from-neutral-700 dark:via-neutral-200 via-neutral-600 dark:to-neutral-700 to-neutral-950 bg-clip-text text-transparent">
            Welcome to Kliky
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
            Elevate your typing experience with tactile, beautifully crafted audio feedback for every single keystroke.
          </p>
        </div>

        {/* Value Proposition features */}
        <div className="w-full space-y-3 mt-4">
          {features.map((feature, idx) => (
            <OnboardingCard
              key={idx}
              className="flex items-start gap-3.5 p-4 dark:bg-neutral-900/40 bg-neutral-400/20 border-neutral-800/80 dark:hover:bg-neutral-900/60 hover:bg-neutral-300/60 transition-all duration-300 rounded-2xl text-left"
            >
              <div className="p-2 rounded-xl dark:bg-white/5 bg-white/25 border border-white/5 shrink-0">
                {feature.icon}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold dark:text-white tracking-wide">
                  {feature.title}
                </h4>
                <p className="text-[10.5px] text-neutral-500 leading-snug">
                  {feature.description}
                </p>
              </div>
            </OnboardingCard>
          ))}
        </div>
      </div>
    </StepContainer>
  );
}
