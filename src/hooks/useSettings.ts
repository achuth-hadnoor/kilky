/**
 * useSettings
 *
 * Manages all application settings state and backend communication for the
 * Settings window. Subscribes to the `state-update` Tauri event so the UI
 * stays in sync with tray menu changes.
 */
import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';
import { Shortcut, AppState } from '../types';

export function useSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(0.1);
  const [enabled, setEnabled] = useState(true);
  const [isAutostart, setIsAutostart] = useState(false);
  const [activePack, setActivePack] = useState('Zenith');
  const [previewingPack, setPreviewingPack] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('0.0.0');
  const [audioDevices, setAudioDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [hyperKeyEnabled, setHyperKeyEnabled] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<string, Shortcut>>({});
  const [platformName, setPlatformName] = useState('macos');
  const [bufferSize, setBufferSize] = useState(128);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [speedVolumeScaling, setSpeedVolumeScaling] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [showKeyInTray, setShowKeyInTray] = useState(true);

  // Stable reference — won't change between renders
  const fetchState = useCallback(async () => {
    try {
      const [state, autostart, trusted] = await Promise.all([
        invoke<AppState>('get_app_state'),
        invoke<boolean>('is_autostart_enabled'),
        invoke<boolean>('check_permissions'),
      ]);

      setVolume(state.volume);
      setEnabled(state.enabled);
      setActivePack(state.active_pack_type);
      setSelectedDevice(state.audio_device ?? '');
      setHyperKeyEnabled(state.hyper_key_enabled);
      setShortcuts(state.shortcuts);
      setBufferSize(state.buffer_size);
      setHardwareAcceleration(state.hardware_acceleration);
      setSpeedVolumeScaling(state.speed_volume_scaling);
      setShowKeyInTray(state.show_key_in_tray);
      setIsAutostart(autostart);
      setHasPermission(trusted);
    } catch (err) {
      console.error('[useSettings] fetchState failed:', err);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const devices = await invoke<string[]>('get_audio_devices');
      setAudioDevices(devices);
    } catch (err) {
      console.error('[useSettings] fetchDevices failed:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchState(), fetchDevices()]);
      const [version, platform] = await Promise.all([
        getVersion(),
        invoke<string>('get_platform'),
      ]);
      setAppVersion(version);
      setPlatformName(platform);
      setIsLoading(false);
    };
    init();

    // Poll permissions every 2 s so the shield icon updates without a restart
    const permissionInterval = setInterval(async () => {
      const trusted = await invoke<boolean>('check_permissions');
      setHasPermission(trusted);
    }, 2000);

    const unlistenStateUpdate = listen('state-update', fetchState);

    return () => {
      clearInterval(permissionInterval);
      unlistenStateUpdate.then(f => f());
    };
  }, [fetchState, fetchDevices]);

  // ----- Handlers --------------------------------------------------------

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
    if (previewingPack === id) {
      setPreviewingPack(null);
      await invoke('stop_pack_preview');
    } else {
      setPreviewingPack(id);
      await invoke('play_pack_preview', { packType: id });
    }
  };

  const handleStopPreview = async () => {
    if (previewingPack) {
      setPreviewingPack(null);
      await invoke('stop_pack_preview');
    }
  };

  useEffect(() => {
    const handleBlur = () => {
      if (previewingPack) {
        setPreviewingPack(null);
        invoke('stop_pack_preview').catch(console.error);
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [previewingPack]);

  const handleDeviceChange = async (deviceName: string) => {
    setSelectedDevice(deviceName);
    await invoke('set_audio_device', { deviceName });
  };

  const handleBufferSizeChange = async (size: number) => {
    setBufferSize(size);
    await invoke('set_buffer_size', { bufferSize: size });
  };

  const handleHardwareAccelerationToggle = async (enabled: boolean) => {
    setHardwareAcceleration(enabled);
    await invoke('set_hardware_acceleration', { enabled });
  };

  const handleShowKeyInTrayToggle = async (checked: boolean) => {
    setShowKeyInTray(checked);
    await invoke('set_show_key_in_tray', { enabled: checked });
  };

  const handleResetSettings = async () => {
    await invoke('reset_settings');
    await fetchState();
  };

  return {
    state: {
      isLoading,
      volume,
      enabled,
      isAutostart,
      activePack,
      previewingPack,
      appVersion,
      audioDevices,
      selectedDevice,
      hyperKeyEnabled,
      shortcuts,
      platformName,
      bufferSize,
      hardwareAcceleration,
      speedVolumeScaling,
      hasPermission,
      showKeyInTray,
    },
    setShortcuts,
    fetchState,
    handlers: {
      handleToggle,
      handleAutoLaunchChange,
      handleVolumeUpdate,
      handlePackChange,
      handlePlayPreview,
      handleStopPreview,
      handleDeviceChange,
      handleBufferSizeChange,
      handleHardwareAccelerationToggle,
      handleResetSettings,
      handleShowKeyInTrayToggle,
    },
  };
}
