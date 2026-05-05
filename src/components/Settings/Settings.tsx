import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { SoundPackManager } from '../SoundPackManager';
import { PackCreator } from './PackCreator';
import './Settings.css';

type Tab = 'general' | 'audio' | 'shortcuts' | 'advanced' | 'about';

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [volume, setVolume] = useState(50);
  const [enabled, setEnabled] = useState(true);
  const [autoLaunch, setAutoLaunch] = useState(false);

  useEffect(() => {

    // Fetch initial state
    invoke<[boolean, number]>('get_app_state').then(([en, vol]) => {
      setEnabled(en);
      setVolume(Math.round(vol * 100));
    }).catch(console.error);

    // Fetch autostart status
    invoke<boolean>('is_autostart_enabled').then(setAutoLaunch).catch(console.error);

    const unlisten = listen('state-update', async () => {
      try {
        const [en, vol] = await invoke<[boolean, number]>('get_app_state');
        setEnabled(en);
        setVolume(Math.round(vol * 100));

        // Also refresh autostart
        const auto = await invoke<boolean>('is_autostart_enabled');
        setAutoLaunch(auto);
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);


  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    await invoke('set_volume', { volume: val / 100.0 });
  };

  const handleEnabledChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setEnabled(val);
    await invoke('set_enabled', { enabled: val });
  };

  const handleAutoLaunchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoLaunch(val);
    await invoke('set_autostart_enabled', { enabled: val });
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="tab-content animate-in">
            <h3>General</h3>
            <p className="tab-description">Configure how kliky behaves on your system.</p>

            <div className="settings-section">
              <h4>Power</h4>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Enable Keyboard Sounds</label>
                    <p>Toggle the sound engine on or off globally.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={handleEnabledChange}
                    className="toggle-switch"
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4>System</h4>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Launch on Startup</label>
                    <p>Start kliky automatically when you log in.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoLaunch}
                    onChange={handleAutoLaunchChange}
                    className="toggle-switch"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="tab-content animate-in">
            <h3>Audio</h3>
            <p className="tab-description">Fine-tune your acoustic experience.</p>

            <div className="settings-section">
              <h4>Playback</h4>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Master Volume ({volume}%)</label>
                    <p>Global volume for all mechanical sound effects.</p>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Output Device</label>
                    <p>Select which device to play sounds through.</p>
                  </div>
                  <select className="select-custom">
                    <option>System Default</option>
                    <option>MacBook Pro Speakers</option>
                    <option>External Headphones</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4>Active Sound Engine</h4>
              <SoundPackManager />
            </div>

            <div className="settings-section">
              <h4>Create Custom Pack</h4>
              <PackCreator />
            </div>
          </div>
        );
      case 'shortcuts':
        return (
          <div className="tab-content animate-in">
            <h3>Shortcuts</h3>
            <p className="tab-description">Control kliky with global keyboard hotkeys.</p>

            <div className="settings-section">
              <h4>Global Keys</h4>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Toggle Sounds</label>
                    <p>Quickly enable or disable all sounds.</p>
                  </div>
                  <button className="btn-outline">⌘ ⇧ K</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Volume Up</label>
                    <p>Increase sound volume.</p>
                  </div>
                  <button className="btn-outline">⌘ ⇧ =</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Volume Down</label>
                    <p>Decrease sound volume.</p>
                  </div>
                  <button className="btn-outline">⌘ ⇧ -</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'advanced':
        return (
          <div className="tab-content animate-in">
            <h3>Advanced</h3>
            <p className="tab-description">Power user settings and experimental features.</p>

            <div className="settings-section">
              <h4>Performance</h4>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Low Latency Mode</label>
                    <p>Reduces audio lag at the cost of higher CPU usage.</p>
                  </div>
                  <input type="checkbox" className="toggle-switch" defaultChecked />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Buffer Size</label>
                    <p>Smaller buffers provide faster response times.</p>
                  </div>
                  <select className="select-custom">
                    <option>64 samples (Fastest)</option>
                    <option>128 samples (Balanced)</option>
                    <option>256 samples (Stable)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4>Permissions</h4>
              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Accessibility Access</label>
                    <p>Required to listen for keys globally.</p>
                  </div>
                  <div className="permission-status-chip" style={{ color: '#34c759', fontSize: '0.8rem', fontWeight: 600 }}>
                    GRANTED
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Reset Permissions</label>
                    <p>Revoke and re-request system access.</p>
                  </div>
                  <button className="btn-outline">Reset Access</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="tab-content animate-in about-tab">
            <div className="app-logo-container">⌨️</div>
            <h3>kliky</h3>
            <div className="version-badge">Version 1.2.0 (Stable)</div>

            <div className="tab-description" style={{ maxWidth: '400px', margin: '0 auto 32px' }}>
              A high-performance mechanical keyboard sound engine built with Rust and Tauri.
              Designed for enthusiasts who crave that tactile acoustic feedback everywhere.
            </div>

            <div className="about-links">
              <button className="btn-premium">Check for Updates</button>
              <button className="btn-outline">View GitHub</button>
            </div>

            <div className="credits-footer">
              <p>Handcrafted with ❤️ by Achuth</p>
              <p>© 2026 Kliky Lab. All rights reserved.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="settings-container">
      <aside className="settings-sidebar">
        <div className="sidebar-header">
          <h2>kliky</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activeTab === 'general' ? 'active' : ''}
            onClick={() => setActiveTab('general')}
          >
            <span className="icon">⚙️</span> General
          </button>
          <button
            className={activeTab === 'audio' ? 'active' : ''}
            onClick={() => setActiveTab('audio')}
          >
            <span className="icon">🔊</span> Audio
          </button>
          <button
            className={activeTab === 'shortcuts' ? 'active' : ''}
            onClick={() => setActiveTab('shortcuts')}
          >
            <span className="icon">⌨️</span> Shortcuts
          </button>
          <button
            className={activeTab === 'advanced' ? 'active' : ''}
            onClick={() => setActiveTab('advanced')}
          >
            <span className="icon">🛠️</span> Advanced
          </button>
          <div style={{ flex: 1 }} />
          <button
            className={activeTab === 'about' ? 'active' : ''}
            onClick={() => setActiveTab('about')}
          >
            <span className="icon">ℹ️</span> About
          </button>
        </nav>
      </aside>
      <main className="settings-main">
        {renderTabContent()}
      </main>
    </div>
  );
}
