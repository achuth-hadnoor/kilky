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
      <div className="header">
        <h2>Sound Packs</h2>
        <button 
          onClick={handleSelectPack} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Loading...' : 'Load Custom Pack'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {currentPack ? (
        <div className="pack-details animate-in">
          <div className="pack-info">
            <span className="pack-name">{currentPack.name}</span>
            {currentPack.description && <p className="pack-desc">{currentPack.description}</p>}
          </div>
          
          <div className="sound-list">
            {Object.entries(currentPack.sounds).map(([key, file]) => (
              <div key={key} className="sound-item" onClick={() => previewSound(file)}>
                <span className="key-label">{key}</span>
                <span className="file-name">{file}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>No custom pack loaded. Using default system sounds.</p>
        </div>
      )}
    </div>
  );
}
