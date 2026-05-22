import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";
import { Settings } from "./components/Settings/Settings";
import { Onboarding } from "./components/Onboarding/Onboarding";
import { Playground } from "./components/Playground/Playground";

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

  if (windowLabel === "playground") {
    return <Playground />;
  }


  if (windowLabel === "settings") {
    return <Settings />;
  }

  if (windowLabel === "onboarding") {
    return <Onboarding />;
  }

  return (
    <Onboarding />
  );
}

export default App;
