import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Apple,
  Check,
  ChevronRight,
  Command,
  Download,
  Gauge,
  Keyboard,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import "./Website.css";

type PackId = "zenith" | "obsidian" | "sapphire" | "velvet";

interface Pack {
  id: PackId;
  name: string;
  tone: string;
  color: string;
  frequency: number;
  character: string;
}

const PACKS: Pack[] = [
  {
    id: "zenith",
    name: "Zenith",
    tone: "crisp aluminum",
    color: "#e84d3d",
    frequency: 740,
    character: "bright",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    tone: "deep thock",
    color: "#262626",
    frequency: 180,
    character: "heavy",
  },
  {
    id: "sapphire",
    name: "Sapphire",
    tone: "glassy click",
    color: "#1976d2",
    frequency: 520,
    character: "clean",
  },
  {
    id: "velvet",
    name: "Velvet",
    tone: "soft damped",
    color: "#8f4f3f",
    frequency: 310,
    character: "muted",
  },
];

const KEY_ROWS = [
  ["esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "delete"],
  ["tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "return"],
  ["caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
  ["shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "shift"],
  ["fn", "control", "option", "command", "space", "command", "option"],
];

const SAMPLE_TEXT = "Try typing here. Kliky reacts like the desktop app: spatial keys, pack changes, tray feedback, and private local stats.";

function keyWidth(key: string) {
  if (key === "space") return "keyboard-key keyboard-key--space";
  if (["shift", "delete", "return", "caps"].includes(key)) return "keyboard-key keyboard-key--wide";
  if (["tab", "control", "option", "command"].includes(key)) return "keyboard-key keyboard-key--medium";
  return "keyboard-key";
}

function normalizeKey(value: string) {
  if (value === " ") return "space";
  if (value === "Backspace") return "delete";
  if (value === "Enter") return "return";
  if (value === "Escape") return "esc";
  if (value === "Meta") return "command";
  if (value === "Alt") return "option";
  if (value === "Control") return "control";
  if (value === "Shift") return "shift";
  if (value === "Tab") return "tab";
  if (value.length === 1) return value.toUpperCase();
  return value.toLowerCase();
}

export function Website() {
  const [activePack, setActivePack] = useState<PackId>("zenith");
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(54);
  const [activeKey, setActiveKey] = useState("K");
  const [lastKeys, setLastKeys] = useState<string[]>(["K", "L", "I"]);
  const [typedCount, setTypedCount] = useState(1284);
  const [previewText, setPreviewText] = useState(SAMPLE_TEXT);
  const audioContext = useRef<AudioContext | null>(null);
  const currentPack = useMemo(
    () => PACKS.find((pack) => pack.id === activePack) ?? PACKS[0],
    [activePack],
  );

  const playKey = useCallback(
    (key: string) => {
      if (!enabled) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContext.current) {
        audioContext.current = new AudioContextClass();
      }

      const context = audioContext.current;
      const now = context.currentTime;
      const pan = Math.max(-0.8, Math.min(0.8, (key.charCodeAt(0) % 17) / 10 - 0.8));
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      const intensity = volume / 100;

      oscillator.type = currentPack.id === "obsidian" ? "triangle" : "square";
      oscillator.frequency.setValueAtTime(currentPack.frequency + Math.random() * 80, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035 * intensity, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      panner.pan.setValueAtTime(pan, now);

      oscillator.connect(gain);
      gain.connect(panner);
      panner.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.08);
    },
    [currentPack, enabled, volume],
  );

  const registerKey = useCallback(
    (rawKey: string) => {
      const nextKey = normalizeKey(rawKey);
      setActiveKey(nextKey);
      setLastKeys((keys) => [nextKey, ...keys].slice(0, 5));
      setTypedCount((count) => count + 1);
      playKey(nextKey);
    },
    [playKey],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) return;
      registerKey(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [registerKey]);

  const playPreview = () => {
    "KLIKY".split("").forEach((key, index) => {
      window.setTimeout(() => registerKey(key), index * 90);
    });
  };

  return (
    <main className="site-shell">
      <section className="hero">
        <nav className="site-nav" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="Kliky home">
            <img src="/icon.png" alt="" />
            <span>Kliky</span>
          </a>
          <div className="nav-actions">
            <a href="#experience">Experience</a>
            <a href="#settings">Settings</a>
            <a className="download-link" href="https://github.com/achuth-hadnoor/kilky/releases/latest">
              <Download size={16} />
              Download
            </a>
          </div>
        </nav>

        <div id="top" className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Mechanical sound for your whole desktop</p>
            <h1>Kliky turns every keypress into a tiny instrument.</h1>
            <p className="lede">
              Pick a sound profile, tune the volume, and feel the menubar respond before you install the app.
            </p>
            <div className="hero-actions">
              <button className="primary-action" type="button" onClick={playPreview}>
                <Play size={18} fill="currentColor" />
                Play the Kliky preview
              </button>
              <a className="secondary-action" href="#experience">
                Try typing
                <ChevronRight size={18} />
              </a>
            </div>
          </div>

          <div id="experience" className="desktop-demo" aria-label="Interactive Kliky app preview">
            <div className="mock-menubar">
              <div className="traffic-lights" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="tray-pill">
                <Keyboard size={14} />
                <span>{lastKeys[0]}</span>
              </div>
              <div className="tray-menu">
                <strong>Kliky</strong>
                <span>{enabled ? "Enabled" : "Paused"}</span>
              </div>
            </div>

            <div className="app-preview">
              <div className="preview-sidebar">
                <button className="sidebar-item active" type="button" aria-label="General">
                  <Settings size={18} />
                </button>
                <button className="sidebar-item" type="button" aria-label="Sounds">
                  <Volume2 size={18} />
                </button>
                <button className="sidebar-item" type="button" aria-label="Hotkeys">
                  <Command size={18} />
                </button>
              </div>

              <div className="preview-panel">
                <div className="preview-header">
                  <div>
                    <span className="panel-label">Live settings</span>
                    <h2>Make the website behave like Kliky</h2>
                  </div>
                  <label className="switch">
                    <input checked={enabled} onChange={(event) => setEnabled(event.target.checked)} type="checkbox" />
                    <span />
                  </label>
                </div>

                <div className="pack-grid">
                  {PACKS.map((pack) => (
                    <button
                      className={`pack-card ${pack.id === activePack ? "is-active" : ""}`}
                      key={pack.id}
                      onClick={() => {
                        setActivePack(pack.id);
                        registerKey(pack.name[0]);
                      }}
                      style={{ "--pack-color": pack.color } as React.CSSProperties}
                      type="button"
                    >
                      <span className="pack-swatch" />
                      <strong>{pack.name}</strong>
                      <small>{pack.tone}</small>
                    </button>
                  ))}
                </div>

                <label className="volume-control">
                  <span>
                    <Volume2 size={16} />
                    Volume
                  </span>
                  <input
                    aria-label="Preview volume"
                    max="100"
                    min="0"
                    onChange={(event) => setVolume(Number(event.target.value))}
                    type="range"
                    value={volume}
                  />
                  <b>{volume}%</b>
                </label>

                <textarea
                  aria-label="Typing preview"
                  className="typing-pad"
                  onChange={(event) => setPreviewText(event.target.value)}
                  onKeyDown={(event) => registerKey(event.key)}
                  spellCheck={false}
                  value={previewText}
                />

                <div className="keyboard">
                  {KEY_ROWS.map((row, rowIndex) => (
                    <div className="keyboard-row" key={rowIndex}>
                      {row.map((key, keyIndex) => (
                        <button
                          className={`${keyWidth(key)} ${activeKey.toLowerCase() === key.toLowerCase() ? "is-pressed" : ""}`}
                          key={`${key}-${keyIndex}`}
                          onClick={() => registerKey(key)}
                          type="button"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="settings" className="feature-band">
        <div className="section-heading">
          <p className="eyebrow">Same product story, before download</p>
          <h2>The site now previews the parts users actually meet in the app.</h2>
        </div>

        <div className="feature-grid">
          <article>
            <ShieldCheck />
            <h3>Permission-first onboarding</h3>
            <p>Visitors see why accessibility access exists before macOS asks for it.</p>
          </article>
          <article>
            <Sparkles />
            <h3>Sound packs with character</h3>
            <p>Pack choices change the live preview, so the download decision is sensory.</p>
          </article>
          <article>
            <Activity />
            <h3>Private local analytics</h3>
            <p>A daily count is shown as local state, matching Kliky's SQLite-backed habit tracking.</p>
          </article>
          <article>
            <Gauge />
            <h3>Tray utility behavior</h3>
            <p>The menubar readout makes the app feel like a desktop companion, not a web widget.</p>
          </article>
        </div>

        <div className="download-panel">
          <div>
            <span className="panel-label">Today in preview</span>
            <strong>{typedCount.toLocaleString()} keystrokes</strong>
            <p>{currentPack.name} is active with a {currentPack.character} profile.</p>
          </div>
          <a className="primary-action" href="https://github.com/achuth-hadnoor/kilky/releases/latest">
            <Apple size={18} />
            Download for desktop
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <span>Kliky</span>
        <span>System-wide typing sound for macOS and Windows.</span>
        <span className="footer-check">
          <Check size={14} />
          Browser preview uses local audio only
        </span>
      </footer>
    </main>
  );
}
