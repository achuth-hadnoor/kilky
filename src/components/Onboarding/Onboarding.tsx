import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Button } from '@/components/ui/button';

import { AppState, Shortcut } from '../../types';
import { useShortcutRecorder } from '../../hooks/useShortcutRecorder';
import { SoundSelectionStep } from './steps/SoundSelectionStep';
import { PermissionsStep } from './steps/PermissionsStep';
import { LaunchSettingsStep } from './steps/LaunchSettingsStep';

const TOTAL_STEPS = 3;

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [enabled, setEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [activePack, setActivePack] = useState('Zenith');
  const [previewingPack, setPreviewingPack] = useState<string | null>(null);
  const [isAutostart, setIsAutostart] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const [audioDevices, setAudioDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [shortcuts, setShortcuts] = useState<Record<string, Shortcut>>({});
  const [hyperKeyEnabled, setHyperKeyEnabled] = useState(true);
  const [platformName, setPlatformName] = useState('macos');

  const recorder = useShortcutRecorder(shortcuts, setShortcuts, hyperKeyEnabled, platformName);

  // ----- Data fetching ---------------------------------------------------

  const fetchState = async () => {
    try {
      const [trusted, autostart, devices, state, platform] = await Promise.all([
        invoke<boolean>('check_permissions'),
        invoke<boolean>('is_autostart_enabled'),
        invoke<string[]>('get_audio_devices'),
        invoke<AppState>('get_app_state'),
        invoke<string>('get_platform'),
      ]);

      setHasPermission(trusted);
      setIsAutostart(autostart);
      setAudioDevices(devices);
      setActivePack(state.active_pack_type);
      setVolume(state.volume);
      setEnabled(state.enabled);
      setSelectedDevice(state.audio_device ?? '');
      setShortcuts(state.shortcuts);
      setHyperKeyEnabled(state.hyper_key_enabled);
      setPlatformName(platform);
    } catch (err) {
      console.error('[Onboarding] fetchState failed:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchState();

    let lastTrusted = false;
    const interval = setInterval(async () => {
      const trusted = await invoke<boolean>('check_permissions');
      setHasPermission(trusted);
      if (trusted && !lastTrusted) {
        await invoke('start_keyboard_listener');
      }
      lastTrusted = trusted;
    }, 1000);

    return () => {
      clearInterval(interval);
      invoke('stop_pack_preview');
    };
  }, []);

  // Stop audio preview whenever the user moves between steps
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewingPack(null);
    invoke('stop_pack_preview');
  }, [step]);

  // ----- Handlers --------------------------------------------------------

  const handlePackChange = async (pack: string) => {
    setActivePack(pack);
    await invoke('set_sound_pack', { packType: pack });
  };

  const handlePlayPreview = async (e: React.MouseEvent, pack: string) => {
    e.stopPropagation();
    if (previewingPack === pack) {
      setPreviewingPack(null);
      await invoke('stop_pack_preview');
    } else {
      setPreviewingPack(pack);
      await invoke('play_pack_preview', { packType: pack });
    }
  };

  const handleVolumeUpdate = async (val: number[]) => {
    const v = val[0];
    setVolume(v);
    await invoke('set_volume', { volume: v });
  };

  const handleDeviceChange = async (deviceName: string) => {
    setSelectedDevice(deviceName);
    await invoke('set_audio_device', { deviceName });
  };

  const handleAutoLaunchChange = async (checked: boolean) => {
    setIsAutostart(checked);
    await invoke('set_autostart_enabled', { enabled: checked });
  };

  const requestPermission = async () => {
    await invoke('request_permissions');
    await invoke('start_keyboard_listener');
  };

  const enableKliky = async () => {
    const next = !enabled;
    setEnabled(next);
    await invoke('set_enabled', { enabled: next });
  };

  const finish = async () => {
    await invoke('complete_onboarding');
    const win = getCurrentWebviewWindow();
    await win.close();
  };

  // ----- Render ----------------------------------------------------------

  return (
    <div
      className="w-screen h-screen flex flex-col py-4 text-white font-sans overflow-hidden select-none"
      data-tauri-drag-region
    >
      <div
        className="w-full max-w-md flex flex-col relative items-center justify-between mx-auto flex-1 h-full"
        data-tauri-drag-region
      >
        {step === 1 && (
          <SoundSelectionStep
            enabled={enabled}
            enableKliky={enableKliky}
            activePack={activePack}
            previewingPack={previewingPack}
            volume={volume}
            onPackChange={handlePackChange}
            onPlayPreview={handlePlayPreview}
            onVolumeUpdate={handleVolumeUpdate}
            hasPermission={hasPermission}
            onRequestPermission={requestPermission}
            platformName={platformName}
          />
        )}

        {step === 2 && (
          <PermissionsStep
            audioDevices={audioDevices}
            selectedDevice={selectedDevice}
            onDeviceChange={handleDeviceChange}
          />
        )}

        {step === 3 && (
          <LaunchSettingsStep
            isAutostart={isAutostart}
            onAutoLaunchChange={handleAutoLaunchChange}
            shortcuts={shortcuts}
            recordingAction={recorder.recordingAction}
            previewShortcut={recorder.previewShortcut}
            onRecord={(action, next) => {
              recorder.setRecordingAction(next ? action : null);
              recorder.setPreviewShortcut(null);
              recorder.setBackendRecording(next);
            }}
            onClear={recorder.handleClearShortcut}
            hyperKeyEnabled={hyperKeyEnabled}
          />
        )}

        {/* Footer: back / progress dots / next-finish */}
        <div className="w-full flex items-center justify-between mt-auto pt-6 pb-2 px-2">
          {/* Back */}
          <div className="w-24">
            {step > 1 && (
              <Button
                variant="ghost"
                className="rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white px-6 h-12"
                onClick={() => setStep(s => s - 1)}
              >
                <span className="text-sm font-medium">Back</span>
              </Button>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full duration-300 ${
                  step === s ? 'w-8 bg-black dark:bg-white' : 'w-2 bg-black/10 dark:bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Next / Finish */}
          <div className="w-24 flex justify-end">
            {step < TOTAL_STEPS ? (
              <Button
                className="px-6 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !hasPermission}
              >
                {step === TOTAL_STEPS - 1 ? 'Next' : 'Continue'}
              </Button>
            ) : (
              <Button
                className="px-6 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity"
                onClick={finish}
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}