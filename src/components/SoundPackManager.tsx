import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Howl } from 'howler';

interface PackConfig {
  name: string;
  description?: string;
  sounds: Record<string, string>;
}

export function SoundPackManager() {
  const [currentPack, setCurrentPack] = useState<PackConfig | null>(null);
  const [basePath, setBasePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPack = async () => {
    try {
      setLoading(true);
      setError(null);

      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Sound Pack Folder',
      });

      if (!selected || Array.isArray(selected)) return;

      const config = await invoke<PackConfig>('load_sound_pack', { path: selected });
      setCurrentPack(config);
      setBasePath(selected);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const previewSound = (filename: string) => {
    if (!basePath) return;

    const assetUrl = convertFileSrc(`${basePath}/${filename}`);
    const sound = new Howl({
      src: [assetUrl],
      format: ['wav', 'mp3', 'ogg'],
      volume: 0.5,
      html5: true // Needed for large files or cross-origin issues
    });

    sound.play();
  };

  return (
    <div className="sound-pack-manager">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h5>Custom Packs</h5>
        <button
          onClick={handleSelectPack}
          disabled={loading}
          className="btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          {loading ? 'Loading...' : '+ Add Pack'}
        </button>
      </div>

      {error && <p className="error-message" style={{ color: '#ff4081', fontSize: '0.8rem', marginBottom: '12px' }}>{error}</p>}

      {currentPack ? (
        <div className="settings-card animate-in">
          <div className="setting-item" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="setting-info">
              <label>{currentPack.name}</label>
              <p>{currentPack.description || 'Custom mechanical keyboard sound pack.'}</p>
            </div>
            <div className="version-badge" style={{ margin: 0 }}>ACTIVE</div>
          </div>

          <div className="sound-list" style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {Object.entries(currentPack.sounds).map(([key, file]) => (
              <div
                key={key}
                className="sound-item"
                onClick={() => previewSound(file)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{key}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="settings-card" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>No custom pack loaded. Using default system sounds.</p>
        </div>
      )}
    </div>
  );
}
