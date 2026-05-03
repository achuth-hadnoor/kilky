import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { SoundPackManager } from '../SoundPackManager';
import './Settings.css';

type Tab = 'general' | 'sounds' | 'permissions' | 'about';

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isMac, setIsMac] = useState(false);
  const [volume, setVolume] = useState(50);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Check if running on macOS for permissions tab
    const checkOS = async () => {
      const platform = window.navigator.platform.toLowerCase();
      setIsMac(platform.includes('mac'));
    };
    checkOS();

    // Fetch initial state
    invoke<[boolean, number]>('get_app_state').then(([en, vol]) => {
      setEnabled(en);
      setVolume(Math.round(vol * 100));
    }).catch(console.error);

    // Listen to updates from backend
    const unlisten = listen('state-update', async () => {
      try {
        const [en, vol] = await invoke<[boolean, number]>('get_app_state');
        setEnabled(en);
        setVolume(Math.round(vol * 100));
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="tab-content animate-in">
            <h3>General Settings</h3>
            <div className="settings-group">
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

              <div className="setting-item">
                <div className="setting-info">
                  <label>Master Volume ({volume}%)</label>
                  <p>Adjust the playback volume of all key sounds.</p>
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
                  <label>Launch on Startup</label>
                  <p>Start Stroke automatically when you log in.</p>
                </div>
                <input type="checkbox" className="toggle-switch" />
              </div>
            </div>
          </div>
        );
      case 'sounds':
        return (
          <div className="tab-content animate-in">
            <SoundPackManager />
          </div>
        );
      case 'permissions':
        return (
          <div className="tab-content animate-in">
            <h3>Accessibility Permissions</h3>
            <p>On macOS, Stroke requires accessibility permissions to listen for keyboard events globally.</p>
            <div className="permission-status">
              <div className="status-indicator success"></div>
              <span>Permissions Granted</span>
            </div>
            <button className="btn-secondary">Check Permissions Again</button>
          </div>
        );
      case 'about':
        return (
          <div className="tab-content animate-in about-tab">
            <div className="about-header">
              <div className="app-icon-large">⌨️</div>
              <h2>Stroke</h2>
              <p className="version">Version 1.0.0</p>
            </div>
            <div className="about-details">
              <p>A high-performance mechanical keyboard sound engine built with Rust and Tauri.</p>
              <div className="links">
                <a href="#" target="_blank">Website</a>
                <a href="#" target="_blank">GitHub</a>
                <a href="#" target="_blank">Discord</a>
              </div>
            </div>
            <p className="credits">Created with ❤️ by Antigravity</p>
          </div>
        );
    }
  };

  return (
    <div className="settings-container">
      <aside className="settings-sidebar">
        <div className="sidebar-header">
          <h2>Settings</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activeTab === 'general' ? 'active' : ''}
            onClick={() => setActiveTab('general')}
          >
            <span className="icon">⚙️</span> General
          </button>
          <button
            className={activeTab === 'sounds' ? 'active' : ''}
            onClick={() => setActiveTab('sounds')}
          >
            <span className="icon">🔊</span> Sounds
          </button>
          {isMac && (
            <button
              className={activeTab === 'permissions' ? 'active' : ''}
              onClick={() => setActiveTab('permissions')}
            >
              <span className="icon">🔒</span> Permissions
            </button>
          )}
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
