import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { message, ask } from '@tauri-apps/plugin-dialog';
import { Settings as SettingsIcon, Volume2, Keyboard, Info, Rocket } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shortcut } from "../shared/utils";

import { Sidebar } from './sections/Sidebar';
import { GeneralSection } from './sections/GeneralSection';
import { AudioSection } from './sections/AudioSection';
import { HotkeysSection } from './sections/HotkeysSection';
import { AdvancedSection } from './sections/AdvancedSection';
import { AboutSection } from './sections/AboutSection';

import './Settings.css';

interface AppState {
  enabled: boolean;
  volume: number;
  active_pack_type: string;
  audio_device: string | null;
  shortcuts: Record<string, Shortcut>;
  hyper_key_enabled: boolean;
  buffer_size: number;
  hardware_acceleration: boolean;
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [volume, setVolume] = useState(0.1);
  const [enabled, setEnabled] = useState(true);
  const [isAutostart, setIsAutostart] = useState(false);
  const [activePack, setActivePack] = useState('Zenith');
  const [previewingPack, setPreviewingPack] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('0.0.0');
  const [audioDevices, setAudioDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [hyperKeyEnabled, setHyperKeyEnabled] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<string, Shortcut>>({});
  const [recordingAction, setRecordingAction] = useState<string | null>(null);
  const [previewShortcut, setPreviewShortcut] = useState<string | null>(null);
  const [platformName, setPlatformName] = useState<string>('macos');
  const [bufferSize, setBufferSize] = useState(128);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);

  const recordingActionRef = useRef<string | null>(null);

  async function fetchState() {
    try {
      const state = await invoke<AppState>('get_app_state');
      setVolume(state.volume);
      setEnabled(state.enabled);
      setActivePack(state.active_pack_type);
      setSelectedDevice(state.audio_device || '');
      setHyperKeyEnabled(state.hyper_key_enabled);
      setShortcuts(state.shortcuts);

      const autostart = await invoke<boolean>('is_autostart_enabled');
      setIsAutostart(autostart);

      setBufferSize(state.buffer_size);
      setHardwareAcceleration(state.hardware_acceleration);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchDevices() {
    try {
      const devices: string[] = await invoke('get_audio_devices');
      setAudioDevices(devices);
    } catch (e) {
      console.error(e);
    }
  }

  async function setBackendRecording(recording: boolean) {
    await invoke('set_recording_status', { recording });
  }

  useEffect(() => {
    recordingActionRef.current = recordingAction;
  }, [recordingAction]);

  useEffect(() => {
    const init = async () => {
      await fetchState();
      await fetchDevices();
      const version = await getVersion();
      setAppVersion(version);
      const p = await invoke<string>('get_platform');
      setPlatformName(p);
    };
    init();
    const unlisten = listen('state-update', () => {
      fetchState();
    });

    const unlistenRawKey = listen<{ code: number, flags: number }>('raw-key-event', (event) => {
      const currentAction = recordingActionRef.current;
      if (currentAction) {
        setPreviewShortcut(`${event.payload.code}-${event.payload.flags}`);
      }
    });

    return () => {
      unlisten.then(f => f());
      unlistenRawKey.then(f => f());
    };
  }, []);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    await invoke('set_enabled', { enabled: checked });
  };

  const handleAutoLaunchChange = async (checked: boolean) => {
    setIsAutostart(checked);
    await invoke('set_autostart_enabled', { enabled: checked });
  };

  const handleVolumeUpdate = async (vol: number[]) => {
    const v = vol[0];
    setVolume(v);
    await invoke('set_volume', { volume: v });
  };

  const handlePackChange = async (packType: string) => {
    setActivePack(packType);
    await invoke('set_sound_pack', { packType });
  };

  const handlePlayPreview = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPreviewingPack(id);
    await invoke('play_pack_preview', { packType: id });
  };

  const handleDeviceChange = async (deviceName: string) => {
    setSelectedDevice(deviceName);
    await invoke('set_audio_device', { deviceName });
  };

  const handleClearShortcut = async (action: string) => {
    const newShortcuts = { ...shortcuts };
    delete newShortcuts[action];
    setShortcuts(newShortcuts);
    await invoke('save_shortcut', { action, shortcut: null });
  };

  const handleBufferSizeChange = async (size: number) => {
    setBufferSize(size);
    await invoke('set_buffer_size', { bufferSize: size });
  };

  const handleHardwareAccelerationToggle = async (enabled: boolean) => {
    setHardwareAcceleration(enabled);
    await invoke('set_hardware_acceleration', { enabled });
  };

  const handleResetSettings = async () => {
    await invoke('reset_settings');
    await fetchState();
  };

  const handleCheckUpdates = async () => {
    try {
      const update = await check();
      if (update) {
        const yes = await ask(
          `Update to ${update.version} is available!\n\n${update.body || 'No release notes provided.'}\n\nWould you like to install it now?`,
          { title: 'Update Available', kind: 'info' }
        );
        if (yes) {
          await update.downloadAndInstall();
          await relaunch();
        }
      } else {
        await message('You are running the latest version of Kliky.', { title: 'Up to Date', kind: 'info' });
      }
    } catch (e) {
      console.error(e);
      await message('Failed to check for updates. Please check your internet connection.', { title: 'Update Error', kind: 'error' });
    }
  };

  const navItems = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'audio', label: 'Sounds', icon: Volume2 },
    { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
    { id: 'advanced', label: 'Advanced', icon: Rocket },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="flex h-screen w-screen bg-transparent overflow-hidden p-2 gap-4 text-black dark:text-white duration-500 font-sans" data-tauri-drag-region="true">
      <Sidebar 
        navItems={navItems} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className="flex-1 h-full bg-white/5 dark:bg-black/10 backdrop-blur-md rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden flex flex-col min-h-0">
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500 select-none">
            {activeTab === 'general' && (
              <GeneralSection 
                enabled={enabled}
                handleToggle={handleToggle}
                isAutostart={isAutostart}
                handleAutoLaunchChange={handleAutoLaunchChange}
                selectedDevice={selectedDevice}
                handleDeviceChange={handleDeviceChange}
                audioDevices={audioDevices}
              />
            )}

            {activeTab === 'audio' && (
              <AudioSection 
                volume={volume}
                handleVolumeUpdate={handleVolumeUpdate}
                activePack={activePack}
                previewingPack={previewingPack}
                handlePackChange={handlePackChange}
                handlePlayPreview={handlePlayPreview}
              />
            )}

            {activeTab === 'hotkeys' && (
              <HotkeysSection 
                recordingAction={recordingAction}
                shortcuts={shortcuts}
                previewShortcut={previewShortcut}
                setRecordingAction={setRecordingAction}
                setPreviewShortcut={setPreviewShortcut}
                setBackendRecording={setBackendRecording}
                handleClearShortcut={handleClearShortcut}
                hyperKeyEnabled={hyperKeyEnabled}
              />
            )}

            {activeTab === 'advanced' && (
              <AdvancedSection 
                bufferSize={bufferSize}
                handleBufferSizeChange={handleBufferSizeChange}
                hardwareAcceleration={hardwareAcceleration}
                handleHardwareAccelerationToggle={handleHardwareAccelerationToggle}
                handleResetSettings={handleResetSettings}
              />
            )}

            {activeTab === 'about' && (
              <AboutSection 
                appVersion={appVersion}
                platformName={platformName}
                handleCheckUpdates={handleCheckUpdates}
              />
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex justify-between items-center px-8">
          <span className="text-[10px] text-black/20 dark:text-white/20 font-medium uppercase tracking-[0.2em]">Build {appVersion} - Premium</span>
          <div className="flex gap-4">
            <span className="text-[10px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white cursor-pointer">Documentation</span>
            <span className="text-[10px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white cursor-pointer">Support</span>
          </div>
        </div>
      </main>
    </div>
  );
}
