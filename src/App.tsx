import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Settings } from "./components/Settings/Settings";
import { Onboarding } from "./components/Onboarding/Onboarding";
import { Playground } from "./components/Playground/Playground";
import { getIsActivated, getTrialInfo } from "./lib/license";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

function App() {
  const [windowLabel] = useState<string>(() => {
    if (!window.__TAURI_INTERNALS__) {
      return "website";
    }
    return getCurrentWindow().label;
  });

  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    async function checkLicense() {
      const isActivated = await getIsActivated();
      if (isActivated) {
        setIsReady(true);
        return;
      }

      const trialInfo = await getTrialInfo();
      if (trialInfo.isTrialStarted && !trialInfo.isTrialActive) {
        setIsLocked(true);
        // Call Rust to hide tray and show dock if locked
        invoke("handle_trial_expired").catch(console.error);
      }
      setIsReady(true);
    }
    checkLicense();
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
      </div>
    );
  }

  if (isLocked) {
    return <Onboarding initialStep={2} forceLicense={true} />;
  }

  if (windowLabel === "playground") {
    return <Playground />;
  }

  if (windowLabel === "settings") {
    return <Settings />;
  }

  if (windowLabel === "onboarding") {
    return <Onboarding />;
  }

  return <Onboarding />;
}

export default App;
