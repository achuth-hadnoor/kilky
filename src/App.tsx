import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";
import { Settings } from "./components/Settings/Settings";
import { Onboarding } from "./components/Onboarding/Onboarding";

function App() {
  const [windowLabel] = useState<string>(() => getCurrentWindow().label);

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
