import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";
import { SoundPackManager } from "./components/SoundPackManager";
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
    <main className="container">
      <div className="status-card">
        <h1 className="title">kliky</h1>
        <p className="subtitle">Mechanical keyboard sounds, globally.</p>

        <SoundPackManager />

        <div className="actions">
          <p className="hint">The app runs in your <strong>System Tray</strong>.</p>
        </div>
      </div>
    </main>
  );
}

export default App;
