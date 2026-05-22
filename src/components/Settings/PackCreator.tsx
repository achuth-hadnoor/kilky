import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { Howl } from 'howler';
import './PackCreator.css';

interface KeySettings {
  pitch: number;
  volume: number;
}

interface PackConfig {
  name: string;
  description: string;
  sounds: Record<string, string>;
  settings: Record<string, KeySettings>;
}

export function PackCreator() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sounds, setSounds] = useState<Record<string, string>>({
    'Default': '',
    'Space': '',
    'Enter': '',
    'Backspace': '',
  });
  const [settings, setSettings] = useState<Record<string, KeySettings>>({
    'Default': { pitch: 1.0, volume: 1.0 },
    'Space': { pitch: 1.0, volume: 1.0 },
    'Enter': { pitch: 1.0, volume: 1.0 },
    'Backspace': { pitch: 1.0, volume: 1.0 },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fill with sample pack by default
    const initFromSample = async () => {
      try {
        const [basePath, config] = await invoke<[string, PackConfig]>('get_sample_pack_info');
        setName(`${config.name} (Custom)`);
        setDescription(`Tweaked version of ${config.name}`);
        
        const absoluteSounds: Record<string, string> = {};
        Object.entries(config.sounds).forEach(([key, file]) => {
          absoluteSounds[key] = `${basePath}/${file}`;
        });
        
        // Merge with existing keys (like Backspace which might be missing in sample)
        setSounds(prev => ({ ...prev, ...absoluteSounds }));
      } catch (err) {
        console.warn('Failed to load sample pack as default:', err);
      }
    };
    initFromSample();
  }, []);

  const handlePickFile = async (key: string) => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Audio', extensions: ['wav', 'mp3', 'ogg'] }]
      });

      if (selected && !Array.isArray(selected)) {
        setSounds(prev => ({ ...prev, [key]: selected }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettingChange = (key: string, field: 'pitch' | 'volume', value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const previewSound = (key: string) => {
    const filePath = sounds[key];
    if (!filePath) return;

    const { pitch, volume } = settings[key];
    const assetUrl = convertFileSrc(filePath);
    
    const sound = new Howl({
      src: [assetUrl],
      format: ['wav', 'mp3', 'ogg'],
      rate: pitch,
      volume: volume * 0.5,
      html5: true
    });
    
    sound.play();
  };

  const handleCreate = async () => {
    if (!name || !sounds['Default']) {
      setError('Name and Default sound are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const savePath = await open({
        directory: true,
        multiple: false,
        title: 'Select Destination Folder'
      });

      if (!savePath || Array.isArray(savePath)) return;

      await invoke('create_custom_pack', {
        dest: savePath,
        config: {
          name,
          description,
          sounds,
          settings
        }
      });

      setSuccess(`Pack "${name}" created successfully!`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pack-creator settings-card">
      <div className="creator-header">
        <div className="setting-info">
          <label>Pack Identity & Audio Tweaks</label>
          <p>Tweak the default kliky sounds or upload your own files.</p>
        </div>
      </div>

      <div className="creator-form">
        <div className="form-group">
          <input 
            type="text" 
            placeholder="Pack Name (e.g. Marble Linear)" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-premium"
          />
          <input 
            type="text" 
            placeholder="Short Description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-premium"
          />
        </div>

        <div className="key-mappings">
          <label className="section-label">Key Tweaks & Mappings</label>
          <div className="mapping-stack">
            {Object.keys(sounds).map(key => (
              <div key={key} className="mapping-card">
                <div className="mapping-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="key-tag">{key}</span>
                    {sounds[key] && (
                      <button 
                        className="btn-preview-mini"
                        onClick={() => previewSound(key)}
                        title="Preview sound"
                      >
                        ▶️
                      </button>
                    )}
                  </div>
                  <button 
                    className="btn-file-pick"
                    onClick={() => handlePickFile(key)}
                  >
                    {sounds[key] ? sounds[key].split(/[/\\]/).pop() : 'Select File...'}
                  </button>
                </div>
                <div className="mapping-controls">
                  <div className="control-item">
                    <span>Pitch: {settings[key].pitch.toFixed(2)}x</span>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.05"
                      value={settings[key].pitch}
                      onChange={(e) => handleSettingChange(key, 'pitch', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="control-item">
                    <span>Vol: {(settings[key].volume * 100).toFixed(0)}%</span>
                    <input 
                      type="range" min="0.1" max="2.0" step="0.1"
                      value={settings[key].volume}
                      onChange={(e) => handleSettingChange(key, 'volume', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="status-msg error">{error}</div>}
        {success && <div className="status-msg success">{success}</div>}

        <button 
          className="btn-premium create-btn" 
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Generating Pack...' : 'Generate & Export Pack'}
        </button>
      </div>
    </div>
  );
}
