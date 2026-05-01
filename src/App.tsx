import "./App.css";
import { SoundPackManager } from "./components/SoundPackManager";

function App() {
  return (
    <main className="container">
      <div className="status-card">
        <h1 className="title">Stroke</h1>
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
