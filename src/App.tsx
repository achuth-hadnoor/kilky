import "./App.css";

function App() {
  return (
    <main className="container">
      <div className="status-card">
        <h1 className="title">Stroke</h1>
        <p className="subtitle">Mechanical keyboard sounds, globally.</p>

        <div className="info-box">
          <p>Stroke is active and running in your <strong>System Tray</strong>.</p>
          <p className="warning">
            Note: If sounds are not playing, please ensure <strong>Accessibility Permissions</strong> are granted in System Settings {'>'} Privacy & Security.
          </p>
        </div>

        <div className="actions">
          <p className="hint">You can close this window; the app will keep running in the tray.</p>
        </div>
      </div>
    </main>
  );
}

export default App;
